-- Stable IDs allow titles to change while historic applications keep their title.
alter table public.career_openings
  drop constraint career_openings_job_title_check,
  add constraint career_openings_title_length check (length(btrim(job_title)) between 2 and 120),
  add column id uuid not null default gen_random_uuid() unique,
  add column location text not null default 'Edinburgh, UK' check (length(btrim(location)) between 2 and 120),
  add column department text not null default 'Team' check (length(btrim(department)) between 2 and 120),
  add column employment_type text not null default 'Full-time' check (employment_type in ('Full-time', 'Part-time', 'Fixed-term contract', 'Internship')),
  add column description text not null default '' check (length(description) <= 2000),
  add column accepting_applications boolean not null default true,
  add column created_at timestamptz not null default now();
create unique index career_openings_title_unique on public.career_openings (lower(btrim(job_title)));

update public.career_openings set department = 'Engineering',
  description = 'Build reliable embedded systems for autonomous cooking machines designed for extreme environments.'
where job_title = 'Embedded Systems Engineer';
update public.career_openings set department = 'Commercial & operations',
  description = 'Grow partnerships and improve operations as we bring autonomous cooking technology to extreme environments.'
where job_title = 'Business Development and Operations Manager';

alter table public.career_applications
  drop constraint career_applications_job_title_check,
  add constraint career_applications_title_length check (length(btrim(job_title)) between 2 and 120),
  add column opening_id uuid references public.career_openings(id) on delete set null;
create index career_applications_opening_id_idx on public.career_applications(opening_id);
update public.career_applications a set opening_id = o.id
from public.career_openings o where a.job_title = o.job_title;

create or replace view public.career_opening_availability with (security_invoker = true) as
select job_title, closing_date,
  ((closing_date + 1)::timestamp at time zone 'Europe/London') as closes_at,
  (accepting_applications and (closing_date is null or clock_timestamp() <
    ((closing_date + 1)::timestamp at time zone 'Europe/London'))) as is_open,
  start_date, id, location, department, employment_type, description,
  accepting_applications, created_at, updated_at
from public.career_openings;

create or replace function public.enforce_career_closing_date()
returns trigger language plpgsql set search_path = public as $$
declare opening public.career_openings%rowtype;
begin
  -- The lock serializes submission with closing, renaming, or removing a role.
  if new.opening_id is not null then
    select * into opening from public.career_openings where id = new.opening_id for share;
  else
    -- Compatibility for clients using a pre-existing title-based application link.
    select * into opening from public.career_openings where job_title = new.job_title for share;
  end if;
  if not found then
    raise exception 'APPLICATION_OPENING_UNAVAILABLE' using errcode = 'P0001';
  end if;
  if not opening.accepting_applications or (opening.closing_date is not null and
    clock_timestamp() >= ((opening.closing_date + 1)::timestamp at time zone 'Europe/London')) then
    raise exception 'APPLICATION_CLOSED' using errcode = 'P0001';
  end if;
  new.opening_id := opening.id;
  new.job_title := opening.job_title;
  return new;
end;
$$;

comment on column public.career_applications.opening_id is 'Optional link to a posting. Removing a posting preserves the application and its original job title, subject to normal retention.';
notify pgrst, 'reload schema';
