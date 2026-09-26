import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import pg from 'pg'
const apply=process.argv.includes('--apply')
const url=new URL(process.env.POSTGRES_URL_NON_POOLING||process.env.POSTGRES_URL)
assert(url.hostname.endsWith('.supabase.com')&&decodeURIComponent(url.username).includes('qucjtakhurjajoyxbmfh'))
url.searchParams.delete('sslmode')
const cert=await fetch('https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt');assert(cert.ok)
const db=new pg.Client({connectionString:url.href,ssl:{ca:await cert.text(),rejectUnauthorized:true},connectionTimeoutMillis:10000})
await db.connect()
try {
  await db.query('begin; set local statement_timeout=20000; set local lock_timeout=3000')
  const fingerprint=async()=> (await db.query(`select md5(coalesce(string_agg(row::text,'' order by row::text),'')) hash from (
    select to_jsonb(x) row from public.career_applications x union all select to_jsonb(x) from public.contact_submissions x
    union all select to_jsonb(x) from public.career_openings x union all select to_jsonb(x)-'request_fingerprint' from public.interview_bookings x
    union all select to_jsonb(x)-'shared_booking' from public.interview_invitations x) a`)).rows[0].hash
  const before=await fingerprint()
  const installed=(await db.query("select to_regprocedure('public.shared_interview_slots()') is not null installed")).rows[0].installed
  if(!installed)await db.query(await readFile(new URL('../supabase/migrations/20260926020000_shared_booking.sql',import.meta.url),'utf8'))
  for(const fn of ['public.shared_interview_slots()','public.book_shared_interview(text,timestamptz,text,text,text)','public.claim_interview_email()']) {
    const {rows}=await db.query("select not has_function_privilege('anon',$1,'EXECUTE') a,not has_function_privilege('authenticated',$1,'EXECUTE') b",[fn]);assert(rows[0].a&&rows[0].b)
  }
  const security=(await db.query("select relrowsecurity rls,not has_table_privilege('anon','public.interview_email_outbox','SELECT,INSERT,UPDATE,DELETE') a,not has_table_privilege('authenticated','public.interview_email_outbox','SELECT,INSERT,UPDATE,DELETE') b from pg_class where oid='public.interview_email_outbox'::regclass")).rows[0]
  assert(Object.values(security).every(Boolean))
  await db.query('savepoint fixtures')
  await db.query("update public.interview_settings set enabled=true,email_enabled=true,teams_url='https://teams.microsoft.com/l/meetup-join/synthetic-test',notice_hours=1,duration_minutes=30,buffer_minutes=0")
  const day=(await db.query("select ((now() at time zone 'Europe/London')::date+2)::text as day")).rows[0].day
  await db.query("insert into public.interview_availability(day,start_time,end_time) values($1,'06:00','22:00') on conflict do nothing",[day])
  const slots=(await db.query('select * from public.shared_interview_slots()')).rows
  assert(slots.length>=3)
  const h='d'.repeat(64), f='e'.repeat(64), call='select public.book_shared_interview($1,$2,$3,$4,$5) id'
  const args=[h,slots[0].starts_at,'Synthetic Candidate','candidate@example.invalid',f]
  const id=(await db.query(call,args)).rows[0].id
  assert.equal((await db.query(call,args)).rows[0].id,id)
  assert.equal((await db.query("select count(*)::int n from public.interview_email_outbox where booking_id=$1 and kind='confirmation'",[id])).rows[0].n,1)
  async function rejected(params,expected) {
    await db.query('savepoint invalid');let message
    try{await db.query(call,params)}catch(e){message=e.message}
    await db.query('rollback to invalid; release invalid');assert(message?.includes(expected),message)
  }
  await rejected(['f'.repeat(64),slots[0].starts_at,'Synthetic Two','other@example.invalid',f],'SLOT_UNAVAILABLE')
  const other=(await db.query(call,['f'.repeat(64),slots[1].starts_at,'Synthetic Two','other@example.invalid',f])).rows[0].id
  assert.notEqual(id,other)
  // Keep any real pending mail out of this isolated claim test; rolled back below.
  await db.query("update public.interview_email_outbox set leased_until=now()+interval '1 day' where booking_id not in ($1,$2)",[id,other])
  const claimed=(await db.query('select * from public.claim_interview_email()')).rows
  assert.equal(claimed.length,1);assert.equal(claimed[0].attempts,1)
  const claimed2=(await db.query('select * from public.claim_interview_email()')).rows
  assert.equal(claimed2.length,1);assert.notEqual(claimed2[0].id,claimed[0].id)
  assert.equal((await db.query('select * from public.claim_interview_email()')).rows.length,0)
  await db.query('update public.interview_bookings set cancelled_at=now() where id=$1',[id])
  assert.equal((await db.query("select count(*)::int n from public.interview_email_outbox where booking_id=$1 and kind='cancellation'",[id])).rows[0].n,1)
  assert((await db.query('select * from public.shared_interview_slots()')).rows.some(s=>s.starts_at.toISOString()===slots[0].starts_at.toISOString()))
  await db.query('update public.interview_settings set enabled=false,email_enabled=false')
  assert.equal((await db.query('select * from public.shared_interview_slots()')).rows.length,0)
  assert.equal((await db.query('select * from public.claim_interview_email()')).rows.length,0)
  await db.query('rollback to fixtures; release fixtures')
  assert.equal(await fingerprint(),before)
  await db.query(apply?'commit':'rollback')
  console.log(JSON.stringify({mode:apply?'committed':'rolled back',installed,existingRecordsUnchanged:true,security:true,sharedSlotsAndIdempotency:true,transactionalEmailQueue:true,noEmailsSent:true}))
}catch(e){await db.query('rollback');console.error('Shared booking migration rolled back',{code:e.code||e.name,message:e.message});process.exitCode=1}finally{await db.end()}
