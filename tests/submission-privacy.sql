-- Run in a transaction and ROLLBACK. No fixture or altered production date stays.
do $$
declare
  test_id uuid;
  check_failed boolean;
  item_status text;
  result jsonb;
begin
  assert public.submission_retention_expiry('2026-01-31 12:34:56+00') = '2026-04-30 12:34:56+00'::timestamptz;
  assert public.submission_retention_expiry('2023-11-30 12:00:00+00') = '2024-02-29 12:00:00+00'::timestamptz;
  assert public.submission_retention_expiry('2026-11-30 12:00:00+00') = '2027-02-28 12:00:00+00'::timestamptz;
  assert public.submission_retention_expiry('2026-08-14 09:00:00+01') = '2026-11-14 08:00:00+00'::timestamptz;
  assert not has_table_privilege('anon', 'public.career_applications', 'SELECT');
  assert not has_table_privilege('authenticated', 'public.career_applications', 'SELECT');
  assert not has_table_privilege('authenticated', 'public.contact_submissions', 'UPDATE');
  assert not has_table_privilege('authenticated', 'public.contact_submissions', 'SELECT');
  assert not has_function_privilege('anon', 'public.purge_expired_submissions()', 'EXECUTE');
  assert not has_function_privilege('authenticated', 'public.purge_expired_submissions()', 'EXECUTE');
  assert has_function_privilege('service_role', 'public.purge_expired_submissions()', 'EXECUTE');
  assert not exists (select 1 from pg_trigger where tgname = 'sync_primary_website_admin_after_auth_change');
  assert not exists (select 1 from pg_policies where schemaname = 'storage' and policyname = 'website admins can read career CVs');

  update public.career_openings set closing_date = null, start_date = date '2026-12-01'
    where job_title = 'Embedded Systems Engineer';
  assert (select is_open and start_date = date '2026-12-01' from public.career_opening_availability where job_title = 'Embedded Systems Engineer');
  update public.career_openings set start_date = null where job_title = 'Embedded Systems Engineer';
  assert (select is_open and start_date is null from public.career_opening_availability where job_title = 'Embedded Systems Engineer');

  insert into public.career_applications (job_title, name, email, portfolio_url, project_summary, right_to_work,
    request_fingerprint, immigration_status, work_permission_declared, right_to_work_share_code, right_to_work_date_of_birth)
  values ('Embedded Systems Engineer', 'Privacy QA', 'privacy-qa@example.invalid', 'https://example.invalid', repeat('Synthetic test. ', 7), true,
    repeat('0',64), 'graduate', true, 'W12345678', '2000-02-29') returning id into test_id;
  assert (select right_to_work_share_code is null and right_to_work_date_of_birth is null from public.career_applications where id = test_id), 'DB must discard stale-client evidence';
  check_failed := false;
  begin
    update public.career_applications set created_at = created_at + interval '1 day' where id = test_id;
  exception when raise_exception then check_failed := true; end;
  assert check_failed, 'Retention cannot be extended';
  check_failed := false;
  begin
    update public.career_applications set cv_path = 'test.pdf' where id = test_id;
  exception when raise_exception then check_failed := true; end;
  assert check_failed, 'No new CV references';

  foreach item_status in array array['new','reviewing','interview','rejected','hired','archived'] loop
    insert into public.career_applications (created_at, job_title, name, email, portfolio_url, project_summary, right_to_work, request_fingerprint, status)
    values (clock_timestamp() - interval '4 months', 'Embedded Systems Engineer', 'Privacy QA', 'privacy-qa@example.invalid', 'https://example.invalid', repeat('Synthetic test. ',7), true, repeat('0',64), item_status);
  end loop;
  foreach item_status in array array['new','in_progress','resolved','archived'] loop
    insert into public.contact_submissions (created_at, name, email, message, request_fingerprint, status)
    values (clock_timestamp() - interval '4 months', 'Privacy QA', 'privacy-qa@example.invalid', 'Synthetic retention test only.', repeat('0',64), item_status);
  end loop;
  insert into public.contact_submissions (created_at, name, email, message, request_fingerprint)
    values (clock_timestamp() - interval '3 days', 'Privacy QA', 'privacy-qa@example.invalid', 'Synthetic retention test only.', repeat('0',64));
  result := public.purge_expired_submissions();
  assert (result->>'applicationsDeleted')::integer >= 6;
  assert (result->>'enquiriesDeleted')::integer >= 4;
  assert not exists (select 1 from public.career_applications where retention_expires_at <= clock_timestamp());
  assert not exists (select 1 from public.contact_submissions where retention_expires_at <= clock_timestamp());
  assert exists (select 1 from public.career_applications where id = test_id), 'Recent candidate survives';
  assert not exists (select 1 from public.contact_submissions where created_at < clock_timestamp() - interval '2 days' and request_fingerprint is not null);
  assert exists (select 1 from public.submission_retention_health where last_success_at > clock_timestamp() - interval '1 minute');
  assert exists (select 1 from cron.job where jobname = 'gi-submission-retention' and active and schedule = '* * * * *');
end $$;
