create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;

create table public.website_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email extensions.citext not null unique,
  display_name text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contact_submissions (
  id uuid primary key default extensions.gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 120),
  email extensions.citext not null check (char_length(email::text) <= 254),
  phone text check (phone is null or char_length(phone) <= 50),
  message text not null check (char_length(message) between 10 and 5000),
  status text not null default 'new' check (status in ('new', 'in_progress', 'resolved', 'archived')),
  request_fingerprint text not null check (char_length(request_fingerprint) = 64)
);

create table public.career_applications (
  id uuid primary key default extensions.gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  job_title text not null check (job_title in ('Technician Intern', 'Junior Software Developer', 'General Application')),
  name text not null check (char_length(name) between 2 and 120),
  email extensions.citext not null check (char_length(email::text) <= 254),
  phone text check (phone is null or char_length(phone) <= 50),
  cover_letter text not null check (char_length(cover_letter) between 30 and 7000),
  cv_path text not null unique,
  cv_original_name text not null,
  cv_content_type text not null check (
    cv_content_type in (
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
  ),
  status text not null default 'new' check (
    status in ('new', 'reviewing', 'interview', 'rejected', 'hired', 'archived')
  ),
  request_fingerprint text not null check (char_length(request_fingerprint) = 64)
);

create index contact_submissions_created_at_idx on public.contact_submissions (created_at desc);
create index contact_submissions_status_idx on public.contact_submissions (status, created_at desc);
create index contact_submissions_rate_limit_idx on public.contact_submissions (request_fingerprint, created_at desc);
create index career_applications_created_at_idx on public.career_applications (created_at desc);
create index career_applications_status_idx on public.career_applications (status, created_at desc);
create index career_applications_rate_limit_idx on public.career_applications (request_fingerprint, created_at desc);

alter table public.website_admins enable row level security;
alter table public.contact_submissions enable row level security;
alter table public.career_applications enable row level security;

revoke all on table public.website_admins from anon, authenticated;
revoke all on table public.contact_submissions from anon, authenticated;
revoke all on table public.career_applications from anon, authenticated;

grant select on table public.website_admins to authenticated;
grant select, update on table public.contact_submissions to authenticated;
grant select, update on table public.career_applications to authenticated;

create or replace function public.is_website_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.website_admins
    where user_id = (select auth.uid())
      and active = true
  );
$$;

revoke all on function public.is_website_admin() from public;
grant execute on function public.is_website_admin() to authenticated, service_role;

create policy "admins can view their own admin record"
on public.website_admins
for select
to authenticated
using (user_id = (select auth.uid()) and active = true);

create policy "website admins can read contact submissions"
on public.contact_submissions
for select
to authenticated
using ((select public.is_website_admin()));

create policy "website admins can update contact submissions"
on public.contact_submissions
for update
to authenticated
using ((select public.is_website_admin()))
with check ((select public.is_website_admin()));

create policy "website admins can read career applications"
on public.career_applications
for select
to authenticated
using ((select public.is_website_admin()));

create policy "website admins can update career applications"
on public.career_applications
for update
to authenticated
using ((select public.is_website_admin()))
with check ((select public.is_website_admin()));

create or replace function public.touch_website_submission_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger touch_contact_submissions_updated_at
before update on public.contact_submissions
for each row execute function public.touch_website_submission_updated_at();

create trigger touch_career_applications_updated_at
before update on public.career_applications
for each row execute function public.touch_website_submission_updated_at();

create trigger touch_website_admins_updated_at
before update on public.website_admins
for each row execute function public.touch_website_submission_updated_at();

create or replace function public.sync_primary_website_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if lower(new.email) = 'ash@gihealthcare.co.uk' then
    insert into public.website_admins (user_id, email, display_name, active)
    values (new.id, lower(new.email), 'Ash', true)
    on conflict (user_id) do update
      set email = excluded.email,
          active = true;
  end if;
  return new;
end;
$$;

create trigger sync_primary_website_admin_after_auth_change
after insert or update of email on auth.users
for each row execute function public.sync_primary_website_admin();

insert into public.website_admins (user_id, email, display_name, active)
select id, lower(email), 'Ash', true
from auth.users
where lower(email) = 'ash@gihealthcare.co.uk'
on conflict (user_id) do update
  set email = excluded.email,
      active = true;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'career-cvs',
  'career-cvs',
  false,
  4194304,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "website admins can read career CVs"
on storage.objects
for select
to authenticated
using (bucket_id = 'career-cvs' and (select public.is_website_admin()));

comment on table public.contact_submissions is 'Contact messages submitted through gihealthcare.co.uk.';
comment on table public.career_applications is 'Career applications submitted through gihealthcare.co.uk.';
comment on column public.contact_submissions.request_fingerprint is 'HMAC-SHA256 of the visitor IP for abuse throttling; the raw IP is not retained.';
comment on column public.career_applications.request_fingerprint is 'HMAC-SHA256 of the visitor IP for abuse throttling; the raw IP is not retained.';
