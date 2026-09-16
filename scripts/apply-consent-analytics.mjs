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
try {
  // Repeatable-read gives a consistent fingerprint without locking or changing the live inbox.
  await db.query('begin isolation level repeatable read; set local statement_timeout=20000; set local lock_timeout=3000')
  const fingerprints=async()=>(await db.query(`select
    (select md5(coalesce(string_agg(md5(to_jsonb(a)::text),'' order by id),'')) from public.career_applications a) applications,
    (select md5(coalesce(string_agg(md5(to_jsonb(a)::text),'' order by id),'')) from public.contact_submissions a) enquiries,
    (select md5(coalesce(string_agg(md5(to_jsonb(a)::text),'' order by id),'')) from public.career_openings a) jobs`)).rows[0]
  const before=await fingerprints()
  const installed=(await db.query("select to_regclass('public.website_page_views') is not null installed")).rows[0].installed
  if(!installed)await db.query(await readFile(new URL('../supabase/migrations/20260916040000_consent_analytics.sql',import.meta.url),'utf8'))
  for(const table of ['website_page_views','website_analytics_limits']){
    const permissions=(await db.query(`select (select relrowsecurity from pg_class where oid=$1::regclass) rls,
      not has_table_privilege('anon',$1,'SELECT,INSERT,UPDATE,DELETE') anon_blocked,
      not has_table_privilege('authenticated',$1,'SELECT,INSERT,UPDATE,DELETE') user_blocked`,['public.'+table])).rows[0]
    assert(Object.values(permissions).every(Boolean))
  }
  for(const fn of ['record_website_view(jsonb,text)','website_analytics_report(integer)','purge_website_analytics()']){
    assert((await db.query("select not has_function_privilege('anon',$1,'EXECUTE') and not has_function_privilege('authenticated',$1,'EXECUTE') and has_function_privilege('service_role',$1,'EXECUTE') ok",['public.'+fn])).rows[0].ok)
  }
  // All test records are rolled back to this savepoint, including rate-limit and expiry tests.
  await db.query('savepoint synthetic_checks')
  const event={id:crypto.randomUUID(),page:'home',seconds:12,clicks:2,source:'Direct',device:'Desktop',browser:'Safari',country:'GB',version:'gi-analytics-v1',consentAt:Date.now()}
  const bucket=crypto.randomUUID()
  const record=async(e=event)=>(await db.query('select public.record_website_view($1,$2) ok',[e,bucket])).rows[0].ok
  assert(await record());assert(await record({...event,seconds:3,clicks:1}))
  assert.deepEqual((await db.query('select seconds,clicks from public.website_page_views where id=$1',[event.id])).rows[0],{seconds:12,clicks:2})
  assert(await record({...event,seconds:40,clicks:4}))
  assert.equal((await db.query('select count(*)::int n from public.website_page_views where id=$1',[event.id])).rows[0].n,1)
  assert((await db.query('select public.website_analytics_report(7) report')).rows[0].report.totals.views>=1)
  await db.query('update public.website_analytics_limits set requests=600 where bucket=$1',[bucket]);assert.equal(await record(),false)
  await db.query("update public.website_page_views set created_at=clock_timestamp()-interval '31 days' where id=$1",[event.id])
  await db.query("update public.website_analytics_limits set expires_at=clock_timestamp()-interval '1 second' where bucket=$1",[bucket])
  await db.query('select public.purge_website_analytics()')
  assert.equal((await db.query('select count(*)::int n from public.website_page_views where id=$1',[event.id])).rows[0].n,0)
  assert.equal((await db.query('select count(*)::int n from public.website_analytics_limits where bucket=$1',[bucket])).rows[0].n,0)
  await db.query('rollback to synthetic_checks; release synthetic_checks')
  assert.deepEqual(await fingerprints(),before)
  assert((await db.query("select active and schedule='* * * * *' ok from cron.job where jobname='gi-website-analytics-retention'")).rows[0].ok)
  await db.query(apply?'commit':'rollback')
  console.log(JSON.stringify({mode:apply?'committed':'rolled back',installed,existingRecordsUnchanged:true,securityPassed:true,deduplicationRateLimitRetentionPassed:true,committedTestRecords:0}))
} catch(e) {await db.query('rollback');console.error('Analytics migration rolled back',{code:e.code||e.name,message:e.message});process.exitCode=1} finally {await db.end()}
