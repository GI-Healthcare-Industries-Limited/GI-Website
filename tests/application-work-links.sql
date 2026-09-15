-- Run only inside the verifier's rollback transaction. No notifications.
do $$
declare test_id uuid; rejected boolean; expiry timestamptz;
begin
  assert public.application_work_links_valid('{}');
  assert public.application_work_links_valid(array['https://example.invalid/project', 'http://example.invalid/demo?q=1#work']);
  assert not public.application_work_links_valid(null);
  assert not public.application_work_links_valid(array[null]);
  assert not public.application_work_links_valid(array['']);
  assert not public.application_work_links_valid(array['javascript:alert(1)']);
  assert not public.application_work_links_valid(array['https://user:pass@example.invalid']);
  assert not public.application_work_links_valid(array_fill('https://example.invalid'::text, array[6]));
  assert not public.application_work_links_valid(array[array['https://example.invalid']]);
  assert not public.application_work_links_valid(array['https://example.invalid/' || repeat('a',2048)]);
  assert not has_column_privilege('anon','public.career_applications','work_links','SELECT');
  assert not has_column_privilege('authenticated','public.career_applications','work_links','SELECT');
  update public.career_openings set closing_date=null, accepting_applications=true where job_title='Embedded Systems Engineer';
  insert into public.career_applications(job_title,name,email,right_to_work,request_fingerprint,project_summary,biggest_failure,growth_area,awards_status,award_entries,application_questions_version,data_sharing_acknowledged_at,data_sharing_statement_version,work_links)
  values('Embedded Systems Engineer','Links QA','links-qa@example.invalid',true,repeat('0',64),'Sensor board.','A missed deadline.','Impatience.','none_yet','{}','application-questions-v2',clock_timestamp(),'recruitment-data-sharing-v2',array['https://example.invalid/project']) returning id,retention_expires_at into test_id,expiry;
  assert (select work_links=array['https://example.invalid/project'] from public.career_applications where id=test_id);
  rejected := false;
  begin update public.career_applications set work_links=array['javascript:alert(1)'] where id=test_id;
  exception when check_violation then rejected := true; end;
  assert rejected;
  update public.career_applications set work_links='{}' where id=test_id;
  assert (select retention_expires_at=expiry from public.career_applications where id=test_id), 'Links never extend retention';
  delete from public.career_applications where id=test_id;
  assert not exists(select 1 from public.career_applications where id=test_id), 'Links are removed with the parent application';
end $$;
