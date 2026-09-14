-- Transaction-only synthetic fixtures. The verification script always rolls back.
do $$
declare
  test_id uuid;
  expired_id uuid;
  check_failed boolean := false;
begin
  update public.career_openings set closing_date = null where job_title = 'Embedded Systems Engineer';
  insert into public.career_applications (job_title, name, email, portfolio_url, project_summary, right_to_work, request_fingerprint)
  values ('Embedded Systems Engineer', 'Confirmation QA', 'confirmation-qa@example.invalid', 'https://example.invalid', repeat('Synthetic test. ', 7), true, repeat('0',64)) returning id into test_id;
  assert (select data_sharing_acknowledged_at is null and data_sharing_statement_version is null from public.career_applications where id = test_id), 'Legacy records must not receive fabricated confirmation';
  begin
    update public.career_applications set data_sharing_acknowledged_at = clock_timestamp() where id = test_id;
  exception when check_violation then check_failed := true; end;
  assert check_failed, 'Confirmation must include its statement version';
  update public.career_applications set data_sharing_acknowledged_at = clock_timestamp(), data_sharing_statement_version = 'recruitment-data-sharing-v1' where id = test_id;
  assert (select data_sharing_acknowledged_at is not null and data_sharing_statement_version = 'recruitment-data-sharing-v1' from public.career_applications where id = test_id);
  insert into public.career_applications (created_at, job_title, name, email, portfolio_url, project_summary, right_to_work, request_fingerprint, data_sharing_acknowledged_at, data_sharing_statement_version)
  values (clock_timestamp() - interval '4 months', 'Embedded Systems Engineer', 'Confirmation QA', 'confirmation-qa@example.invalid', 'https://example.invalid', repeat('Synthetic test. ', 7), true, repeat('0',64), clock_timestamp() - interval '4 months', 'recruitment-data-sharing-v1') returning id into expired_id;
  perform public.purge_expired_submissions();
  assert not exists (select 1 from public.career_applications where id = expired_id), 'Confirmation expires with its application';
  assert exists (select 1 from public.career_applications where id = test_id), 'Current application survives';
  assert not has_column_privilege('anon', 'public.career_applications', 'data_sharing_acknowledged_at', 'SELECT');
  assert not has_column_privilege('authenticated', 'public.career_applications', 'data_sharing_statement_version', 'SELECT');
end $$;
