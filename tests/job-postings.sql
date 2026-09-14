-- Synthetic fixtures only. Must be run by the always-rollback verifier.
do $$
declare
  opening uuid;
  application uuid;
  expires timestamptz;
  rejected boolean := false;
begin
  insert into public.career_openings(job_title, department, description, employment_type)
  values ('Job lifecycle QA fixture', 'Testing', 'Synthetic job posting test.', 'Part-time') returning id into opening;
  assert (select is_open from public.career_opening_availability where id = opening);
  begin
    insert into public.career_openings(job_title) values ('JOB LIFECYCLE QA FIXTURE');
  exception when unique_violation then rejected := true; end;
  assert rejected, 'Duplicate titles must be rejected case-insensitively';

  insert into public.career_applications(opening_id, job_title, name, email, portfolio_url, project_summary, right_to_work, request_fingerprint)
  values (opening, 'Wrong or stale title', 'Job QA', 'job-qa@example.invalid', 'https://example.invalid', repeat('Synthetic project. ', 8), true, repeat('0',64))
  returning id, retention_expires_at into application, expires;
  assert (select job_title = 'Job lifecycle QA fixture' from public.career_applications where id = application), 'Database must store canonical title';

  update public.career_openings set job_title = 'Renamed QA fixture', accepting_applications = false where id = opening;
  assert (select not is_open from public.career_opening_availability where id = opening);
  assert (select job_title = 'Job lifecycle QA fixture' from public.career_applications where id = application), 'Rename must not rewrite historical application';
  rejected := false;
  begin
    insert into public.career_applications(opening_id, job_title, name, email, portfolio_url, project_summary, right_to_work, request_fingerprint)
    values (opening, 'Renamed QA fixture', 'Job QA', 'job-qa@example.invalid', 'https://example.invalid', repeat('Synthetic project. ', 8), true, repeat('0',64));
  exception when raise_exception then if sqlerrm = 'APPLICATION_CLOSED' then rejected := true; else raise; end if; end;
  assert rejected, 'Manual closure must block applications even without a deadline';
  update public.career_openings set accepting_applications = true where id = opening;
  assert (select is_open from public.career_opening_availability where id = opening);

  delete from public.career_openings where id = opening;
  assert (select opening_id is null and job_title = 'Job lifecycle QA fixture' and retention_expires_at = expires from public.career_applications where id = application), 'Removing a job must preserve its application and retention deadline';
  insert into public.career_openings(job_title) values ('Renamed QA fixture');
  rejected := false;
  begin
    insert into public.career_applications(opening_id, job_title, name, email, portfolio_url, project_summary, right_to_work, request_fingerprint)
    values (opening, 'Renamed QA fixture', 'Job QA', 'job-qa@example.invalid', 'https://example.invalid', repeat('Synthetic project. ', 8), true, repeat('0',64));
  exception when raise_exception then if sqlerrm = 'APPLICATION_OPENING_UNAVAILABLE' then rejected := true; else raise; end if; end;
  assert rejected, 'Stale ID must not submit to a replacement posting with the same title';
  assert not has_table_privilege('anon', 'public.career_openings', 'INSERT,UPDATE,DELETE');
  assert not has_table_privilege('authenticated', 'public.career_openings', 'INSERT,UPDATE,DELETE');
  assert has_table_privilege('service_role', 'public.career_openings', 'INSERT,UPDATE,DELETE');
end $$;
