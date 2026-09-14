-- No fabricated answers or confirmation for existing applications.
alter table public.career_applications
  drop constraint career_applications_project_summary_check,
  add constraint career_applications_project_summary_check check (
    project_summary is null or char_length(btrim(project_summary)) between 80 and 2400
  ),
  add column awards_status text check (awards_status in ('listed', 'none_yet')),
  add column competition_awards text check (competition_awards is null or char_length(btrim(competition_awards)) between 10 and 1600),
  add column awards_detail text check (awards_detail is null or char_length(btrim(awards_detail)) between 60 and 800),
  add column biggest_failure text check (biggest_failure is null or char_length(btrim(biggest_failure)) between 80 and 1400),
  add column growth_area text check (growth_area is null or char_length(btrim(growth_area)) between 60 and 1000),
  add column authorship_confirmed_at timestamptz,
  add column application_questions_version text,
  add constraint career_applications_personal_answers_check check (
    (application_questions_version is null and awards_status is null and competition_awards is null
      and awards_detail is null and biggest_failure is null and growth_area is null and authorship_confirmed_at is null)
    or (application_questions_version is not null and application_questions_version = 'application-questions-v1'
      and awards_status is not null and awards_detail is not null and biggest_failure is not null
      and growth_area is not null and project_summary is not null and authorship_confirmed_at is not null
      and ((awards_status = 'listed' and competition_awards is not null)
        or (awards_status = 'none_yet' and competition_awards is null)))
  );

comment on column public.career_applications.project_summary is
  'Work examples for application-questions-v1; legacy records contain one project highlight.';
comment on column public.career_applications.authorship_confirmed_at is
  'Server receipt of applicant self-declaration that answers are their own writing and experience, not AI-generated or rewritten. Not proof or an AI detection score. Expires with the application.';
comment on column public.career_applications.awards_detail is
  'Concrete personal-contribution follow-up; awards_status identifies whether the prompt concerns an award or an extracurricular activity. No keystrokes, clipboard data, timings or accessibility preferences are collected.';
notify pgrst, 'reload schema';
