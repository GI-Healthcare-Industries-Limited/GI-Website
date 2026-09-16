alter table public.career_openings
  add column education_eligibility text not null default 'all'
  check (education_eligibility in ('all', 'student', 'graduate'));

create or replace view public.career_opening_availability with (security_invoker = true) as
select job_title, closing_date,
  ((closing_date + 1)::timestamp at time zone 'Europe/London') as closes_at,
  (accepting_applications and (closing_date is null or clock_timestamp() <
    ((closing_date + 1)::timestamp at time zone 'Europe/London'))) as is_open,
  start_date, id, location, department, employment_type, description,
  accepting_applications, created_at, updated_at, education_eligibility
from public.career_openings;

create or replace function public.enforce_career_closing_date()
returns trigger language plpgsql set search_path = public as $$
declare opening public.career_openings%rowtype;
begin
  -- Serialize with role updates so a stale browser/API read cannot bypass policy.
  if new.opening_id is not null then
    select * into opening from public.career_openings where id = new.opening_id for share;
  else
    select * into opening from public.career_openings where job_title = new.job_title for share;
  end if;
  if not found then
    raise exception 'APPLICATION_OPENING_UNAVAILABLE' using errcode = 'P0001';
  end if;
  if not opening.accepting_applications or (opening.closing_date is not null and
    clock_timestamp() >= ((opening.closing_date + 1)::timestamp at time zone 'Europe/London')) then
    raise exception 'APPLICATION_CLOSED' using errcode = 'P0001';
  end if;
  if opening.education_eligibility <> 'all' and
    (new.education->>'status') is distinct from opening.education_eligibility then
    raise exception 'EDUCATION_NOT_ELIGIBLE' using errcode = 'P0001';
  end if;
  new.opening_id := opening.id;
  new.job_title := opening.job_title;
  return new;
end;
$$;

alter table public.career_applications add constraint career_applications_v6_details_required check (
  privacy_notice_version is distinct from '2026-09-16-applications-v6'
  or (education is not null and linkedin_url is not null)
);
comment on column public.career_openings.education_eligibility is
  'New submissions only: all (students and graduates), student, or graduate. Existing applications are never reclassified by a policy change.';
notify pgrst, 'reload schema';
