// Schema-only migration. Defaults to rollback; all QA records are TEMP tables.
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
  await db.query('begin; set local statement_timeout=20000; set local lock_timeout=3000; lock table public.career_applications, public.career_openings in access exclusive mode')
  const fingerprints=async()=> (await db.query(`select
    (select md5(coalesce(string_agg(md5((to_jsonb(a)-'question_snapshot')::text),'' order by id),'')) from public.career_applications a) applications,
    (select md5(coalesce(string_agg(md5((to_jsonb(o)-'section_three_questions')::text),'' order by id),'')) from public.career_openings o) openings`)).rows[0]
  const before=await fingerprints()
  const installed=(await db.query("select exists(select 1 from information_schema.columns where table_schema='public' and table_name='career_openings' and column_name='section_three_questions') installed")).rows[0].installed
  if(!installed)await db.query(await readFile(new URL('../supabase/migrations/20260916020000_role_questions.sql',import.meta.url),'utf8'))
  assert.deepEqual(await fingerprints(),before)
  if(!installed)assert((await db.query('select not exists(select 1 from public.career_openings where section_three_questions is not null) ok')).rows[0].ok)
  const security=(await db.query(`select
    not has_table_privilege('anon','public.career_openings','INSERT,UPDATE,DELETE') a,
    not has_table_privilege('authenticated','public.career_openings','INSERT,UPDATE,DELETE') b,
    (select relrowsecurity from pg_class where oid='public.career_applications'::regclass) c,
    (select 'security_invoker=true'=any(reloptions) from pg_class where oid='public.career_opening_availability'::regclass) d`)).rows[0]
  assert(Object.values(security).every(Boolean))
  await db.query('create temporary table question_jobs (like public.career_openings including defaults including constraints) on commit drop')
  await db.query('create temporary table question_apps (opening_id uuid,job_title text,education jsonb,application_questions_version text,question_snapshot jsonb) on commit drop')
  const def=(await db.query("select pg_get_functiondef('public.enforce_career_closing_date()'::regprocedure) definition")).rows[0].definition
  await db.query(def.replace('public.enforce_career_closing_date()','pg_temp.check_questions()').replaceAll('public.career_openings','pg_temp.question_jobs'))
  await db.query('create trigger test_questions before insert on question_apps for each row execute function pg_temp.check_questions()')
  const id=(await db.query("insert into question_jobs(job_title) values('Synthetic question test') returning id")).rows[0].id
  const questions=[{id:'test',label:'What did you build?',type:'text',required:true,wordLimit:20,options:[]}]
  async function attempt(version,snapshot,expected) {
    await db.query('savepoint one_case');let errorMessage=null
    try {await db.query('insert into question_apps values($1,$2,$3,$4,$5)',[id,'Stale title',{status:'graduate'},version,snapshot])}catch(e){errorMessage=e.message}
    await db.query('rollback to savepoint one_case; release savepoint one_case');assert.equal(errorMessage,expected)
  }
  await attempt('application-questions-v2',null,null)
  await db.query('update question_jobs set section_three_questions=$1 where id=$2',[JSON.stringify(questions),id])
  await attempt('application-questions-v2',null,'QUESTIONS_CHANGED')
  const snapshot={questions,answers:{test:{text:'A robot.',entries:[],none:false}}}
  await attempt('role-questions-v1',snapshot,null)
  await attempt('role-questions-v1',{...snapshot,questions:[]},'QUESTIONS_CHANGED')
  await db.query("update question_jobs set education_eligibility='student' where id=$1",[id])
  await attempt('role-questions-v1',snapshot,'EDUCATION_NOT_ELIGIBLE')
  await db.query('update question_jobs set accepting_applications=false where id=$1',[id])
  await attempt('role-questions-v1',snapshot,'APPLICATION_CLOSED')
  await db.query('drop table question_apps; drop function pg_temp.check_questions(); drop table question_jobs')
  // Confirm a real-shaped application satisfies every installed row constraint.
  await db.query('create temporary table snapshot_rows (like public.career_applications including defaults including generated including constraints) on commit drop')
  await db.query(`insert into snapshot_rows(job_title,name,email,application_questions_version,question_snapshot,right_to_work,immigration_status,education,linkedin_url,privacy_notice_version,data_sharing_acknowledged_at,data_sharing_statement_version)
    values('Synthetic test role','Synthetic Applicant','test@example.invalid','role-questions-v1',$1,true,'british_irish',$2,'https://www.linkedin.com/in/synthetic-test/','2026-09-16-applications-v7',now(),'recruitment-data-sharing-v2')`,[snapshot,{status:'graduate',graduationYear:'2025'}])
  await db.query('drop table snapshot_rows')
  assert.deepEqual(await fingerprints(),before)
  await db.query(apply?'commit':'rollback')
  console.log(JSON.stringify({mode:apply?'committed':'rolled back',installed,existingRecordsUnchanged:true,securityPassed:true,triggerCasesPassed:true,realTestRecords:0}))
} catch(e) {await db.query('rollback');console.error('Question migration rolled back',{code:e.code||e.name});process.exitCode=1} finally {await db.end()}
