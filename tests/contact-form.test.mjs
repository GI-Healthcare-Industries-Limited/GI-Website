import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const source = ts.transpileModule(readFileSync('app/contact/contact-form.tsx','utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2022 },
}).outputText
function fixture(response = async () => new Response('{"ok":true}',{status:201})) {
  const slots=[],calls=[]
  let cursor=0,tree
  const hooks={...require('react'),useEffect(){},useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return[slots[i],value=>{slots[i]=typeof value==='function'?value(slots[i]):value}]},useRef(initial){return slots[cursor++]??={current:initial}}}
  const module={exports:{}}
  new Function('require','module','exports','FormData','fetch',source)(name=>{
    if(name==='react')return hooks
    if(name==='@phosphor-icons/react')return {ArrowRightIcon:()=>null,ArrowUpRightIcon:()=>null,CheckCircleIcon:()=>null}
    if(name==='@/lib/privacy')return {PRIVACY_NOTICE_VERSION:'2026-09-14'}
    if(name.endsWith('.css'))return new Proxy({},{get:(_,key)=>key})
    if(name.startsWith('@/assets/'))return {src:'synthetic',width:100,height:100}
    if(name.startsWith('next/'))return ()=>null
    return require(name)
  },module,module.exports,class{constructor(form){this.values=form.values}get(key){return this.values[key]??null}},async(url,options)=>{calls.push({url,...options});return response()})
  function render(){cursor=0;tree=module.exports.ContactForm()}
  function nodes(node=tree){if(!node||typeof node!=='object')return[];if(Array.isArray(node))return node.flatMap(nodes);return[node,...nodes(node.props?.children ?? null)]}
  render()
  return {calls,nodes,render,async submit(values){await nodes().find(n=>n.type==='form').props.onSubmit({preventDefault(){},currentTarget:{values}});render()}}
}
const values={name:'Synthetic contact',email:'qa@example.invalid',phone:'',message:'Synthetic contact message.',company:''}

test('contact form preserves visitor fields without publishing business email or phone links',()=>{
  const f=fixture()
  const inputs=f.nodes().filter(n=>['input','textarea'].includes(n.type))
  assert.deepEqual(inputs.filter(n=>n.props.required).map(n=>n.props.name),['name','email','message'])
  assert.equal(inputs.find(n=>n.props.name==='phone').props.autoComplete,'tel')
  assert.ok(inputs.every(n=>f.nodes().some(label=>label.type==='label'&&label.props.htmlFor===n.props.id)))
  assert.ok(!f.nodes().some(n=>/^(mailto:|tel:)/.test(String(n.props?.href))))
})
test('contact submits to existing inbox API with notice version and no new consent use',async()=>{
  const f=fixture();await f.submit(values)
  assert.equal(f.calls.length,1);assert.equal(f.calls[0].url,'/api/contact')
  assert.deepEqual(JSON.parse(f.calls[0].body),{...values,privacyNoticeVersion:'2026-09-14'})
  assert.ok(!f.nodes().some(n=>n.type==='form'))
})
test('contact errors keep the form and allow retry; a false success is not accepted',async()=>{
  for(const response of [async()=>new Response('{"error":"Unavailable"}',{status:503}),async()=>new Response('{}',{status:200}),async()=>{throw new Error('Offline')}]){
    const f=fixture(response);await f.submit(values)
    assert.ok(f.nodes().some(n=>n.props?.role==='alert'))
    assert.ok(f.nodes().some(n=>n.type==='form'))
    assert.equal(f.nodes().find(n=>n.props?.type==='submit').props.disabled,false)
  }
})
test('contact prevents rapid duplicate submissions',async()=>{
  let finish
  const f=fixture(()=>new Promise(resolve=>{finish=resolve}))
  const first=f.submit(values);await f.submit(values);assert.equal(f.calls.length,1)
  finish(new Response('{"ok":true}',{status:201}));await first
})
