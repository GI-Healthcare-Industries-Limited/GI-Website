-- Synthetic fixtures only. The verifier always rolls this transaction back.
do $$
declare
  test_id uuid;
  expired_id uuid;
  field_name text;
  rejected boolean;
begin
  update public.career_openings set closing_date = null, accepting_applications = true where job_title = 'Embedded Systems Engineer';
  insert into public.career_applications(job_title, name, email, project_summary, right_to_work, request_fingerprint)
  values ('Embedded Systems Engineer','Personal answers QA','answers-qa@example.invalid',repeat('Synthetic work example. ',50),true,repeat('0',64)) returning id into test_id;
  assert (select portfolio_url is null and awards_status is null and authorship_confirmed_at is null from public.career_applications where id = test_id), 'Portfolio must be optional; legacy answers must not be fabricated';
  update public.career_applications set
    awards_status = 'none_yet', awards_detail = repeat('Synthetic activity. ',5),
    biggest_failure = repeat('Synthetic setback and lesson. ',5), growth_area = repeat('Synthetic habit and improvement. ',4),
    application_questions_version = 'application-questions-v1', authorship_confirmed_at = clock_timestamp()
  where id = test_id;
  assert (select awards_status = 'none_yet' and competition_awards is null from public.career_applications where id = test_id);
  foreach field_name in array array['awards_status','awards_detail','biggest_failure','growth_area','project_summary','authorship_confirmed_at','application_questions_version'] loop
    rejected := false;
    begin
      execute format('update public.career_applications set %I = null where id = $1',field_name) using test_id;
    exception when check_violation then rejected := true; end;
    assert rejected, 'A versioned application must keep all its required answers and declaration';
  end loop;
  rejected := false;
  begin
    update public.career_applications set awards_status = 'listed' where id = test_id;
  exception when check_violation then rejected := true; end;
  assert rejected, 'Listed awards must include the list';
  update public.career_applications set awards_status = 'listed', competition_awards = 'Synthetic challenge, QA organiser, 2025, first prize; built the test rig.' where id = test_id;
  rejected := false;
  begin
    update public.career_applications set biggest_failure = repeat(' ',100) where id = test_id;
  exception when check_violation then rejected := true; end;
  assert rejected, 'Whitespace is not an answer';
  assert not has_column_privilege('anon','public.career_applications','biggest_failure','SELECT');
  assert not has_column_privilege('authenticated','public.career_applications','growth_area','SELECT');

  insert into public.career_applications(created_at,job_title,name,email,project_summary,right_to_work,request_fingerprint,awards_status,competition_awards,awards_detail,biggest_failure,growth_area,application_questions_version,authorship_confirmed_at)
  select clock_timestamp()-interval '4 months',job_title,name,email,project_summary,right_to_work,request_fingerprint,awards_status,competition_awards,awards_detail,biggest_failure,growth_area,application_questions_version,authorship_confirmed_at
  from public.career_applications where id = test_id returning id into expired_id;
  perform public.purge_expired_submissions();
  assert not exists(select 1 from public.career_applications where id = expired_id), 'New answers must expire with their application';
  assert exists(select 1 from public.career_applications where id = test_id), 'Current answers must survive';
end $$;
