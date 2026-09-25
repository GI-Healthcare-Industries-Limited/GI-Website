// Read-only smoke checks. Never creates applications, bookings or analytics events.
import assert from 'node:assert/strict'
const base=process.argv[2]||'http://localhost:4174'
const checked=[]
async function get(path,status=200){const r=await fetch(new URL(path,base),{redirect:'manual'});assert.equal(r.status,status,`${path}: HTTP ${r.status}`);checked.push(path);return r}
const home=await (await get('/')).text()
assert(home.includes('/icons/gi-icon-96.png'));assert(home.includes('/icons/gi-icon-512.png'))
const apply=await(await get('/apply')).text()
assert.match(apply,/I.m applying for/);assert.match(apply,/type="radio"/)
const careers=await(await get('/careers')).text()
const ids=[...new Set([...careers.matchAll(/href="\/careers\/([a-f0-9-]{36})"/g)].map(m=>m[1]))]
for(const id of ids){
  const html=await(await get(`/careers/${id}`)).text()
  const matches=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]))
  const schema=matches.find(item=>item['@type']==='JobPosting')
  assert(schema,`Missing JobPosting for ${id}`);assert.equal(schema.identifier.value,id)
  assert(html.includes(`/apply?job=${id}`));assert(schema.hiringOrganization.logo.endsWith('/icons/gi-icon-512.png'))
  assert.match(schema.description,/<p>/);assert(!schema.baseSalary)
}
const robots=await(await get('/robots.txt')).text();assert.match(robots,/OAI-SearchBot/);assert.match(robots,/sitemap.xml/)
const sitemap=await(await get('/sitemap.xml')).text();for(const id of ids)assert(sitemap.includes(`/careers/${id}`))
assert(!sitemap.includes('/admin'));assert(!sitemap.includes('/book/'))
const old=await get('/?page=careers',308);assert(new URL(old.headers.get('location'),base).pathname==='/careers')
const image=Buffer.from(await(await get('/icons/gi-icon-96.png')).arrayBuffer());assert.equal(image.readUInt32BE(16),96);assert.equal(image.readUInt32BE(20),96)
const admin=await get('/api/admin/interviews',401);assert.match(admin.headers.get('cache-control'),/no-store/)
const booking=await get(`/api/interviews/${'0'.repeat(64)}`,404);assert.match(booking.headers.get('cache-control'),/no-store/);assert.match(booking.headers.get('x-robots-tag'),/noindex/)
await get('/qa-interviews',404)
console.log(JSON.stringify({base,checks:checked.length,activeRolePages:ids.length,advertisedApplyPreserved:true,structuredData:true,logo:true,privateEndpoints:true,fixtureNotShipped:true}))
