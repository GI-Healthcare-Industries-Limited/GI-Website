-- Additive fields: historical applications are never rewritten.
alter table public.career_openings add column section_three_questions jsonb
  check (section_three_questions is null or (jsonb_typeof(section_three_questions)='array' and jsonb_array_length(section_three_questions) between 1 and 12 and octet_length(section_three_questions::text)<=16000));
alter table public.career_applications add column question_snapshot jsonb
  check (question_snapshot is null or (jsonb_typeof(question_snapshot)='object' and jsonb_typeof(question_snapshot->'questions')='array' and jsonb_typeof(question_snapshot->'answers')='object' and octet_length(question_snapshot::text)<=65000));

-- Preserve the exact existing legacy constraint, extending it for snapshots.
do $$ declare old_expression text; begin
  select pg_get_expr(conbin,conrelid) into strict old_expression from pg_constraint
    where conrelid='public.career_applications'::regclass and conname='career_applications_personal_answers_check';
  alter table public.career_applications drop constraint career_applications_personal_answers_check;
  execute 'alter table public.career_applications add constraint career_applications_personal_answers_check check ((' || old_expression || ') or (application_questions_version = ''role-questions-v1'' and question_snapshot is not null and project_summary is null and awards_status is null and award_entries is null and biggest_failure is null and growth_area is null and data_sharing_acknowledged_at is not null and data_sharing_statement_version = ''recruitment-data-sharing-v2''))';
end $$;
alter table public.career_applications add constraint role_questions_snapshot_version check (
  (application_questions_version is not distinct from 'role-questions-v1') = (question_snapshot is not null)
);
alter table public.career_applications add constraint career_applications_v7_details_required check (
  privacy_notice_version is distinct from '2026-09-16-applications-v7' or (education is not null and linkedin_url is not null)
);

create or replace view public.career_opening_availability with (security_invoker = true) as
select job_title, closing_date,
  ((closing_date + 1)::timestamp at time zone 'Europe/London') as closes_at,
  (accepting_applications and (closing_date is null or clock_timestamp() <
    ((closing_date + 1)::timestamp at time zone 'Europe/London'))) as is_open,
  start_date, id, location, department, employment_type, description,
  accepting_applications, created_at, updated_at, education_eligibility, section_three_questions
from public.career_openings;

create or replace function public.enforce_career_closing_date()
returns trigger language plpgsql set search_path = public as $$
declare opening public.career_openings%rowtype;
begin
  if new.opening_id is not null then
    select * into opening from public.career_openings where id = new.opening_id for share;
  else
    select * into opening from public.career_openings where job_title = new.job_title for share;
  end if;
  if not found then raise exception 'APPLICATION_OPENING_UNAVAILABLE' using errcode = 'P0001'; end if;
  if not opening.accepting_applications or (opening.closing_date is not null and
    clock_timestamp() >= ((opening.closing_date + 1)::timestamp at time zone 'Europe/London')) then
    raise exception 'APPLICATION_CLOSED' using errcode = 'P0001';
  end if;
  if opening.education_eligibility <> 'all' and (new.education->>'status') is distinct from opening.education_eligibility then
    raise exception 'EDUCATION_NOT_ELIGIBLE' using errcode = 'P0001';
  end if;
  if opening.section_three_questions is not null then
    if new.application_questions_version is distinct from 'role-questions-v1' or
      (new.question_snapshot->'questions') is distinct from opening.section_three_questions then
      raise exception 'QUESTIONS_CHANGED' using errcode = 'P0001';
    end if;
  elsif new.question_snapshot is not null then
    raise exception 'QUESTIONS_CHANGED' using errcode = 'P0001';
  end if;
  new.opening_id := opening.id;
  new.job_title := opening.job_title;
  return new;
end;
$$;
comment on column public.career_applications.question_snapshot is 'Server-validated Section 3 question definitions and answers at submission. Immutable under subsequent posting edits; same application retention.';
notify pgrst, 'reload schema';
