alter table public.career_openings add column extended_closing_date date;
alter table public.career_openings add constraint career_openings_extension_after_deadline
  check (extended_closing_date is null or (closing_date is not null and extended_closing_date > closing_date));

-- Existing consumers keep receiving the effective deadline as closing_date.
create or replace view public.career_opening_availability with (security_invoker = true) as
select job_title, coalesce(extended_closing_date, closing_date) as closing_date,
  ((coalesce(extended_closing_date, closing_date) + 1)::timestamp at time zone 'Europe/London') as closes_at,
  (accepting_applications and (coalesce(extended_closing_date, closing_date) is null or clock_timestamp() <
    ((coalesce(extended_closing_date, closing_date) + 1)::timestamp at time zone 'Europe/London'))) as is_open,
  start_date, id, location, department, employment_type, description,
  accepting_applications, created_at, updated_at, education_eligibility, section_three_questions,
  closing_date as original_closing_date, extended_closing_date
from public.career_openings;

-- Keep all existing admission checks and locking, changing only the deadline.
do $$ declare definition text; begin
  select pg_get_functiondef('public.enforce_career_closing_date()'::regprocedure) into definition;
  if position('opening.closing_date' in definition)=0 or position('QUESTIONS_CHANGED' in definition)=0 then
    raise exception 'Unexpected application admission function; migration stopped';
  end if;
  execute replace(definition,'opening.closing_date','coalesce(opening.extended_closing_date, opening.closing_date)');
end $$;
comment on column public.career_openings.extended_closing_date is 'Optional announced extension. NULL means use original closing_date without extension wording. Same inclusive UK-day cutoff.';
notify pgrst, 'reload schema';
