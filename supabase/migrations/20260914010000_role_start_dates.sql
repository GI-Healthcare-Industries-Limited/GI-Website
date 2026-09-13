alter table public.career_openings add column start_date date
  check (start_date between date '2020-01-01' and date '2099-12-31');

create or replace view public.career_opening_availability with (security_invoker = true) as
select job_title, closing_date,
  ((closing_date + 1)::timestamp at time zone 'Europe/London') as closes_at,
  (closing_date is null or clock_timestamp() <
    ((closing_date + 1)::timestamp at time zone 'Europe/London')) as is_open,
  start_date
from public.career_openings;

comment on column public.career_openings.start_date is
  'Proposed role start date, shown to applicants. Informational only: does not change the application deadline.';
notify pgrst, 'reload schema';
