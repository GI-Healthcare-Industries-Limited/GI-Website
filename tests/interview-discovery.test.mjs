import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'
const require=createRequire(import.meta.url)
function loader(overrides={}) {
  const cache=new Map()
  function load(file) {
    if(cache.has(file))return cache.get(file)
    const mod={exports:{}}
    const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
    new Function('require','module','exports',code)(name=>{
      if(name in overrides)return overrides[name]
      if(name==='next/server')return {after:()=>{}}
      if(name==='server-only')return {}
      if(name.startsWith('@/'))return load(`${name.slice(2)}.ts`)
      return require(name)
    },mod,mod.exports)
    cache.set(file,mod.exports);return mod.exports
  }
  return load
}
const load=loader()
const discovery=load('lib/job-discovery.ts')
const validation=load('lib/interview-validation.ts')
const {interviewCalendar}=load('lib/interview-calendar.ts')
const {tokenHash}=load('lib/interviews.ts')
const job={id:'11111111-1111-4111-8111-111111111111',job_title:'Research Engineer',description:'Build real machines.\nResearch & develop <systems>.',location:'Edinburgh, UK',employment_type:'Full-time',department:'Engineering',education_eligibility:'graduate',accepting_applications:true,is_open:true,created_at:'2026-09-01T10:00:00Z',updated_at:'2026-09-20T10:00:00Z',closes_at:'2026-10-01T22:59:59Z'}
test('role discovery uses stable IDs, accurate visible data and the existing application form',()=>{
  const schema=discovery.jobStructuredData(job,Date.parse('2026-09-25'))
  assert.equal(schema['@type'],'JobPosting');assert.equal(schema.title,job.job_title)
  assert.equal(schema.datePosted,job.created_at);assert.equal(schema.validThrough,job.closes_at)
  assert.equal(schema.employmentType,'FULL_TIME');assert.equal(schema.jobLocation.address.addressLocality,'Edinburgh')
  assert.match(schema.description,/Research &amp; develop &lt;systems&gt;/)
  assert.match(schema.description,/Graduates only/)
  assert(!('baseSalary' in schema));assert(!('directApply' in schema))
  assert.equal(discovery.jobPath(job.id),`/careers/${job.id}`)
  assert.equal(discovery.applicationPath(job.id),`/apply?job=${job.id}`)
  assert.equal(discovery.jobStructuredData({...job,job_title:'Renamed'},Date.parse('2026-09-25')).url,schema.url)
})
test('closed and expired roles never expose active JobPosting markup',()=>{
  for(const patch of [{is_open:false},{accepting_applications:false},{closes_at:'2026-09-01T00:00:00Z'}])assert.equal(discovery.jobStructuredData({...job,...patch},Date.parse('2026-09-25')),null)
  assert(!('validThrough' in discovery.jobStructuredData({...job,closes_at:null},Date.parse('2026-09-25'))))
  assert(!discovery.safeJsonLd({title:'</script><script>alert(1)</script>'}).includes('<'))
})
test('sitemap lists only public active jobs and propagates service failures',async()=>{
  const build=items=>loader({'@/lib/career-openings':{getCareerOpenings:async()=>({items})}})('app/sitemap.ts').default()
  const sitemap=await build([{...job,closes_at:null},{...job,id:'closed',is_open:false}])
  assert(sitemap.some(p=>p.url.endsWith(`/careers/${job.id}`)))
  assert(!sitemap.some(p=>/book|admin|apply|closed/.test(p.url)))
  await assert.rejects(loader({'@/lib/career-openings':{getCareerOpenings:async()=>{throw new Error('Unavailable')}}})('app/sitemap.ts').default())
})
test('new favicon files are square branded assets, used by Next and both static shells',()=>{
  for(const size of [96,180,192,512]) {
    const png=readFileSync(`docs/icons/gi-icon-${size}.png`)
    assert.equal(png.readUInt32BE(16),size);assert.equal(png.readUInt32BE(20),size)
    assert.deepEqual(png,readFileSync(`frontend/web/icons/gi-icon-${size}.png`))
  }
  for(const file of ['docs/index.html','frontend/web/index.html','docs/vision/index.html','app/layout.tsx'])assert.match(readFileSync(file,'utf8'),/gi-icon-96.png/)
})
test('Teams links are HTTPS and limited to exact trusted Microsoft hosts',()=>{
  for(const url of ['https://teams.microsoft.com/l/meetup-join/test','https://teams.live.com/meet/123','https://teams.cloud.microsoft/meet/123'])assert(validation.isTeamsUrl(url))
  for(const url of ['https://teams.microsoft.com.evil.invalid/meet/test','javascript:alert(1)','http://teams.microsoft.com/test','https://user:pass@teams.microsoft.com/meet/test','https://teams.microsoft.com:8443/meet/test','https://teams.microsoft.com/'])assert(!validation.isTeamsUrl(url))
  const settings={action:'settings',enabled:false,teamsUrl:'',duration:30,buffer:10,notice:24,expectedUpdatedAt:'2026-09-25T00:00:00Z'}
  assert(validation.settingsSchema.safeParse(settings).success)
  assert(!validation.settingsSchema.safeParse({...settings,enabled:true}).success)
  assert(!validation.settingsSchema.safeParse({...settings,duration:999}).success)
})
test('booking validation requires privacy acknowledgement and blocks arbitrary properties and honeypots',()=>{
  const body={startsAt:'2026-10-01T09:00:00Z',name:'Test Candidate',email:'test@example.invalid',privacyAcknowledged:true,company:''}
  assert(validation.bookingSchema.safeParse(body).success)
  for(const patch of [{privacyAcknowledged:false},{company:'bot'},{email:'invalid'},{startsAt:'tomorrow'},{teams_url:'https://evil.invalid'}])assert(!validation.bookingSchema.safeParse({...body,...patch}).success)
  for(const [start,end]of [['05:00','07:00'],['12:00','11:00'],['09:99','12:00'],['09:00','23:00']])assert(!validation.availabilitySchema.safeParse({action:'availability',day:'2026-10-01',start,end}).success)
})
test('private invitation tokens are hashed and malformed tokens fail closed',()=>{
  const token='a'.repeat(64),hash=tokenHash(token)
  assert.match(hash,/^[a-f0-9]{64}$/);assert.notEqual(hash,token)
  for(const bad of ['abc','a'.repeat(63),'A'.repeat(64),'../admin','x'.repeat(64)])assert.equal(tokenHash(bad),null)
})
test('calendar downloads preserve UTC times, escape injections and fold Unicode safely',()=>{
  const event={id:'11111111-1111-4111-8111-111111111111',title:'Test; one, two\nATTENDEE:evil — '+ '語'.repeat(55),starts_at:'2026-10-26T09:00:00Z',ends_at:'2026-10-26T09:30:00Z',teams_url:'https://teams.microsoft.com/l/meetup-join/test',created_at:'2026-09-25T09:00:00Z',cancelled_at:null}
  const ics=interviewCalendar(event),unfold=ics.replace(/\r\n /g,'')
  assert.match(unfold,/DTSTART:20261026T090000Z/);assert.match(unfold,/DTEND:20261026T093000Z/)
  assert.match(unfold,/SUMMARY:Test\\; one\\, two\\nATTENDEE:evil/)
  assert(!/^ATTENDEE:|^ORGANIZER:/m.test(ics));assert.match(ics,/METHOD:PUBLISH/)
  for(const line of ics.split('\r\n'))assert(Buffer.byteLength(line)<=75)
  const cancelled=interviewCalendar({...event,cancelled_at:'2026-09-26T12:00:00Z'})
  assert.match(cancelled,/STATUS:CANCELLED/);assert.match(cancelled,/SEQUENCE:1/)
  assert.equal(ics.match(/UID:.*/)[0],cancelled.match(/UID:.*/)[0])
})
function apiFixture({admin=true,rpcError=null,missing=false}={}) {
  const calls=[]
  const interview={title:'Test meeting',duration:30,expiresAt:'2026-10-01T23:00:00Z',linkedApplication:false,slots:[],booking:null}
  const db={rpc:async(...args)=>{calls.push(args);return {data:null,error:rpcError}},from(){throw new Error('Unexpected database query')}}
  const module=loader({'@/lib/admin-auth':{requireWebsiteAdmin:async()=>admin?{userId:'test'}:null},'@/lib/supabase/admin':{getSupabaseAdmin:()=>db},'@/lib/interviews':{...load('lib/interviews.ts'),getPublicInterview:async()=>missing?null:interview,getInvitation:async()=>null}})
  return {public:module('app/api/interviews/[token]/route.ts'),admin:module('app/api/admin/interviews/route.ts'),calls}
}
const context={params:Promise.resolve({token:'a'.repeat(64)})}
const body={startsAt:'2026-10-01T09:00:00Z',name:'Test Person',email:'test@example.invalid',privacyAcknowledged:true,company:''}
function request(method,data,origin='https://www.gihealthcare.co.uk') {return new Request('https://www.gihealthcare.co.uk/api/interviews/test',{method,headers:{'Content-Type':'application/json',Origin:origin},...(data?{body:JSON.stringify(data)}:{})})}
test('interview admin API requires authorization before any database operation',async()=>{
  const f=apiFixture({admin:false})
  assert.equal((await f.admin.GET(request('GET'))).status,401)
  assert.equal((await f.admin.POST(request('POST',{}))).status,401)
  assert.equal(f.calls.length,0)
})
test('candidate API rejects cross-origin requests and invalid payloads before writing',async()=>{
  const f=apiFixture()
  assert.equal((await f.public.POST(request('POST',body,'https://evil.invalid'),context)).status,403)
  assert.equal((await f.public.DELETE(request('DELETE',null,'https://evil.invalid'),context)).status,403)
  assert.equal((await f.public.POST(request('POST',{...body,privacyAcknowledged:false}),context)).status,400)
  assert.equal((await f.public.POST(request('POST',{...body,name:'x'.repeat(3000)}),context)).status,413)
  assert.equal(f.calls.length,0)
})
test('candidate booking maps database conflicts and never returns internal error details',async()=>{
  for(const code of ['SLOT_UNAVAILABLE','INVITATION_ALREADY_USED','INVITATION_UNAVAILABLE','CANDIDATE_EMAIL_MISMATCH']) {
    const f=apiFixture({rpcError:{message:code}}),response=await f.public.POST(request('POST',body),context)
    assert.equal(response.status,409);assert.match(response.headers.get('Cache-Control'),/no-store/)
    assert(!JSON.stringify(await response.json()).includes(code))
  }
  const f=apiFixture(),response=await f.public.POST(request('POST',body),context)
  assert.equal(response.status,201);assert.equal(f.calls[0][0],'book_interview')
  assert.notEqual(f.calls[0][1].invitation_hash,'a'.repeat(64))
  assert.equal(f.calls[0][1].candidate_email,body.email)
})
test('private booking responses are non-cacheable, non-indexable and invalid invites are 404',async()=>{
  const f=apiFixture({missing:true}),response=await f.public.GET(request('GET'),context)
  assert.equal(response.status,404);assert.match(response.headers.get('X-Robots-Tag'),/noindex/)
  assert.equal(response.headers.get('Referrer-Policy'),'no-referrer')
  for(const file of ['docs/gi-privacy.js','frontend/web/gi-privacy.js'])assert.match(readFileSync(file,'utf8'),/\/book\//)
})
test('calendar month geometry handles leap years, Monday starts and year navigation',()=>{
  const {monthDays,shiftMonth}=load('lib/booking-dates.ts')
  assert.equal(monthDays('2028-02').filter(Boolean).length,29)
  assert.equal(monthDays('2026-09')[0],null)
  assert.equal(monthDays('2026-09')[1],'2026-09-01')
  assert.equal(monthDays('2026-06')[0],'2026-06-01')
  assert.equal(shiftMonth('2026-12',1),'2027-01')
  assert.equal(shiftMonth('2026-01',-1),'2025-12')
})
test('email calendar invitations and cancellations use stable identifiers and real scheduling methods',()=>{
  const {bookingEmailPayload}=load('lib/interview-email.ts')
  const b={id:'test',invitation_id:'test',title:'Meet with GI Healthcare',name:'Test',email:'person@example.invalid',starts_at:'2026-10-26T09:00:00Z',ends_at:'2026-10-26T09:30:00Z',teams_url:'https://teams.microsoft.com/l/meetup-join/test',created_at:'2026-09-26T09:00:00Z',cancelled_at:null}
  const email=bookingEmailPayload(b,'meetings@example.invalid','owner@example.invalid')
  assert.deepEqual(email.to,['person@example.invalid']);assert.deepEqual(email.bcc,['owner@example.invalid'])
  const calendar=Buffer.from(email.attachments[0].content,'base64').toString().replace(/\r\n /g,'')
  assert.match(calendar,/METHOD:REQUEST/);assert.match(calendar,/ORGANIZER;CN=GI Healthcare:mailto:meetings@example.invalid/)
  assert.match(calendar,/ATTENDEE;RSVP=TRUE;ROLE=REQ-PARTICIPANT:mailto:person@example.invalid/)
  assert.match(calendar,/DTSTART:20261026T090000Z/)
  const cancel=bookingEmailPayload({...b,cancelled_at:'2026-09-26T10:00:00Z'},'meetings@example.invalid','owner@example.invalid')
  const cancelIcs=Buffer.from(cancel.attachments[0].content,'base64').toString()
  assert.match(cancelIcs,/METHOD:CANCEL/);assert.match(cancelIcs,/SEQUENCE:1/)
  assert.equal(calendar.match(/UID:.*/)[0],cancelIcs.match(/UID:.*/)[0])
  assert.throws(()=>interviewCalendar(b,{organizer:'evil\r\nATTENDEE:bad',attendee:b.email}))
})
test('Resend remains disabled without separate processing approval and never sends from an unconfigured worker',async()=>{
  const names=['INTERVIEW_EMAIL_PROCESSING_APPROVED','RESEND_API_KEY','INTERVIEW_FROM_EMAIL','INTERVIEW_HOST_EMAIL'];const old=Object.fromEntries(names.map(n=>[n,process.env[n]]))
  try {
    process.env.RESEND_API_KEY='synthetic';process.env.INTERVIEW_FROM_EMAIL='meeting@example.invalid';process.env.INTERVIEW_HOST_EMAIL='owner@example.invalid';delete process.env.INTERVIEW_EMAIL_PROCESSING_APPROVED
    const mod=loader({'@/lib/supabase/admin':{getSupabaseAdmin(){throw new Error('Must not access database')}}})('lib/interview-email.ts')
    assert.equal(mod.interviewEmailReady(),false);await mod.flushInterviewEmails()
    process.env.INTERVIEW_EMAIL_PROCESSING_APPROVED='true';assert.equal(mod.interviewEmailReady(),true)
    process.env.INTERVIEW_FROM_EMAIL='bad\r\naddress';assert.equal(mod.interviewEmailReady(),false)
  } finally {for(const n of names){if(old[n]===undefined)delete process.env[n];else process.env[n]=old[n]}}
})
test('shared booking enforces validation, hashes the private capability and masks slot conflicts',async()=>{
  const calls=[]
  let rpcError=null
  const module=loader({'@/lib/supabase/admin':{getSupabaseAdmin:()=>({rpc:async(...a)=>{calls.push(a);return {error:rpcError}}})},'@/lib/submissions':{...load('lib/submissions.ts'),getRequestFingerprint:()=> 'e'.repeat(64)},'@/lib/interviews':{...load('lib/interviews.ts'),getPublicInterview:async()=>({booking:{id:'synthetic'}})}})('app/api/interviews/route.ts')
  const input={...body,bookingToken:'b'.repeat(64)}
  assert.equal((await module.POST(request('POST',input,'https://evil.invalid'))).status,403)
  assert.equal((await module.POST(request('POST',{...input,bookingToken:'bad'}))).status,400)
  assert.equal((await module.POST(request('POST',{...input,privacyAcknowledged:false}))).status,400)
  assert.equal(calls.length,0)
  assert.equal((await module.POST(request('POST',input))).status,201)
  assert.equal(calls[0][0],'book_shared_interview');assert.equal(calls[0][1].invitation_hash,tokenHash(input.bookingToken))
  rpcError={message:'SLOT_UNAVAILABLE private internal detail'}
  const conflict=await module.POST(request('POST',input));assert.equal(conflict.status,409);assert(!JSON.stringify(await conflict.json()).includes('internal'))
  rpcError={message:'BOOKING_LIMIT'};assert.equal((await module.POST(request('POST',input))).status,429)
})
test('shared booking is excluded from analytics along with private booking paths',()=>{
  for(const file of ['docs/gi-privacy.js','frontend/web/gi-privacy.js'])assert.match(readFileSync(file,'utf8'),/location.pathname==='\/book'/)
  assert.match(readFileSync('app/book/page.tsx','utf8'),/index: false/)
})
