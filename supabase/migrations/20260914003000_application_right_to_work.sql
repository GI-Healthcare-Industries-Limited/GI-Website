-- Additive: legacy applications remain unchanged. Evidence is never a verified
-- immigration decision; the employer must perform the appropriate manual check.
alter table public.career_applications
  add column immigration_status text,
  add column right_to_work_share_code text,
  add column right_to_work_date_of_birth date,
  add column work_permission_declared boolean,
  add column student_conditions_acknowledged boolean;

alter table public.career_applications
  add constraint career_applications_immigration_status_check check (
    immigration_status is null or immigration_status in (
      'british_irish', 'graduate', 'student', 'settlement', 'eu_settlement',
      'global_talent', 'hpi', 'youth_mobility', 'ancestry', 'family_dependant', 'other_permission'
    )
  ),
  add constraint career_applications_evidence_check check (
    (immigration_status is null and right_to_work_share_code is null
      and right_to_work_date_of_birth is null and work_permission_declared is null
      and student_conditions_acknowledged is null)
    or (immigration_status = 'british_irish' and right_to_work is true
      and right_to_work_share_code is null and right_to_work_date_of_birth is null
      and work_permission_declared is null and student_conditions_acknowledged is null)
    or (immigration_status is not null and immigration_status <> 'british_irish'
      and right_to_work is true and work_permission_declared is true
      and right_to_work_share_code is not null and right_to_work_share_code ~ '^W[A-Z0-9]{8}$'
      and right_to_work_date_of_birth is not null and right_to_work_date_of_birth < current_date
      and ((immigration_status = 'student' and student_conditions_acknowledged is true)
        or (immigration_status <> 'student' and student_conditions_acknowledged is null)))
  );

comment on column public.career_applications.immigration_status is 'Self-declared UK permission category. NOT verified. Employer must check evidence and role restrictions.';
comment on column public.career_applications.right_to_work_share_code is 'Private right-to-work code for employer review only. Exclude from lists, emails and logs. Delete with the application.';
comment on column public.career_applications.right_to_work_date_of_birth is 'Private DOB used only for employer right-to-work checks. Exclude from lists, emails and logs. Delete with the application.';

-- RLS already restricts this table to website admins and the service role.
-- No new public or authenticated permissions are granted by this migration.
notify pgrst, 'reload schema';
