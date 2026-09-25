-- Private, single-use interview invitations. No changes to existing submissions.
create table public.interview_settings (
  id boolean primary key default true check(id),
  enabled boolean not null default false,
  teams_url text not null default '' check(length(teams_url) <= 2048),
  duration_minutes integer not null default 30 check(duration_minutes in (15,30,45,60)),
  buffer_minutes integer not null default 10 check(buffer_minutes in (0,10,15,30)),
  notice_hours integer not null default 24 check(notice_hours between 1 and 168),
  updated_at timestamptz not null default now()
);
insert into public.interview_settings(id) values(true);
create table public.interview_availability (
  id uuid primary key default gen_random_uuid(),
  day date not null, start_time time not null, end_time time not null,
  check(start_time >= time '06:00' and end_time <= time '22:00' and end_time > start_time),
  unique(day,start_time,end_time)
);
create table public.interview_invitations (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique check(token_hash ~ '^[0-9a-f]{64}$'),
  application_id uuid references public.career_applications(id) on delete cascade,
  title text not null check(length(title) between 2 and 120),
  duration_minutes integer not null check(duration_minutes in (15,30,45,60)),
  buffer_minutes integer not null check(buffer_minutes in (0,10,15,30)),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  retention_expires_at timestamptz not null,
  revoked boolean not null default false,
  check(expires_at <= retention_expires_at and expires_at > created_at)
);
create table public.interview_bookings (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null unique references public.interview_invitations(id) on delete cascade,
  name text not null check(length(name) between 2 and 120),
  email text not null check(length(email) between 3 and 254),
  starts_at timestamptz not null, ends_at timestamptz not null, blocked_until timestamptz not null,
  teams_url text not null check(length(teams_url) between 10 and 2048),
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  privacy_notice_version text not null,
  check(ends_at > starts_at and blocked_until >= ends_at)
);
create index interview_bookings_time_idx on public.interview_bookings(starts_at,blocked_until) where cancelled_at is null;
create index interview_invitations_retention_idx on public.interview_invitations(retention_expires_at);
alter table public.interview_settings enable row level security;
alter table public.interview_availability enable row level security;
alter table public.interview_invitations enable row level security;
alter table public.interview_bookings enable row level security;
revoke all on public.interview_settings, public.interview_availability, public.interview_invitations, public.interview_bookings from public, anon, authenticated;
grant select,insert,update,delete on public.interview_settings, public.interview_availability, public.interview_invitations, public.interview_bookings to service_role;

create function public.interview_available_slots(invitation_hash text)
returns table(starts_at timestamptz) language sql stable security definer set search_path = '' as $$
  select distinct t.slot from public.interview_invitations i
    cross join public.interview_settings s
    join public.interview_availability a on a.day between (now() at time zone 'Europe/London')::date and (now() at time zone 'Europe/London')::date + 60
    cross join lateral generate_series(
      (a.day + a.start_time) at time zone 'Europe/London',
      ((a.day + a.end_time) at time zone 'Europe/London') - make_interval(mins => i.duration_minutes),
      make_interval(mins => i.duration_minutes + i.buffer_minutes)
    ) t(slot)
  where i.token_hash = invitation_hash and not i.revoked and i.expires_at > now() and i.retention_expires_at > now()
    and s.enabled and s.teams_url <> ''
    and t.slot >= now() + make_interval(hours => s.notice_hours)
    and t.slot + make_interval(mins => i.duration_minutes) < least(i.expires_at,i.retention_expires_at)
    and not exists(select 1 from public.interview_bookings own_booking where own_booking.invitation_id=i.id)
    and not exists(select 1 from public.interview_bookings b where b.cancelled_at is null
      and tstzrange(b.starts_at,b.blocked_until,'[)') && tstzrange(t.slot,t.slot + make_interval(mins => i.duration_minutes + i.buffer_minutes),'[)'))
  order by t.slot limit 500;
$$;

create function public.book_interview(invitation_hash text, requested_start timestamptz, candidate_name text, candidate_email text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare i public.interview_invitations%rowtype; s public.interview_settings%rowtype; existing public.interview_bookings%rowtype; result uuid;
begin
  -- One owner calendar. All competing bookings serialize, including different invitations.
  perform pg_advisory_xact_lock(73490162);
  select * into i from public.interview_invitations where token_hash=invitation_hash for update;
  if not found or i.revoked or i.retention_expires_at <= clock_timestamp() then raise exception 'INVITATION_UNAVAILABLE'; end if;
  select * into existing from public.interview_bookings where invitation_id=i.id;
  if found then
    -- Retry after a lost response is idempotent; never create a second booking.
    if existing.cancelled_at is null and existing.starts_at=requested_start and lower(existing.email)=lower(btrim(candidate_email)) then return existing.id; end if;
    raise exception 'INVITATION_ALREADY_USED';
  end if;
  if i.expires_at <= clock_timestamp() then raise exception 'INVITATION_UNAVAILABLE'; end if;
  if i.application_id is not null and not exists(select 1 from public.career_applications a where a.id=i.application_id and lower(a.email)=lower(btrim(candidate_email)) and a.retention_expires_at>clock_timestamp()) then raise exception 'CANDIDATE_EMAIL_MISMATCH'; end if;
  select * into s from public.interview_settings for share;
  if not exists(select 1 from public.interview_available_slots(invitation_hash) a where a.starts_at=requested_start) then raise exception 'SLOT_UNAVAILABLE'; end if;
  insert into public.interview_bookings(invitation_id,name,email,starts_at,ends_at,blocked_until,teams_url,privacy_notice_version)
    values(i.id,btrim(candidate_name),lower(btrim(candidate_email)),requested_start,requested_start+make_interval(mins=>i.duration_minutes),requested_start+make_interval(mins=>i.duration_minutes+i.buffer_minutes),s.teams_url,'2026-09-25-interviews-v1') returning id into result;
  return result;
end;
$$;

create function public.purge_expired_interviews()
returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from public.interview_invitations where retention_expires_at <= clock_timestamp() + interval '5 minutes';
  delete from public.interview_availability where day < (clock_timestamp() at time zone 'Europe/London')::date;
  delete from cron.job_run_details where jobid in (select jobid from cron.job where jobname='gi-interview-retention') and end_time < clock_timestamp()-interval '7 days';
end;
$$;
create function public.revoke_interview_invitation(invitation_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(73490162);
  if exists(select 1 from public.interview_bookings where interview_bookings.invitation_id=revoke_interview_invitation.invitation_id) then raise exception 'INVITATION_ALREADY_USED'; end if;
  update public.interview_invitations set revoked=true where id=invitation_id;
end;
$$;
revoke all on function public.revoke_interview_invitation(uuid) from public, anon, authenticated;
grant execute on function public.revoke_interview_invitation(uuid) to service_role;
revoke all on function public.interview_available_slots(text), public.book_interview(text,timestamptz,text,text), public.purge_expired_interviews() from public, anon, authenticated;
grant execute on function public.interview_available_slots(text), public.book_interview(text,timestamptz,text,text), public.purge_expired_interviews() to service_role;
select cron.schedule('gi-interview-retention','* * * * *','select public.purge_expired_interviews();');
notify pgrst, 'reload schema';
