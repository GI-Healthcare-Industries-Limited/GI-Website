-- Run inside a transaction/savepoint and roll back. Never persist this fixture.
do $$
declare
  test_id uuid;
  expected_error boolean;
begin
  update public.career_openings set closing_date = null where job_title = 'Embedded Systems Engineer';
  insert into public.career_applications (
    job_title, name, email, portfolio_url, project_summary, right_to_work, request_fingerprint,
    immigration_status, right_to_work_share_code, right_to_work_date_of_birth, work_permission_declared
  ) values (
    'Embedded Systems Engineer', 'Synthetic Evidence QA', 'evidence-test@example.invalid',
    'https://example.invalid', repeat('Synthetic QA only. ', 6), true, repeat('0', 64),
    'graduate', 'W12345678', date '2000-02-29', true
  ) returning id into test_id;

  expected_error := false;
  begin
    update public.career_applications set right_to_work_share_code = null where id = test_id;
  exception when check_violation then expected_error := true;
  end;
  assert expected_error, 'Share code is mandatory for non-citizen declarations';

  expected_error := false;
  begin
    update public.career_applications set right_to_work_date_of_birth = null where id = test_id;
  exception when check_violation then expected_error := true;
  end;
  assert expected_error, 'DOB is mandatory for non-citizen declarations';

  expected_error := false;
  begin
    update public.career_applications set right_to_work_share_code = 'R12345678' where id = test_id;
  exception when check_violation then expected_error := true;
  end;
  assert expected_error, 'Rent codes are not right-to-work codes';

  expected_error := false;
  begin
    update public.career_applications set immigration_status = 'student' where id = test_id;
  exception when check_violation then expected_error := true;
  end;
  assert expected_error, 'Students must acknowledge restrictions';

  update public.career_applications set immigration_status = 'student', student_conditions_acknowledged = true where id = test_id;
  assert (select student_conditions_acknowledged from public.career_applications where id = test_id);

  update public.career_applications set immigration_status = 'british_irish',
    right_to_work_share_code = null, right_to_work_date_of_birth = null,
    work_permission_declared = null, student_conditions_acknowledged = null where id = test_id;
  assert (select right_to_work_share_code is null and right_to_work_date_of_birth is null from public.career_applications where id = test_id);

  -- Deleting the application removes the evidence in the same row.
  delete from public.career_applications where id = test_id;
  assert not exists (select 1 from public.career_applications where id = test_id);
  assert not has_table_privilege('anon', 'public.career_applications', 'SELECT');
  assert (select relrowsecurity from pg_class where oid = 'public.career_applications'::regclass);
end;
$$;
