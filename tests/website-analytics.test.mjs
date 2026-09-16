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
    },mod,mod.exports,{env:{SUBMISSION_HASH_SECRET:'test-secret',VERCEL:'1'}})
    cache.set(path,mod.exports);return mod.exports
  }
  return {load,calls}
}
const at=Date.now()-1000
const event={id:'11111111-1111-4111-8111-111111111111',page:'careers',seconds:30,clicks:2,source:'Direct',version:'gi-analytics-v1',consentAt:at}
const cookie=(analytics=true,t=at,v='gi-analytics-v1')=>'gi_privacy='+encodeURIComponent(JSON.stringify({analytics,at:t,v}))
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
  assert.deepEqual(f.calls[0].args.event,{...event,device:'Desktop',browser:'Chrome',country:'GB'})
  assert.match(f.calls[0].args.bucket,/^[a-f0-9]{64}$/)
  assert(!JSON.stringify(f.calls).includes('192.0.2.123'))
  const g=fixture();await g.load('app/api/analytics/route.ts').POST(request(event,{'x-vercel-ip-country':'private'}));assert.equal(g.calls[0].args.event.country,'ZZ')
})
test('database failure and rate limiting do not claim collection succeeded',async()=>{
  for(const [opts,status]of [[{fail:true},503],[{limit:true},429]])assert.equal((await fixture(opts).load('app/api/analytics/route.ts').POST(request())).status,status)
})
test('analytics reports require administrator authentication before touching data',async()=>{
  const f=fixture();const r=await f.load('app/api/admin/analytics/route.ts').GET(new Request('https://gihealthcare.co.uk/api/admin/analytics'));assert.equal(r.status,401);assert.equal(f.calls.length,0)
  const g=fixture({admin:true});assert.equal((await g.load('app/api/admin/analytics/route.ts').GET(new Request('https://gihealthcare.co.uk/api/admin/analytics?days=365'))).status,400);assert.equal(g.calls.length,0)
  const h=fixture({admin:true});assert.equal((await h.load('app/api/admin/analytics/route.ts').GET(new Request('https://gihealthcare.co.uk/api/admin/analytics?days=30'))).status,200);assert.deepEqual(h.calls[0],{name:'website_analytics_report',args:{days:30}})
})
