-- Additive and nullable for historical forms. No existing answers are rewritten.
alter table public.career_applications
  add column education jsonb,
  add constraint career_applications_education_check check (
    education is null or coalesce(
      jsonb_typeof(education) = 'object' and case education->>'status'
        when 'student' then
          jsonb_typeof(education->'degree') = 'string'
          and char_length(btrim(education->>'degree')) between 1 and 120
          and jsonb_typeof(education->'studyYear') = 'string'
          and char_length(btrim(education->>'studyYear')) between 1 and 40
          and education - array['status', 'degree', 'studyYear'] = '{}'::jsonb
        when 'graduate' then
          jsonb_typeof(education->'graduationYear') = 'string'
          and education->>'graduationYear' ~ '^(19|[2-9][0-9])[0-9]{2}$'
          and education - array['status', 'graduationYear'] = '{}'::jsonb
        else false
      end, false
    )
  ),
  add constraint career_applications_v5_education_required check (
    privacy_notice_version is distinct from '2026-09-16-applications-v5'
    or (education is not null and linkedin_url is not null)
  );

comment on column public.career_applications.education is
  'Student degree/year or graduate graduation year, required on application form v5. NULL for earlier forms. Restricted admin access and same three-calendar-month deletion as parent row.';

notify pgrst, 'reload schema';
