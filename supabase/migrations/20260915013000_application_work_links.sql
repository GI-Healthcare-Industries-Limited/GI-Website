-- Additive: earlier applications and the existing retention rules are preserved.
create function public.application_work_links_valid(value text[]) returns boolean
language sql immutable parallel safe set search_path = pg_catalog as $$
  select value is not null and coalesce(array_ndims(value), 1) = 1
    and cardinality(value) <= 5 and not exists (
      select 1 from unnest(value) as link where link is null
        or char_length(link) > 2048
        or link !~* '^https?://[^/?#[:space:]@]+([/?#][^[:space:]]*)?$'
    );
$$;
revoke all on function public.application_work_links_valid(text[]) from public, anon, authenticated;
grant execute on function public.application_work_links_valid(text[]) to service_role;

alter table public.career_applications
  add column work_links text[] not null default '{}',
  add constraint career_applications_work_links_check check (public.application_work_links_valid(work_links));

comment on column public.career_applications.work_links is
  'Optional work-example URLs, separate from the 80-word answer. Up to five HTTP(S) links, 2048 characters each. Same admin access and three-month deletion as the parent application; links are never fetched automatically.';
notify pgrst, 'reload schema';
