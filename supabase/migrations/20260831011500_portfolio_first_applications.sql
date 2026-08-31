alter table public.career_applications
  add column if not exists portfolio_url text,
  add column if not exists project_summary text,
  add column if not exists right_to_work boolean;

alter table public.career_applications
  alter column cover_letter drop not null,
  alter column cv_path drop not null,
  alter column cv_original_name drop not null,
  alter column cv_content_type drop not null;

alter table public.career_applications
  drop constraint if exists career_applications_job_title_check;

alter table public.career_applications
  add constraint career_applications_job_title_check check (
    job_title in (
      'Embedded Systems Engineer',
      'Business Development and Operations Manager',
      'Technician Intern',
      'Junior Software Developer',
      'General Application'
    )
  ),
  add constraint career_applications_portfolio_url_check check (
    portfolio_url is null or (
      char_length(portfolio_url) <= 2048
      and portfolio_url ~* '^https?://'
    )
  ),
  add constraint career_applications_project_summary_check check (
    project_summary is null or char_length(project_summary) between 80 and 800
  ),
  add constraint career_applications_right_to_work_check check (
    right_to_work is null or right_to_work = true
  );

comment on column public.career_applications.portfolio_url is 'Applicant portfolio, project, case study or relevant work URL.';
comment on column public.career_applications.project_summary is 'A concise account of one project or piece of work the applicant is proud of.';
comment on column public.career_applications.right_to_work is 'True when the applicant confirmed an existing right to work in the UK. Null denotes a legacy application.';
