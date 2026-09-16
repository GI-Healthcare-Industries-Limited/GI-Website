import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import pg from 'pg'
const apply=process.argv.includes('--apply')
const url=new URL(process.env.POSTGRES_URL_NON_POOLING||process.env.POSTGRES_URL)
assert(url.hostname.endsWith('.supabase.com')&&decodeURIComponent(url.username).includes('qucjtakhurjajoyxbmfh'))
url.searchParams.delete('sslmode')
const ca=await fetch('https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt');assert(ca.ok)
const db=new pg.Client({connectionString:url.href,ssl:{ca:await ca.text(),rejectUnauthorized:true},connectionTimeoutMillis:10000})
await db.connect()
try{
  await db.query('begin; set local statement_timeout=20000; set local lock_timeout=3000; lock table public.career_applications, public.career_openings in access exclusive mode')
  const fingerprints=async()=> (await db.query(`select
    (select md5(coalesce(string_agg(md5(to_jsonb(a)::text),'' order by id),'')) from public.career_applications a) applications,
    (select md5(coalesce(string_agg(md5((to_jsonb(o)-'extended_closing_date')::text),'' order by id),'')) from public.career_openings o) openings`)).rows[0]
  const before=await fingerprints()
  const installed=(await db.query("select exists(select 1 from information_schema.columns where table_schema='public' and table_name='career_openings' and column_name='extended_closing_date') installed")).rows[0].installed
  if(!installed)await db.query(await readFile(new URL('../supabase/migrations/20260916030000_announced_deadline_extension.sql',import.meta.url),'utf8'))
  assert.deepEqual(await fingerprints(),before)
  const security=(await db.query(`select not has_table_privilege('anon','public.career_openings','INSERT,UPDATE,DELETE') a, not has_table_privilege('authenticated','public.career_openings','INSERT,UPDATE,DELETE') b, (select relrowsecurity from pg_class where oid='public.career_applications'::regclass) c, (select 'security_invoker=true'=any(reloptions) from pg_class where oid='public.career_opening_availability'::regclass) d`)).rows[0];assert(Object.values(security).every(Boolean))
  await db.query('create temporary table extension_jobs (like public.career_openings including defaults including constraints) on commit drop')
  await db.query('create temporary table extension_apps (opening_id uuid,job_title text,education jsonb,application_questions_version text,question_snapshot jsonb) on commit drop')
  const fn=(await db.query("select pg_get_functiondef('public.enforce_career_closing_date()'::regprocedure) def")).rows[0].def
  await db.query(fn.replace('public.enforce_career_closing_date()','pg_temp.check_extension()').replaceAll('public.career_openings','pg_temp.extension_jobs'))
  await db.query('create trigger test_extension before insert on extension_apps for each row execute function pg_temp.check_extension()')
  const view=(await db.query("select pg_get_viewdef('public.career_opening_availability'::regclass,true) def")).rows[0].def
  assert(/FROM (public\.)?career_openings/i.test(view))
  await db.query('create temporary view extension_view as '+view.replace(/FROM (public\.)?career_openings/i,'FROM pg_temp.extension_jobs career_openings'))
  const id=(await db.query("insert into extension_jobs(job_title,closing_date,extended_closing_date) values('Synthetic extension test',current_date-7,current_date+7) returning id")).rows[0].id
  async function attempt(expected){await db.query('savepoint check_case');let message=null;try{await db.query("insert into extension_apps values($1,'Stale title',$2,'application-questions-v2',null)",[id,{status:'graduate'}])}catch(e){message=e.message}await db.query('rollback to check_case; release check_case');assert.equal(message,expected)}
  assert((await db.query('select is_open and closing_date=extended_closing_date and original_closing_date<closing_date ok from extension_view')).rows[0].ok)
  await attempt(null)
  await db.query('update extension_jobs set extended_closing_date=null where id=$1',[id]);await attempt('APPLICATION_CLOSED')
  assert(!(await db.query('select is_open from extension_view')).rows[0].is_open)
  await db.query('savepoint invalid_date');let invalid=false
  try{await db.query('update extension_jobs set extended_closing_date=closing_date where id=$1',[id])}catch(e){assert.equal(e.code,'23514');invalid=true}
  await db.query('rollback to invalid_date; release invalid_date');assert(invalid)
  for(const [date,expected] of [['2030-06-01','2030-06-01T23:00:00.000Z'],['2030-12-01','2030-12-02T00:00:00.000Z']]){
    await db.query('update extension_jobs set extended_closing_date=$1 where id=$2',[date,id]);assert.equal((await db.query('select closes_at from extension_view')).rows[0].closes_at.toISOString(),expected)
  }
  await db.query("update extension_jobs set education_eligibility='student' where id=$1",[id]);await attempt('EDUCATION_NOT_ELIGIBLE')
  await db.query('update extension_jobs set accepting_applications=false where id=$1',[id]);await attempt('APPLICATION_CLOSED')
  await db.query('drop view extension_view; drop table extension_apps; drop function pg_temp.check_extension(); drop table extension_jobs')
  assert.deepEqual(await fingerprints(),before)
  await db.query(apply?'commit':'rollback');console.log(JSON.stringify({mode:apply?'committed':'rolled back',installed,existingRecordsUnchanged:true,securityPassed:true,extensionAndDSTCasesPassed:true,realTestRecords:0}))
}catch(e){await db.query('rollback');console.error('Extension migration rolled back',{code:e.code||e.name});process.exitCode=1}finally{await db.end()}
