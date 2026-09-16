// Default rollback dry run. --apply commits schema only; no real QA records.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import pg from 'pg'
const apply = process.argv.includes('--apply')
const url = new URL(process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL)
assert(url.hostname.endsWith('.supabase.com') && decodeURIComponent(url.username).includes('qucjtakhurjajoyxbmfh'), 'Unexpected database target')
url.searchParams.delete('sslmode')
const ca = await fetch('https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt')
assert(ca.ok)
const db = new pg.Client({ connectionString: url.href, ssl: { ca: await ca.text(), rejectUnauthorized: true }, connectionTimeoutMillis: 10000 })
await db.connect()
try {
  await db.query('begin; set local statement_timeout=20000; set local lock_timeout=3000;')
  await db.query('lock table public.career_applications, public.career_openings in access exclusive mode')
  async function fingerprints() {
    return (await db.query(`select
      (select md5(coalesce(string_agg(md5(to_jsonb(a)::text), '' order by id), '')) from public.career_applications a) applications,
      (select md5(coalesce(string_agg(md5((to_jsonb(o)-'education_eligibility')::text), '' order by id), '')) from public.career_openings o) openings`)).rows[0]
  }
  const before = await fingerprints()
  const installed = (await db.query("select exists(select 1 from information_schema.columns where table_schema='public' and table_name='career_openings' and column_name='education_eligibility') installed")).rows[0].installed
  if (!installed) await db.query(await readFile(new URL('../supabase/migrations/20260916013000_job_education_eligibility.sql', import.meta.url), 'utf8'))
  assert.deepEqual(await fingerprints(), before)
  if (!installed) assert((await db.query("select coalesce(bool_and(education_eligibility='all'),true) ok from public.career_openings")).rows[0].ok)
  const security = (await db.query(`select
    not has_table_privilege('anon','public.career_openings','INSERT,UPDATE,DELETE') as anon,
    not has_table_privilege('authenticated','public.career_openings','INSERT,UPDATE,DELETE') as authenticated,
    has_table_privilege('service_role','public.career_openings','INSERT,UPDATE,DELETE') as service,
    (select relrowsecurity from pg_class where oid='public.career_openings'::regclass) as rls,
    (select 'security_invoker=true'=any(reloptions) from pg_class where oid='public.career_opening_availability'::regclass) as invoker`)).rows[0]
  assert(Object.values(security).every(Boolean))
  await db.query('select education_eligibility from public.career_opening_availability limit 0')

  // Exercise the installed trigger on isolated temporary fixtures. Only table
  // and function names are substituted; the actual policy/closure logic is used.
  await db.query('create temporary table policy_openings (like public.career_openings including defaults including constraints) on commit drop')
  await db.query('create temporary table policy_applications (opening_id uuid, job_title text, education jsonb) on commit drop')
  const definition = (await db.query("select pg_get_functiondef('public.enforce_career_closing_date()'::regprocedure) definition")).rows[0].definition
  assert(definition.includes('for share') && definition.includes('EDUCATION_NOT_ELIGIBLE'))
  await db.query(definition.replace('public.enforce_career_closing_date()', 'pg_temp.verify_career_policy()').replaceAll('public.career_openings', 'pg_temp.policy_openings'))
  await db.query('create trigger verify_policy before insert on policy_applications for each row execute function pg_temp.verify_career_policy()')
  const id = (await db.query("insert into policy_openings(job_title) values ('Synthetic policy test') returning id")).rows[0].id
  for (const policy of ['all','student','graduate']) {
    await db.query('update policy_openings set education_eligibility=$1 where id=$2',[policy,id])
    for (const status of ['student','graduate',null]) {
      await db.query('savepoint verify_case')
      let denied = false
      try {
        const result = await db.query('insert into policy_applications values($1,$2,$3) returning job_title',[id,'Stale title',status ? JSON.stringify({status}) : null])
        assert.equal(result.rows[0].job_title,'Synthetic policy test')
      } catch (error) { if (error.message !== 'EDUCATION_NOT_ELIGIBLE') throw error; denied=true }
      await db.query('rollback to savepoint verify_case; release savepoint verify_case')
      assert.equal(denied,policy !== 'all' && policy !== status)
    }
  }
  // Existing manual closure still takes precedence over education eligibility.
  await db.query('update policy_openings set accepting_applications=false where id=$1',[id])
  await db.query('savepoint closed_case')
  let closed = false
  try { await db.query('insert into policy_applications values($1,$2,$3)',[id,'Stale title',JSON.stringify({status:'graduate'})]) }
  catch(error){if(error.message !== 'APPLICATION_CLOSED') throw error; closed=true}
  await db.query('rollback to savepoint closed_case; release savepoint closed_case')
  assert(closed)
  // Do not leave even temporary helper function definitions after commit.
  await db.query('drop table policy_applications; drop function pg_temp.verify_career_policy(); drop table policy_openings;')
  assert.deepEqual(await fingerprints(),before)
  await db.query(apply ? 'commit' : 'rollback')
  console.log(JSON.stringify({mode:apply?'committed':'dry run rolled back',previouslyInstalled:installed,existingApplicationsAndPostingsUnchanged:true,accessControlsPassed:true,policyMatrixPassed:true,realTestRecords:0}))
} catch(error) {
  await db.query('rollback')
  console.error('Eligibility migration failed; rolled back.',{code:error.code||error.name})
  process.exitCode=1
} finally {await db.end()}
