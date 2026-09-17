import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import test from 'node:test'

const source=readFileSync('docs/gi-privacy.js','utf8')
function fixture({flutter=false, firstFrame=false, readyState='complete', cookie='', path='/contact'}={}) {
  let now=1_000_000, nextId=0
  const timers=new Map(), requests=[]
  const element=()=>({hidden:false,checked:false,open:false,dataset:{},events:{},addEventListener(name,fn){this.events[name]=fn},setAttribute(){},focus(){},showModal(){this.open=true},close(){this.open=false}})
  const elements=Object.fromEntries(['dialog','#summary','#preferences','#analytics','#toggle-state'].map(key=>[key,element()]))
  const root={...element(),querySelector:key=>elements[key],innerHTML:''}
  const host={...element(),attachShadow:()=>root}
  const document={...element(),cookie,readyState,hidden:false,referrer:'',activeElement:element(),documentElement:{dataset:firstFrame?{giFlutterReady:'true'}:{}},body:{append(){}},createElement:()=>host,querySelector:()=>flutter?{}:null}
  const location=new URL(path,'https://gihealthcare.co.uk')
  const window={...element(),dispatchEvent(){}}
  const context={window,document,location,URL,CustomEvent:class{},crypto:{randomUUID:()=> '11111111-1111-4111-8111-111111111111'},Date:class extends Date{static now(){return now}},fetch:(...args)=>{requests.push(args);return Promise.resolve({status:204})},setTimeout:(fn,delay)=>{const id=++nextId;timers.set(id,{fn,at:now+delay});return id},clearTimeout:id=>timers.delete(id),setInterval:(fn,delay)=>{const id=++nextId;timers.set(id,{fn,at:now+delay,delay});return id}}
  vm.runInNewContext(source,context)
  function tick(ms){const end=now+ms;while(true){const entry=[...timers.entries()].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!entry)break;const[id,t]=entry;now=t.at;timers.delete(id);if(t.delay)timers.set(id,{...t,at:now+t.delay});t.fn()}now=end}
  return {document,window,root,location,requests,elements,tick,click:action=>root.events.click({target:{closest:()=>({dataset:{action}})}})}
}
const saved=(analytics,v='gi-analytics-v2')=>'gi_privacy='+encodeURIComponent(JSON.stringify({v,at:999_000,analytics}))

test('old refusal is honoured, while old acceptance asks afresh before expanded analytics',()=>{
  const refused=fixture({cookie:saved(false,'gi-analytics-v1')});refused.tick(10000)
  assert.equal(refused.elements.dialog.open,false);assert.equal(refused.requests.length,0)
  const accepted=fixture({cookie:saved(true,'gi-analytics-v1')});accepted.tick(2999)
  assert.equal(accepted.elements.dialog.open,false);assert.equal(accepted.requests.length,0)
  accepted.tick(1);assert.equal(accepted.elements.dialog.open,true);assert.equal(accepted.elements['#analytics'].checked,false)
  accepted.click('accept');assert.match(decodeURIComponent(accepted.document.cookie),/gi-analytics-v2/)
  assert(accepted.requests.length>0)
})

test('dock waits until page load plus three seconds; no analytics before consent',()=>{
  const f=fixture({readyState:'loading'});f.tick(5000);assert.equal(f.elements.dialog.open,false)
  f.document.events.DOMContentLoaded();f.tick(5000);assert.equal(f.elements.dialog.open,false)
  f.window.events.load();f.tick(2999);assert.equal(f.elements.dialog.open,false)
  f.tick(1);assert.equal(f.elements.dialog.open,true);assert.equal(f.requests.length,0)
})
test('Flutter must render its first frame AND finish loading before the three-second delay',()=>{
  for(const first of ['load','flutter-first-frame']){
    const f=fixture({flutter:true,readyState:'interactive'});f.window.events[first]();f.tick(5000);assert.equal(f.elements.dialog.open,false)
    f.window.events[first==='load'?'flutter-first-frame':'load']();f.tick(2999);assert.equal(f.elements.dialog.open,false)
    f.tick(1);assert.equal(f.elements.dialog.open,true)
  }
  const cached=fixture({flutter:true,firstFrame:true});cached.tick(3000);assert.equal(cached.elements.dialog.open,true)
})
test('existing accepted AND rejected choices remain valid without re-prompting',()=>{
  for(const analytics of [true,false]){
    const f=fixture({cookie:saved(analytics)});f.tick(10000);assert.equal(f.elements.dialog.open,false)
    f.location.href='https://gihealthcare.co.uk/apply';f.tick(10000);assert.equal(f.elements.dialog.open,false)
    assert.equal(f.window.GIPrivacy.get().analytics,analytics)
    if(!analytics)assert.equal(f.requests.length,0)
  }
})
test('accept/reject save and dismiss, survive reload, and never leave a floating control',()=>{
  for(const action of ['accept','reject']){
    const f=fixture();f.tick(3000);f.click(action);assert.equal(f.elements.dialog.open,false)
    assert.equal(f.window.GIPrivacy.get().analytics,action==='accept')
    f.tick(10000);assert.equal(f.elements.dialog.open,false)
    const reloaded=fixture({cookie:f.document.cookie});reloaded.tick(10000);assert.equal(reloaded.elements.dialog.open,false)
    assert.doesNotMatch(f.root.innerHTML,/class="settings"|Cookie settings/)
    assert.equal(f.requests.length>0,action==='accept')
  }
})
test('manage defaults analytics off; saving changes cancels a pending prompt and withdrawal stops requests',()=>{
  const f=fixture();f.tick(1000);f.window.GIPrivacy.open()
  assert.equal(f.elements['#analytics'].checked,false)
  assert.equal(f.elements['#summary'].hidden,true)
  f.elements['#analytics'].checked=true;f.click('save');assert.equal(f.window.GIPrivacy.get().analytics,true)
  f.tick(5000);assert.equal(f.elements.dialog.open,false)
  f.window.GIPrivacy.open();f.elements['#analytics'].checked=false;f.click('save')
  const count=f.requests.length;f.tick(65000);assert.equal(f.requests.length,count);assert.equal(f.elements.dialog.open,false)
})
test('privacy page never interrupts reading but offers manual choices; admin cancels pending prompts',()=>{
  const privacy=fixture({path:'/privacy'});privacy.tick(10000);assert.equal(privacy.elements.dialog.open,false)
  privacy.window.GIPrivacy.open();assert.equal(privacy.elements.dialog.open,true)
  const f=fixture();f.tick(500);f.location.href='https://gihealthcare.co.uk/admin';f.tick(10000);assert.equal(f.elements.dialog.open,false)
  const admin=fixture({path:'/admin'});admin.tick(10000);assert.equal(admin.elements.dialog.open,false)
})
test('public navigation waits three seconds instead of reopening immediately',()=>{
  const f=fixture({path:'/privacy'});f.location.href='https://gihealthcare.co.uk/contact';f.tick(1000)
  assert.equal(f.elements.dialog.open,false);f.tick(2999);assert.equal(f.elements.dialog.open,false)
  f.tick(1);assert.equal(f.elements.dialog.open,true)
})
test('dock uses genuine library assets mirrored for Flutter builds, with Accept first and labelled Manage icon',()=>{
  const summaryMarkup=source.split('<div class="layout" id="summary">')[1].split('<div class="manage"')[0]
  assert(summaryMarkup.indexOf('data-action="accept"')<summaryMarkup.indexOf('data-action="reject"'))
  assert.match(source,/aria-label="Manage cookie choices"/)
  for(const name of ['cookie','sliders'])assert.equal(readFileSync(`docs/privacy-icons/${name}.svg`,'utf8'),readFileSync(`frontend/web/privacy-icons/${name}.svg`,'utf8'))
  for(const path of ['docs/index.html','frontend/web/index.html'])assert.match(readFileSync(path,'utf8'),/dataset.giFlutterReady = 'true'/)
})
test('Reject is white and clearly outlined without reducing its button size',()=>{
  assert.match(source,/\.choice\[data-action="reject"\]\{background:#fff;color:#20221f;border-color:#20221f\}/)
  assert.match(source,/\.choice\{background:#20221f;color:#fff;border-color:#20221f;min-width:98px\}/)
  assert.equal(source,readFileSync('frontend/web/gi-privacy.js','utf8'))
})
