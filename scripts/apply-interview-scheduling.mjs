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
  const fingerprints=async()=> (await db.query(`select
    (select md5(coalesce(string_agg(md5(to_jsonb(a)::text),'' order by id),'')) from public.career_applications a) applications,
    (select md5(coalesce(string_agg(md5(to_jsonb(c)::text),'' order by id),'')) from public.contact_submissions c) enquiries,
    (select md5(coalesce(string_agg(md5(to_jsonb(o)::text),'' order by id),'')) from public.career_openings o) openings`)).rows[0]
  const before=await fingerprints()
  const installed=(await db.query("select to_regclass('public.interview_settings') is not null installed")).rows[0].installed
  if(!installed)await db.query(await readFile(new URL('../supabase/migrations/20260925150000_interview_scheduling.sql',import.meta.url),'utf8'))
  for(const table of ['interview_settings','interview_availability','interview_invitations','interview_bookings']) {
    const security=(await db.query(`select relrowsecurity rls, not has_table_privilege('anon',$1,'SELECT,INSERT,UPDATE,DELETE') anon_denied,not has_table_privilege('authenticated',$1,'SELECT,INSERT,UPDATE,DELETE') authenticated_denied from pg_class where oid=$1::regclass`,[`public.${table}`])).rows[0]
    assert(Object.values(security).every(Boolean))
  }
  for(const fn of ['public.book_interview(text,timestamptz,text,text)','public.interview_available_slots(text)','public.revoke_interview_invitation(uuid)','public.purge_expired_interviews()']) {
    const {rows}=await db.query("select not has_function_privilege('anon',$1,'EXECUTE') a,not has_function_privilege('authenticated',$1,'EXECUTE') b",[fn]);assert(rows[0].a&&rows[0].b)
  }
  // All synthetic data, including settings, is reverted before committing the schema.
  await db.query('savepoint synthetic_tests')
  await db.query("update public.interview_settings set enabled=true,teams_url='https://teams.microsoft.com/l/meetup-join/synthetic-test',notice_hours=1")
  const day=(await db.query("select ((now() at time zone 'Europe/London')::date+2)::text as day")).rows[0].day
  await db.query("insert into public.interview_availability(day,start_time,end_time) values($1,'09:00','12:00')",[day])
  const hashes=['a'.repeat(64),'b'.repeat(64),'c'.repeat(64)]
  const ids=[]
  for(const h of hashes)ids.push((await db.query("insert into public.interview_invitations(token_hash,title,duration_minutes,buffer_minutes,expires_at,retention_expires_at) values($1,'Synthetic verification',30,10,now()+interval '7 days',now()+interval '3 months') returning id",[h])).rows[0].id)
  const slots=(await db.query('select * from public.interview_available_slots($1)',[hashes[0]])).rows
  assert(slots.length>=4)
  const time=slots[0].starts_at
  async function expectError(sql,args,expected) {
    await db.query('savepoint bad_case');let message
    try{await db.query(sql,args)}catch(e){message=e.message}
    await db.query('rollback to bad_case; release bad_case');assert(message?.includes(expected),`${expected}, received ${message}`)
  }
  const call='select public.book_interview($1,$2,$3,$4) id'
  const booking=(await db.query(call,[hashes[0],time,'Synthetic Test','test@example.invalid'])).rows[0].id
  assert.equal((await db.query(call,[hashes[0],time,'Synthetic Test','test@example.invalid'])).rows[0].id,booking)
  await expectError(call,[hashes[1],time,'Synthetic Two','two@example.invalid'],'SLOT_UNAVAILABLE')
  await expectError(call,[hashes[0],slots[1].starts_at,'Synthetic Test','test@example.invalid'],'INVITATION_ALREADY_USED')
  await expectError('select public.revoke_interview_invitation($1)',[ids[0]],'INVITATION_ALREADY_USED')
  await db.query('select public.revoke_interview_invitation($1)',[ids[2]])
  assert.equal((await db.query('select * from public.interview_available_slots($1)',[hashes[2]])).rows.length,0)
  await db.query('update public.interview_bookings set cancelled_at=now() where id=$1',[booking])
  assert((await db.query('select * from public.interview_available_slots($1)',[hashes[1]])).rows.some(s=>s.starts_at.toISOString()===time.toISOString()))
  await db.query('update public.interview_settings set enabled=false')
  assert.equal((await db.query('select * from public.interview_available_slots($1)',[hashes[1]])).rows.length,0)
  await db.query('update public.interview_settings set enabled=true')
  await db.query("update public.interview_invitations set expires_at=now()-interval '1 minute',created_at=now()-interval '1 day' where id=$1",[ids[1]])
  await expectError(call,[hashes[1],time,'Synthetic Test','test@example.invalid'],'INVITATION_UNAVAILABLE')
  for(const [date,expected] of [['2026-10-24','2026-10-24T08:00:00.000Z'],['2026-10-26','2026-10-26T09:00:00.000Z']]) assert.equal((await db.query("select ($1::date+time '09:00') at time zone 'Europe/London' starts_at",[date])).rows[0].starts_at.toISOString(),expected)
  await db.query('rollback to synthetic_tests; release synthetic_tests')
  assert.deepEqual(await fingerprints(),before)
  await db.query(apply?'commit':'rollback')
  console.log(JSON.stringify({mode:apply?'committed':'rolled back',installed,existingRecordsUnchanged:true,securityPassed:true,slotCollisionAndIdempotencyPassed:true,expiryCancellationAndDSTPassed:true,realTestRecords:0}))
}catch(e){await db.query('rollback');console.error('Scheduling migration rolled back',{code:e.code||e.name,message:e.message});process.exitCode=1}finally{await db.end()}
