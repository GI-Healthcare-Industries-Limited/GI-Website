create table public.career_openings (
  job_title text primary key check (job_title in (
    'Embedded Systems Engineer', 'Business Development and Operations Manager'
  )),
  closing_date date check (closing_date between date '2020-01-01' and date '2099-12-31'),
  updated_at timestamptz not null default now()
);

insert into public.career_openings (job_title) values
  ('Embedded Systems Engineer'), ('Business Development and Operations Manager');

alter table public.career_openings enable row level security;
revoke all on public.career_openings from public, anon, authenticated;
grant all on public.career_openings to service_role;

-- A closing date includes the entire UK calendar day, including BST changes.
create view public.career_opening_availability with (security_invoker = true) as
select job_title, closing_date,
  ((closing_date + 1)::timestamp at time zone 'Europe/London') as closes_at,
  (closing_date is null or clock_timestamp() <
    ((closing_date + 1)::timestamp at time zone 'Europe/London')) as is_open
from public.career_openings;

revoke all on public.career_opening_availability from public, anon, authenticated;
grant select on public.career_opening_availability to service_role;

create function public.enforce_career_closing_date()
returns trigger language plpgsql set search_path = '' as $$
declare deadline date;
begin
  -- Serialise inserts against a simultaneous deadline change.
  select closing_date into deadline from public.career_openings
    where job_title = new.job_title for share;
  if not found then
    raise exception 'APPLICATION_OPENING_UNAVAILABLE' using errcode = 'P0001';
  end if;
  if deadline is not null and clock_timestamp() >=
    ((deadline + 1)::timestamp at time zone 'Europe/London') then
    raise exception 'APPLICATION_CLOSED' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_career_closing_date() from public, anon, authenticated;
grant execute on function public.enforce_career_closing_date() to service_role;

create trigger enforce_career_closing_date_before_insert
before insert on public.career_applications
for each row execute function public.enforce_career_closing_date();

comment on column public.career_openings.closing_date is
  'Last UK calendar day accepting applications. Null means no deadline; clearing or extending it reopens the role.';

notify pgrst, 'reload schema';
