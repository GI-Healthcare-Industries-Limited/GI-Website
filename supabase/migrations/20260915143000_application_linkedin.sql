-- Additive: never repurpose phone or alter existing submissions. New forms
-- require LinkedIn; earlier versions remain compatible during deployment.
alter table public.career_applications
  add column linkedin_url text,
  add constraint career_applications_linkedin_url_check check (
    linkedin_url is null or (
      char_length(linkedin_url) <= 2048
      and linkedin_url ~ '^https://www[.]linkedin[.]com/in/[A-Za-z0-9_%\-]+/$'
    )
  ),
  add constraint career_applications_v4_linkedin_required check (
    privacy_notice_version is distinct from '2026-09-15-applications-v4'
    or linkedin_url is not null
  );

comment on column public.career_applications.linkedin_url is
  'Required LinkedIn profile URL on application form v4 onwards; NULL for earlier applications. No profile is fetched automatically. Same restricted admin access and three-calendar-month deletion as its parent row.';

notify pgrst, 'reload schema';
