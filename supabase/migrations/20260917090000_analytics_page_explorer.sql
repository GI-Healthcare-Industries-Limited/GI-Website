-- Additive upgrade. Historical events and recruitment/enquiry tables are untouched.
alter table public.website_page_views
  add column if not exists city text check (city is null or length(city) between 1 and 120),
  add column if not exists region text check (region is null or region ~ '^[A-Z0-9]{1,3}$'),
  add column if not exists os text check (os is null or os in ('iOS','Android','ChromeOS','Windows','macOS','Linux','Other'));
alter table public.website_page_views drop constraint website_page_views_consent_version_check;
alter table public.website_page_views add constraint website_page_views_consent_version_check
  check (consent_version in ('gi-analytics-v1','gi-analytics-v2'));
create index if not exists website_page_views_page_date on public.website_page_views(page,created_at desc,id);

create or replace function public.record_website_view(event jsonb,bucket text) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
declare n integer;
begin
  if event->>'version' not in ('gi-analytics-v1','gi-analytics-v2') then return false; end if;
  insert into public.website_analytics_limits(bucket) values(record_website_view.bucket)
    on conflict on constraint website_analytics_limits_pkey do update
    set requests=website_analytics_limits.requests+1 returning requests into n;
  if n>600 then return false; end if;
  insert into public.website_page_views(id,page,seconds,clicks,country,device,browser,source,consent_at,consent_version,city,region,os)
  values((event->>'id')::uuid,event->>'page',(event->>'seconds')::int,(event->>'clicks')::int,
    event->>'country',event->>'device',event->>'browser',event->>'source',to_timestamp((event->>'consentAt')::double precision/1000),event->>'version',
    case when event->>'version'='gi-analytics-v2' then event->>'city' end,
    case when event->>'version'='gi-analytics-v2' then event->>'region' end,
    case when event->>'version'='gi-analytics-v2' then event->>'os' end)
  on conflict(id) do update set seconds=greatest(website_page_views.seconds,excluded.seconds),
    clicks=greatest(website_page_views.clicks,excluded.clicks),last_seen=clock_timestamp()
  where website_page_views.page=excluded.page
    and website_page_views.consent_version=excluded.consent_version
    and website_page_views.consent_at=excluded.consent_at
    and website_page_views.created_at>clock_timestamp()-interval '2 hours';
  -- Metadata is immutable on heartbeat updates; legacy consent cannot add new fields.
  return true;
end $$;
revoke all on function public.record_website_view(jsonb,text) from public,anon,authenticated;
grant execute on function public.record_website_view(jsonb,text) to service_role;

-- A separate report preserves rollback compatibility with the existing dashboard.
create function public.website_analytics_explorer(days integer,selected_page text,row_offset integer,snapshot_at timestamptz)
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare result jsonb; anchor timestamptz:=least(snapshot_at,now());
begin
  if days is null or days not in (7,14,30) or row_offset is null or row_offset<0 or row_offset>100000
    or snapshot_at is null or anchor is null or anchor<now()-interval '30 days'
    or (selected_page is not null and selected_page not in ('home','space','careers','contact','apply','privacy'))
    then raise exception 'Invalid analytics report filters' using errcode='22023'; end if;
  with recent as materialized (
    select * from public.website_page_views
    where created_at>=greatest((date_trunc('day',anchor at time zone 'UTC')-make_interval(days=>days-1)) at time zone 'UTC',now()-interval '30 days')
      and created_at<=anchor and (selected_page is null or page=selected_page)
  ), totals as (
    select count(*) views,coalesce(round(avg(seconds)),0) average_seconds,coalesce(sum(clicks),0) clicks from recent
  ), daily as (
    select (created_at at time zone 'UTC')::date as "day",count(*) views from recent group by 1 order by 1
  ), countries as (
    select country label,count(*) views from recent group by country order by views desc,country
  ), cities as (
    select city,region,country,count(*) views from recent group by city,region,country order by views desc,country,city nulls last,region nulls last limit 30
  ), devices as (select device label,count(*) views from recent group by device order by views desc,device),
  browsers as (select browser label,count(*) views from recent group by browser order by views desc,browser),
  systems as (select coalesce(os,'Not collected') label,count(*) views from recent group by os order by views desc,os nulls last),
  sources as (select source label,count(*) views from recent group by source order by views desc,source),
  records as (
    select id,created_at,page,country,city,region,device,browser,os,source,seconds,clicks
    from recent order by created_at desc,id desc offset row_offset limit 20
  )
  select jsonb_build_object('totals',(select to_jsonb(totals) from totals),
    'daily',coalesce((select jsonb_agg(daily) from daily),'[]'::jsonb),
    'countries',coalesce((select jsonb_agg(countries) from countries),'[]'::jsonb),
    'cities',coalesce((select jsonb_agg(cities) from cities),'[]'::jsonb),
    'devices',coalesce((select jsonb_agg(devices) from devices),'[]'::jsonb),
    'browsers',coalesce((select jsonb_agg(browsers) from browsers),'[]'::jsonb),
    'systems',coalesce((select jsonb_agg(systems) from systems),'[]'::jsonb),
    'sources',coalesce((select jsonb_agg(sources) from sources),'[]'::jsonb),
    'records',coalesce((select jsonb_agg(records) from records),'[]'::jsonb),
    'offset',row_offset,'pageSize',20,'snapshotAt',anchor) into result;
  return result;
end $$;
revoke all on function public.website_analytics_explorer(integer,text,integer,timestamptz) from public,anon,authenticated;
grant execute on function public.website_analytics_explorer(integer,text,integer,timestamptz) to service_role;
notify pgrst,'reload schema';
