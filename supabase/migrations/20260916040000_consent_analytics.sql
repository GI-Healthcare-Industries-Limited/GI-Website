-- Separate from recruitment and enquiries. No raw IP, form content, or persistent visitor ID.
create table public.website_page_views (
  id uuid primary key, created_at timestamptz not null default clock_timestamp(),
  last_seen timestamptz not null default clock_timestamp(),
  page text not null check (page in ('home','space','careers','contact','apply','privacy')),
  seconds integer not null default 0 check(seconds between 0 and 1800),
  clicks integer not null default 0 check(clicks between 0 and 100),
  country text not null check(country ~ '^[A-Z]{2}$'),
  device text not null check(device in ('Desktop','Mobile','Tablet')),
  browser text not null check(browser in ('Chrome','Safari','Firefox','Edge','Other')),
  source text not null check(source in ('Direct','Search','Social','Other')),
  consent_at timestamptz not null, consent_version text not null check(consent_version='gi-analytics-v1')
);
create index website_page_views_date on public.website_page_views(created_at);
create table public.website_analytics_limits (
  bucket text primary key, requests integer not null default 1,
  expires_at timestamptz not null default clock_timestamp()+interval '2 hours'
);
alter table public.website_page_views enable row level security;
alter table public.website_analytics_limits enable row level security;
revoke all on public.website_page_views,public.website_analytics_limits from public,anon,authenticated;
grant all on public.website_page_views,public.website_analytics_limits to service_role;

create function public.record_website_view(event jsonb,bucket text) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
declare n integer;begin
  insert into public.website_analytics_limits(bucket) values(record_website_view.bucket)
    on conflict on constraint website_analytics_limits_pkey do update set requests=website_analytics_limits.requests+1 returning requests into n;
  if n>600 then return false;end if;
  insert into public.website_page_views(id,page,seconds,clicks,country,device,browser,source,consent_at,consent_version)
  values((event->>'id')::uuid,event->>'page',(event->>'seconds')::int,(event->>'clicks')::int,
    event->>'country',event->>'device',event->>'browser',event->>'source',to_timestamp((event->>'consentAt')::double precision/1000),event->>'version')
  on conflict(id) do update set seconds=greatest(website_page_views.seconds,excluded.seconds),
    clicks=greatest(website_page_views.clicks,excluded.clicks),last_seen=clock_timestamp()
  where website_page_views.page=excluded.page and website_page_views.created_at>clock_timestamp()-interval '2 hours';
  return true;
end $$;
revoke all on function public.record_website_view(jsonb,text) from public,anon,authenticated;
grant execute on function public.record_website_view(jsonb,text) to service_role;

create function public.purge_website_analytics() returns void language sql security definer set search_path=public,pg_temp as $$
  delete from public.website_page_views where created_at<=clock_timestamp()-interval '30 days';
  delete from public.website_analytics_limits where expires_at<=clock_timestamp();
$$;
revoke all on function public.purge_website_analytics() from public,anon,authenticated;
grant execute on function public.purge_website_analytics() to service_role;
select cron.schedule('gi-website-analytics-retention','* * * * *','select public.purge_website_analytics();');

create function public.website_analytics_report(days integer) returns jsonb
language sql stable security definer set search_path=public,pg_temp as $$
with recent as (
 select * from public.website_page_views where created_at>=greatest(
  (date_trunc('day',now() at time zone 'UTC')-make_interval(days=>least(30,greatest(1,days))-1)) at time zone 'UTC',
  now()-interval '30 days')
), totals as(select count(*) views,coalesce(round(avg(seconds)),0) average_seconds,coalesce(sum(clicks),0) clicks from recent),
daily as(select (created_at at time zone 'UTC')::date as "day",count(*) views from recent group by 1 order by 1),
pages as(select page,count(*) views,round(avg(seconds)) average_seconds,sum(clicks) clicks from recent group by page order by views desc),
countries as(select country label,count(*) views from recent group by country order by views desc),
devices as(select device label,count(*) views from recent group by device order by views desc),
sources as(select source label,count(*) views from recent group by source order by views desc)
select jsonb_build_object('totals',(select to_jsonb(totals) from totals),
 'daily',coalesce((select jsonb_agg(daily) from daily),'[]'::jsonb),
 'pages',coalesce((select jsonb_agg(pages) from pages),'[]'::jsonb),
 'countries',coalesce((select jsonb_agg(countries) from countries),'[]'::jsonb),
 'devices',coalesce((select jsonb_agg(devices) from devices),'[]'::jsonb),
 'sources',coalesce((select jsonb_agg(sources) from sources),'[]'::jsonb));
$$;
revoke all on function public.website_analytics_report(integer) from public,anon,authenticated;
grant execute on function public.website_analytics_report(integer) to service_role;
notify pgrst,'reload schema';
