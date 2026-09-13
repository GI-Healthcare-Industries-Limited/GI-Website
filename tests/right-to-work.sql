-- Run inside a transaction and roll back. Initial applications deliberately
-- collect declarations only; DOB and share codes are for a later employer check.
do $$
declare test_id uuid; expected_error boolean := false;
begin
  update public.career_openings set closing_date = null where job_title = 'Embedded Systems Engineer';
  insert into public.career_applications (job_title, name, email, portfolio_url, project_summary,
    right_to_work, request_fingerprint, immigration_status, work_permission_declared)
  values ('Embedded Systems Engineer', 'Synthetic QA', 'qa@example.invalid', 'https://example.invalid',
    repeat('Synthetic declaration test. ', 4), true, repeat('0',64), 'graduate', true)
  returning id into test_id;
  assert (select right_to_work_share_code is null and right_to_work_date_of_birth is null from public.career_applications where id = test_id);
  begin
    update public.career_applications set immigration_status = 'student' where id = test_id;
  exception when check_violation then expected_error := true; end;
  assert expected_error, 'Student restrictions must be acknowledged';
  update public.career_applications set immigration_status = 'student', student_conditions_acknowledged = true where id = test_id;
  update public.career_applications set immigration_status = 'british_irish',
    work_permission_declared = null, student_conditions_acknowledged = null where id = test_id;
  assert (select right_to_work_share_code is null and right_to_work_date_of_birth is null from public.career_applications where id = test_id);
  delete from public.career_applications where id = test_id;
  assert not exists (select 1 from public.career_applications where id = test_id);
  assert not has_table_privilege('anon','public.career_applications','SELECT');
end $$;
