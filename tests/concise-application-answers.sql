-- Rollback-only synthetic fixtures; also test v1 fixtures after the migration.
do $$
declare test_id uuid; expired_id uuid; rejected boolean; words text; separator text;
begin
  foreach separator in array array[' ', E'\t', E'\n', chr(160), chr(8239), chr(65279)] loop
    assert public.application_word_count('one' || separator || 'two') = 2;
  end loop;
  assert public.application_word_count('') = 0;
  assert public.application_word_count(E' \t\n') = 0;
  assert public.application_word_count('hands-on https://example.invalid') = 2;
  update public.career_openings set closing_date = null, accepting_applications = true where job_title = 'Embedded Systems Engineer';
  insert into public.career_applications(job_title,name,email,right_to_work,request_fingerprint,project_summary,biggest_failure,growth_area,awards_status,award_entries,application_questions_version,data_sharing_acknowledged_at,data_sharing_statement_version)
  values('Embedded Systems Engineer','Compact QA','compact-qa@example.invalid',true,repeat('0',64),'A sensor board.','I missed a deadline.','Impatience.','listed',array['First prize, synthetic challenge, 2025.'],'application-questions-v2',clock_timestamp(),'recruitment-data-sharing-v2') returning id into test_id;
  assert (select authorship_confirmed_at is null and awards_detail is null and competition_awards is null from public.career_applications where id=test_id);
  words := repeat('word ',20);
  update public.career_applications set award_entries=array[words] where id=test_id;
  rejected := false;
  begin update public.career_applications set award_entries=array[words||'extra'] where id=test_id;
  exception when check_violation then rejected := true; end;
  assert rejected, '21-word award must fail';
  rejected := false;
  begin update public.career_applications set award_entries=array[' '] where id=test_id;
  exception when check_violation then rejected := true; end;
  assert rejected, 'Blank award must fail';
  rejected := false;
  begin update public.career_applications set biggest_failure=repeat('word ',51) where id=test_id;
  exception when check_violation then rejected := true; end;
  assert rejected, '51-word failure must fail';
  rejected := false;
  begin update public.career_applications set growth_area=repeat('word ',41) where id=test_id;
  exception when check_violation then rejected := true; end;
  assert rejected, '41-word flaw must fail';
  rejected := false;
  begin update public.career_applications set project_summary=repeat('word ',81) where id=test_id;
  exception when check_violation then rejected := true; end;
  assert rejected, '81-word work answer must fail';
  update public.career_applications set awards_status='none_yet',award_entries='{}' where id=test_id;
  assert (select cardinality(award_entries)=0 from public.career_applications where id=test_id);
  assert not has_column_privilege('anon','public.career_applications','award_entries','SELECT');
  assert not has_column_privilege('authenticated','public.career_applications','award_entries','SELECT');
  insert into public.career_applications(created_at,job_title,name,email,right_to_work,request_fingerprint,project_summary,biggest_failure,growth_area,awards_status,award_entries,application_questions_version,data_sharing_acknowledged_at,data_sharing_statement_version)
  select clock_timestamp()-interval '4 months',job_title,name,email,right_to_work,request_fingerprint,project_summary,biggest_failure,growth_area,awards_status,award_entries,application_questions_version,data_sharing_acknowledged_at,data_sharing_statement_version
  from public.career_applications where id=test_id returning id into expired_id;
  perform public.purge_expired_submissions();
  assert not exists(select 1 from public.career_applications where id=expired_id), 'Award cards expire with the application';
  assert exists(select 1 from public.career_applications where id=test_id), 'Current application survives';
end $$;
