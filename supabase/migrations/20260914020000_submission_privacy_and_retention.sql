-- Owner policy: ALL applications and enquiries, every status, expire three
-- calendar months from submission. Not a statutory employment-record rule.
-- Refuse to retire evidence if this database differs from the empty preflight.
do $$ begin
  if exists (select 1 from public.career_applications where cv_path is not null
      or right_to_work_share_code is not null or right_to_work_date_of_birth is not null)
    or exists (select 1 from storage.objects where bucket_id = 'career-cvs') then
    raise exception 'Legacy evidence exists: review and clean up securely before this migration';
  end if;
end $$;

create extension if not exists pg_cron;
create function public.submission_retention_expiry(submitted_at timestamptz)
returns timestamptz language sql immutable strict set search_path = '' as $$
  select ((submitted_at at time zone 'UTC') + interval '3 months') at time zone 'UTC';
$$;
revoke all on function public.submission_retention_expiry(timestamptz) from public, anon, authenticated;
grant execute on function public.submission_retention_expiry(timestamptz) to service_role;

alter table public.career_applications
  add column retention_expires_at timestamptz generated always as (public.submission_retention_expiry(created_at)) stored,
  add column privacy_notice_version text check (char_length(privacy_notice_version) <= 40),
  add column privacy_notice_provided_at timestamptz,
  alter column request_fingerprint drop not null;
alter table public.contact_submissions
  add column retention_expires_at timestamptz generated always as (public.submission_retention_expiry(created_at)) stored,
  add column privacy_notice_version text check (char_length(privacy_notice_version) <= 40),
  add column privacy_notice_provided_at timestamptz,
  alter column request_fingerprint drop not null;
create index career_applications_retention_idx on public.career_applications (retention_expires_at);
create index contact_submissions_retention_idx on public.contact_submissions (retention_expires_at);
comment on column public.career_applications.privacy_notice_version is 'Notice supplied by submitting client. Not consent or proof it was read. NULL is a legacy record.';
comment on column public.contact_submissions.privacy_notice_version is 'Notice supplied by submitting client. Not consent or proof it was read. NULL is a legacy record.';

alter table public.career_applications drop constraint career_applications_evidence_check;
alter table public.career_applications add constraint career_applications_declaration_check check (
  (immigration_status is null and work_permission_declared is null and student_conditions_acknowledged is null)
  or (immigration_status = 'british_irish' and right_to_work is true
    and work_permission_declared is null and student_conditions_acknowledged is null)
  or (immigration_status is not null and immigration_status <> 'british_irish'
    and right_to_work is true and work_permission_declared is true
    and ((immigration_status = 'student' and student_conditions_acknowledged is true)
      or (immigration_status <> 'student' and student_conditions_acknowledged is null)))
);
-- Nullable legacy columns stay for deploy compatibility, but no longer store
-- evidence even if a stale client or accidentally reverted API submits it.
create function public.minimise_application_evidence()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.right_to_work_share_code = null;
  new.right_to_work_date_of_birth = null;
  if new.cv_path is not null or new.cv_original_name is not null or new.cv_content_type is not null then
    raise exception 'CV uploads are no longer accepted';
  end if;
  return new;
end;
$$;
create trigger minimise_application_evidence before insert or update on public.career_applications
  for each row execute function public.minimise_application_evidence();
alter table public.career_applications add constraint career_applications_no_initial_evidence check (
  right_to_work_share_code is null and right_to_work_date_of_birth is null
  and cv_path is null and cv_original_name is null and cv_content_type is null
);

create function public.prevent_submission_retention_extension()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.created_at is distinct from old.created_at then
    raise exception 'Submission time cannot be changed to extend retention';
  end if;
  return new;
end;
$$;
create trigger prevent_application_retention_extension before update on public.career_applications
  for each row execute function public.prevent_submission_retention_extension();
create trigger prevent_contact_retention_extension before update on public.contact_submissions
  for each row execute function public.prevent_submission_retention_extension();

-- All private inbox access now goes through authorised, expiry-filtered APIs.
revoke all on public.career_applications, public.contact_submissions from anon, authenticated;
drop policy if exists "website admins can read career CVs" on storage.objects;
-- Admin provisioning was for bootstrap only. Email alone must not grant a new
-- Auth record admin access. Existing explicit website_admins membership remains.
drop trigger if exists sync_primary_website_admin_after_auth_change on auth.users;
drop function if exists public.sync_primary_website_admin();

create table public.submission_retention_health (
  id boolean primary key default true check (id),
  last_success_at timestamptz not null,
  applications_deleted integer not null check (applications_deleted >= 0),
  enquiries_deleted integer not null check (enquiries_deleted >= 0)
);
alter table public.submission_retention_health enable row level security;
revoke all on public.submission_retention_health from anon, authenticated;
grant select on public.submission_retention_health to service_role;

create function public.purge_expired_submissions()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  run_time timestamptz := clock_timestamp();
  application_count integer;
  enquiry_count integer;
begin
  -- Five-minute early margin accommodates ordinary scheduler jitter. No status
  -- exemptions; no personal data is copied into a deletion log or archive.
  delete from public.career_applications where retention_expires_at <= run_time + interval '5 minutes';
  get diagnostics application_count = row_count;
  delete from public.contact_submissions where retention_expires_at <= run_time + interval '5 minutes';
  get diagnostics enquiry_count = row_count;
  update public.career_applications set request_fingerprint = null
    where request_fingerprint is not null and created_at < run_time - interval '2 days';
  update public.contact_submissions set request_fingerprint = null
    where request_fingerprint is not null and created_at < run_time - interval '2 days';
  insert into public.submission_retention_health (id, last_success_at, applications_deleted, enquiries_deleted)
    values (true, run_time, application_count, enquiry_count)
    on conflict (id) do update set last_success_at = excluded.last_success_at,
      applications_deleted = excluded.applications_deleted, enquiries_deleted = excluded.enquiries_deleted;
  delete from cron.job_run_details where jobid in (
    select jobid from cron.job where jobname = 'gi-submission-retention'
  ) and end_time < run_time - interval '7 days';
  return jsonb_build_object('checkedAt', run_time, 'applicationsDeleted', application_count, 'enquiriesDeleted', enquiry_count);
end;
$$;
revoke all on function public.purge_expired_submissions() from public, anon, authenticated;
grant execute on function public.purge_expired_submissions() to service_role;
select cron.schedule('gi-submission-retention', '* * * * *', 'select public.purge_expired_submissions();');
select public.purge_expired_submissions();
notify pgrst, 'reload schema';
