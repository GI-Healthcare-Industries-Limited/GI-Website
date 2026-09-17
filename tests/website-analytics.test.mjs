import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'

const require = createRequire(import.meta.url)
test('Flutter source and deployed consent script stay in sync across future builds',()=>{
  assert.equal(readFileSync('frontend/web/gi-privacy.js','utf8'),readFileSync('docs/gi-privacy.js','utf8'))
})
function fixture(options={}) {
  const calls=[]
  const cache=new Map()
  function load(path) {
    if(cache.has(path))return cache.get(path)
    const mod={exports:{}}
    const code=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
    new Function('require','module','exports','process',code)(name=>{
      if(name==='@/lib/supabase/admin')return {getSupabaseAdmin:()=>({rpc:(name,args)=>{calls.push({name,args});return {abortSignal:async()=>({data:options.limit?false:true,error:options.fail?{}:null})}}})}
      if(name==='@/lib/admin-auth')return {requireWebsiteAdmin:async()=>options.admin===true?{userId:'test'}:null}
      if(name.startsWith('@/'))return load(`${name.slice(2)}.ts`)
      return require(name)
    },mod,mod.exports,{env:{SUBMISSION_HASH_SECRET:'test-secret',VERCEL:options.local?'0':'1'}})
    cache.set(path,mod.exports);return mod.exports
  }
  return {load,calls}
}
const at=Date.now()-1000
const event={id:'11111111-1111-4111-8111-111111111111',page:'careers',seconds:30,clicks:2,source:'Direct',version:'gi-analytics-v2',consentAt:at}
const cookie=(analytics=true,t=at,v='gi-analytics-v2')=>'gi_privacy='+encodeURIComponent(JSON.stringify({analytics,at:t,v}))
function request(body=event,headers={}) {return new Request('https://gihealthcare.co.uk/api/analytics',{method:'POST',headers:{origin:'https://gihealthcare.co.uk','content-type':'application/json',cookie:cookie(),'user-agent':'Mozilla/5.0 Chrome/140.0','x-forwarded-for':'192.0.2.123','x-vercel-ip-country':'GB',...headers},body:typeof body==='string'?body:JSON.stringify(body)})}

test('analytics fail closed before consent, after rejection/expiry, and for mismatched or malformed consent',async()=>{
  for(const value of ['',cookie(false),cookie(true,at-181*86400000),cookie(true,at+999999),cookie(true,at,'old'),'%broken']){
    const f=fixture();assert.equal((await f.load('app/api/analytics/route.ts').POST(request(event,{cookie:value}))).status,400);assert.equal(f.calls.length,0)
  }
})
test('analytics rejects private paths, extra fields, URLs and unbounded payloads before any database call',async()=>{
  for(const body of [{...event,page:'admin'},{...event,page:'/apply?email=test@example.invalid'},{...event,email:'test@example.invalid'},{...event,seconds:1801},{...event,clicks:101},{...event,source:'https://example.invalid/private'},'{bad']){
    const f=fixture();assert.equal((await f.load('app/api/analytics/route.ts').POST(request(body))).status,400);assert.equal(f.calls.length,0)
  }
  const f=fixture();assert.equal((await f.load('app/api/analytics/route.ts').POST(request('x'.repeat(1025)))).status,413);assert.equal(f.calls.length,0)
})
test('analytics verifies origin, content type and excludes bots',async()=>{
  for(const [headers,status] of [[{origin:'https://attacker.invalid'},403],[{'content-type':'text/plain'},415],[{'user-agent':'crawler'},204]]){
    const f=fixture();assert.equal((await f.load('app/api/analytics/route.ts').POST(request(event,headers))).status,status);assert.equal(f.calls.length,0)
  }
})
test('accepted page views store only allowlisted fields, coarse metadata and a separate irreversible abuse bucket',async()=>{
  const f=fixture();const r=await f.load('app/api/analytics/route.ts').POST(request());assert.equal(r.status,204);assert.equal(r.headers.get('cache-control'),'no-store')
  assert.equal(f.calls[0].name,'record_website_view')
  assert.deepEqual(f.calls[0].args.event,{...event,device:'Desktop',browser:'Chrome',os:'Other',country:'GB',city:null,region:null})
  assert.match(f.calls[0].args.bucket,/^[a-f0-9]{64}$/)
  assert(!JSON.stringify(f.calls).includes('192.0.2.123'))
  const g=fixture();await g.load('app/api/analytics/route.ts').POST(request(event,{'x-vercel-ip-country':'private'}));assert.equal(g.calls[0].args.event.country,'ZZ')
})
test('database failure and rate limiting do not claim collection succeeded',async()=>{
  for(const [opts,status]of [[{fail:true},503],[{limit:true},429]])assert.equal((await fixture(opts).load('app/api/analytics/route.ts').POST(request())).status,status)
})
test('local and preview visits cannot populate production statistics',async()=>{
  const f=fixture({local:true});assert.equal((await f.load('app/api/analytics/route.ts').POST(request())).status,204);assert.equal(f.calls.length,0)
  const g=fixture();const req=new Request('https://preview.vercel.app/api/analytics',request(event,{origin:'https://preview.vercel.app'}));assert.equal((await g.load('app/api/analytics/route.ts').POST(req)).status,204);assert.equal(g.calls.length,0)
})
test('analytics reports require administrator authentication before touching data',async()=>{
  const f=fixture();const r=await f.load('app/api/admin/analytics/route.ts').GET(new Request('https://gihealthcare.co.uk/api/admin/analytics'));assert.equal(r.status,401);assert.equal(f.calls.length,0)
  const g=fixture({admin:true});assert.equal((await g.load('app/api/admin/analytics/route.ts').GET(new Request('https://gihealthcare.co.uk/api/admin/analytics?days=365'))).status,400);assert.equal(g.calls.length,0)
  const h=fixture({admin:true});assert.equal((await h.load('app/api/admin/analytics/route.ts').GET(new Request('https://gihealthcare.co.uk/api/admin/analytics?days=30'))).status,200)
  assert.equal(h.calls[0].name,'website_analytics_explorer');assert.deepEqual({...h.calls[0].args,snapshot_at:undefined},{days:30,selected_page:null,row_offset:0,snapshot_at:undefined})
  assert(Math.abs(Date.parse(h.calls[0].args.snapshot_at)-Date.now())<1000)
})

test('expanded collection requires fresh v2 consent, not an earlier acceptance',async()=>{
  for(const body of [event,{...event,version:'gi-analytics-v1'}]){
    const f=fixture();assert.equal((await f.load('app/api/analytics/route.ts').POST(request(body,{cookie:cookie(true,at,'gi-analytics-v1')}))).status,400);assert.equal(f.calls.length,0)
  }
})
test('location is decoded and bounded from host headers only; no precise coordinates reach storage',async()=>{
  const f=fixture();await f.load('app/api/analytics/route.ts').POST(request(event,{'x-vercel-ip-city':'S%C3%A3o%20Paulo','x-vercel-ip-country':'BR','x-vercel-ip-country-region':'SP','x-vercel-ip-latitude':'-23.55','x-vercel-ip-longitude':'-46.63'}))
  assert.deepEqual({city:f.calls[0].args.event.city,region:f.calls[0].args.event.region,country:f.calls[0].args.event.country},{city:'São Paulo',region:'SP',country:'BR'})
  assert.doesNotMatch(JSON.stringify(f.calls),/latitude|longitude|-23\.55|-46\.63/)
  const {coarseLocation}=fixture().load('lib/website-analytics.ts')
  for(const city of ['%broken','<script>alert(1)</script>','a'.repeat(121)])assert.equal(coarseLocation(new Headers({'x-vercel-ip-country':'GB','x-vercel-ip-city':city})).city,null)
  assert.deepEqual(coarseLocation(new Headers({'x-vercel-ip-country':'XX','x-vercel-ip-city':'London','x-vercel-ip-country-region':'ENG'})),{country:'ZZ',region:null,city:null})
  assert.equal(coarseLocation(new Headers({'x-vercel-ip-country':'GB','x-vercel-ip-country-region':'Not a region'})).region,null)
})
test('device, browser and operating-system categories remain broad and bounded',()=>{
  const {coarseClient}=fixture().load('lib/website-analytics.ts')
  for(const [ua,expected] of [
    ['Mozilla/5.0 (Windows NT 10.0) Chrome/140.0 Safari/537.36 Edg/140.0',{device:'Desktop',browser:'Edge',os:'Windows'}],
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) CriOS/140.0 Mobile Safari/604.1',{device:'Mobile',browser:'Chrome',os:'iOS'}],
    ['Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) Version/18 Mobile Safari/604.1',{device:'Tablet',browser:'Safari',os:'iOS'}],
    ['Mozilla/5.0 (Linux; Android 15) Chrome/140.0 Safari/537.36',{device:'Tablet',browser:'Chrome',os:'Android'}],
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) Firefox/130.0',{device:'Desktop',browser:'Firefox',os:'macOS'}],
    ['Mozilla/5.0 (Linux; Android 15) Mobile SamsungBrowser/28.0 Chrome/140.0',{device:'Mobile',browser:'Other',os:'Android'}],
  ])assert.deepEqual(coarseClient(ua),expected)
})
test('reports strictly validate filters and snapshot pagination before reading data',async()=>{
  const base='https://gihealthcare.co.uk/api/admin/analytics?'
  for(const query of ['page=private','days=7&days=30','offset=-1','offset=1.2','offset=100001','days=30&ip=yes','before=bad','before='+encodeURIComponent(new Date(Date.now()+60000).toISOString()),'before='+encodeURIComponent(new Date(Date.now()-31*86400000).toISOString())]){
    const f=fixture({admin:true});assert.equal((await f.load('app/api/admin/analytics/route.ts').GET(new Request(base+query))).status,400,query);assert.equal(f.calls.length,0)
  }
  const before=new Date(Date.now()-60000).toISOString();const f=fixture({admin:true})
  const r=await f.load('app/api/admin/analytics/route.ts').GET(new Request(base+new URLSearchParams({days:'14',page:'careers',offset:'20',before})))
  assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'no-store')
  assert.deepEqual(f.calls[0],{name:'website_analytics_explorer',args:{days:14,selected_page:'careers',row_offset:20,snapshot_at:before}})
  assert.equal((await fixture({admin:true,fail:true}).load('app/api/admin/analytics/route.ts').GET(new Request(base))).status,503)
})
test('chart series fills missing UTC days, including month and year boundaries',()=>{
  const {dailySeries,regionName,countryName,duration}=fixture().load('lib/analytics-report.ts')
  const series=dailySeries({snapshotAt:'2027-01-02T00:10:00Z',daily:[{day:'2026-12-31',views:2},{day:'2027-01-02',views:3}]},7)
  assert.equal(series[0].day,'2026-12-27');assert.equal(series.at(-1).day,'2027-01-02');assert.equal(series.reduce((n,row)=>n+row.views,0),5)
  assert.equal(regionName('GB','SCT'),'Scotland');assert.equal(countryName('ZZ'),'Unknown');assert.equal(duration(75),'1m 15s')
})
test('geographic map is real, local, deterministic and mirrored for Flutter builds',()=>{
  const raw=readFileSync('docs/analytics/world.json','utf8');assert.equal(raw,readFileSync('frontend/web/analytics/world.json','utf8'))
  const {world,centres}=JSON.parse(raw);assert(world.features.length>170);assert(centres.GB);assert(centres.US)
  assert(world.features.every(feature=>feature.geometry&&feature.properties.name))
  assert(Object.keys(centres).every(code=>/^[A-Z]{2}$/.test(code)))
})
