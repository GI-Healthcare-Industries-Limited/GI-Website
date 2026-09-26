-- Additive only: existing invitations and bookings keep their identifiers and links.
alter table public.interview_settings add column email_enabled boolean not null default false;
alter table public.interview_invitations add column shared_booking boolean not null default false;
alter table public.interview_bookings add column request_fingerprint text;

create function public.shared_interview_slots()
returns table(starts_at timestamptz) language sql stable security definer set search_path='' as $$
  select distinct t.slot from public.interview_settings s
    join public.interview_availability a on a.day between (now() at time zone 'Europe/London')::date and (now() at time zone 'Europe/London')::date+60
    cross join lateral generate_series((a.day+a.start_time) at time zone 'Europe/London',
      ((a.day+a.end_time) at time zone 'Europe/London')-make_interval(mins=>s.duration_minutes),
      make_interval(mins=>s.duration_minutes+s.buffer_minutes)) t(slot)
  where s.enabled and s.teams_url<>'' and t.slot>=now()+make_interval(hours=>s.notice_hours)
    and not exists(select 1 from public.interview_bookings b where b.cancelled_at is null
      and tstzrange(b.starts_at,b.blocked_until,'[)') && tstzrange(t.slot,t.slot+make_interval(mins=>s.duration_minutes+s.buffer_minutes),'[)'))
  order by t.slot limit 4000;
$$;
create function public.book_shared_interview(invitation_hash text, requested_start timestamptz, candidate_name text, candidate_email text, fingerprint text)
returns uuid language plpgsql security definer set search_path='' as $$
declare s public.interview_settings%rowtype; result uuid; existing public.interview_invitations%rowtype;
begin
  perform pg_advisory_xact_lock(73490162);
  select * into existing from public.interview_invitations where token_hash=invitation_hash;
  if found then
    if not existing.shared_booking then raise exception 'INVITATION_UNAVAILABLE'; end if;
    return public.book_interview(invitation_hash,requested_start,candidate_name,candidate_email);
  end if;
  if invitation_hash !~ '^[0-9a-f]{64}$' or fingerprint !~ '^[0-9a-f]{64}$' then raise exception 'INVALID_BOOKING'; end if;
  -- Bound anonymous abuse atomically. No raw network address is stored.
  if (select count(*) from public.interview_bookings where created_at>now()-interval '1 hour' and request_fingerprint=fingerprint)>=5
     or (select count(*) from public.interview_bookings where created_at>now()-interval '1 day' and lower(email)=lower(btrim(candidate_email)))>=3 then raise exception 'BOOKING_LIMIT'; end if;
  select * into s from public.interview_settings for share;
  if not exists(select 1 from public.shared_interview_slots() a where a.starts_at=requested_start) then raise exception 'SLOT_UNAVAILABLE'; end if;
  insert into public.interview_invitations(token_hash,title,duration_minutes,buffer_minutes,expires_at,retention_expires_at,shared_booking)
    values(invitation_hash,'Meet with GI Healthcare',s.duration_minutes,s.buffer_minutes,now()+interval '61 days',public.submission_retention_expiry(now()),true);
  result:=public.book_interview(invitation_hash,requested_start,candidate_name,candidate_email);
  update public.interview_bookings set request_fingerprint=fingerprint where id=result;
  return result;
end;
$$;

-- Transactional outbox: email failure can never discard a confirmed booking.
create table public.interview_email_outbox (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.interview_bookings(id) on delete cascade,
  kind text not null check(kind in ('confirmation','cancellation')),
  created_at timestamptz not null default now(),
  first_attempt_at timestamptz, leased_until timestamptz,
  sent_at timestamptz, provider_id text, attempts integer not null default 0,
  last_error text, payload jsonb,
  skipped_at timestamptz,
  unique(booking_id,kind)
);
alter table public.interview_email_outbox enable row level security;
revoke all on public.interview_email_outbox from public,anon,authenticated;
grant select,insert,update,delete on public.interview_email_outbox to service_role;
create function public.queue_interview_email() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if (select email_enabled from public.interview_settings) then
    if TG_OP='INSERT' then
      insert into public.interview_email_outbox(booking_id,kind) values(new.id,'confirmation') on conflict do nothing;
    elsif old.cancelled_at is null and new.cancelled_at is not null then
      update public.interview_email_outbox set skipped_at=now() where booking_id=new.id and kind='confirmation' and first_attempt_at is null;
      insert into public.interview_email_outbox(booking_id,kind) values(new.id,'cancellation') on conflict do nothing;
    end if;
  end if;
  return new;
end;
$$;
create trigger interview_email_queue after insert or update of cancelled_at on public.interview_bookings for each row execute function public.queue_interview_email();
create function public.claim_interview_email() returns setof public.interview_email_outbox language sql volatile security definer set search_path='' as $$
  update public.interview_email_outbox set leased_until=now()+interval '2 minutes',first_attempt_at=coalesce(first_attempt_at,now()),attempts=attempts+1
  where id=(select o.id from public.interview_email_outbox o
    join public.interview_bookings b on b.id=o.booking_id
    join public.interview_invitations i on i.id=b.invitation_id
    where o.sent_at is null and o.skipped_at is null and (o.leased_until is null or o.leased_until<now())
      and o.created_at>now()-interval '23 hours' and o.attempts<8
      and (o.kind='cancellation' or b.cancelled_at is null)
      and i.retention_expires_at>now()+interval '5 minutes'
      and (select email_enabled from public.interview_settings)
    order by o.created_at for update of o skip locked limit 1)
  returning *;
$$;
revoke all on function public.shared_interview_slots(),public.book_shared_interview(text,timestamptz,text,text,text),public.queue_interview_email(),public.claim_interview_email() from public,anon,authenticated;
grant execute on function public.shared_interview_slots(),public.book_shared_interview(text,timestamptz,text,text,text),public.claim_interview_email() to service_role;
create or replace function public.purge_expired_interviews()
returns void language plpgsql security definer set search_path='' as $$
begin
  delete from public.interview_invitations where retention_expires_at<=clock_timestamp()+interval '5 minutes';
  delete from public.interview_availability where day<(clock_timestamp() at time zone 'Europe/London')::date;
  update public.interview_bookings set request_fingerprint=null where created_at<clock_timestamp()-interval '2 days' and request_fingerprint is not null;
  delete from cron.job_run_details where jobid in (select jobid from cron.job where jobname='gi-interview-retention') and end_time<clock_timestamp()-interval '7 days';
end;
$$;
notify pgrst,'reload schema';
create or replace function public.interview_available_slots(invitation_hash text)
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
  order by t.slot limit 4000;
$$;
create function public.stamp_interview_notice() returns trigger language plpgsql set search_path='' as $$
begin new.privacy_notice_version:='2026-09-26-interviews-v2'; return new; end;
$$;
revoke all on function public.stamp_interview_notice() from public,anon,authenticated;
create trigger interview_notice before insert on public.interview_bookings for each row execute function public.stamp_interview_notice();
