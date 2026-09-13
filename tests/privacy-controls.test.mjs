import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'

const require = createRequire(import.meta.url)
function loader(deps = {}, env = {}, fetcher = fetch) {
  const cache = new Map()
  function load(path) {
    if (cache.has(path)) return cache.get(path)
    const mod = { exports: {} }
    const source = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
    new Function('require', 'module', 'exports', 'process', 'fetch', 'console', source)((name) => {
      if (name in deps) return deps[name]
      if (name === 'server-only') return {}
      return name.startsWith('@/') ? load(name.slice(2) + '.ts') : require(name)
    }, mod, mod.exports, { env }, fetcher, { error() {}, info() {} })
    cache.set(path, mod.exports)
    return mod.exports
  }
  return load
}

test('client expiry fails closed at the exact boundary and on missing/invalid dates', () => {
  const { isWithinRetention } = loader()('lib/privacy.ts')
  const expiry = '2026-12-14T09:00:00.000Z'
  assert.equal(isWithinRetention(expiry, Date.parse(expiry) - 1), true)
  assert.equal(isWithinRetention(expiry, Date.parse(expiry)), false)
  assert.equal(isWithinRetention(expiry, Date.parse(expiry) + 1), false)
  for (const invalid of ['', undefined, 'bad']) assert.equal(isWithinRetention(invalid), false)
})

test('contact form requires the current notice, not blanket consent; extra evidence is discarded', () => {
  const load = loader()
  const { contactSchema } = load('lib/submissions.ts')
  const input = { name: 'Synthetic QA', email: 'qa@example.invalid', message: 'A synthetic enquiry.', privacyNoticeVersion: '2026-09-14', dateOfBirth: '2000-01-01', shareCode: 'W12345678' }
  const parsed = contactSchema.parse(input)
  assert.equal(parsed.dateOfBirth, undefined)
  assert.equal(parsed.shareCode, undefined)
  assert.equal(parsed.consent, undefined)
  assert.equal(contactSchema.safeParse({ ...input, privacyNoticeVersion: 'old' }).success, false)
})

test('body limit works without Content-Length and non-JSON/malformed requests fail safely', async () => {
  const { readSubmissionJson, submissionErrorResponse } = loader()('lib/submissions.ts')
  for (const [contentType, body, expected] of [['application/json', 'x'.repeat(21), 413], ['text/plain', '{}', 415], ['application/json', '{', 400]]) {
    const request = new Request('https://example.invalid', { method: 'POST', headers: { 'Content-Type': contentType }, body })
    let failure
    try { await readSubmissionJson(request, 20) } catch (error) { failure = submissionErrorResponse(error) }
    assert.equal(failure.status, expected)
  }
})

test('notification function sends only fixed alert text and the admin link', async () => {
  const bodies = []
  const { sendSubmissionNotification } = loader({}, { RESEND_API_KEY: 'synthetic', NEXT_PUBLIC_SITE_URL: 'https://example.invalid' }, async (_url, init) => {
    bodies.push(JSON.parse(init.body)); return new Response('{}')
  })('lib/notify.ts')
  await sendSubmissionNotification('application')
  await sendSubmissionNotification('contact')
  assert.deepEqual(bodies.map(body => body.subject), ['New website application', 'New website enquiry'])
  for (const body of bodies) {
    assert.match(body.html, /https:\/\/example.invalid\/admin/)
    assert.doesNotMatch(JSON.stringify(body), /shareCode|dateOfBirth|projectSummary|portfolioUrl/)
  }
})

test('admin reads and updates always use an expiry cutoff; invalid input never reaches storage', async () => {
  const calls = []
  const query = {
    select() { return this }, gt(...args) { calls.push(args); return this }, eq() { return this }, order() { return this },
    update() { return this }, limit: async () => ({ data: [] }), maybeSingle: async () => ({ data: null }),
  }
  const route = loader({ '@/lib/admin-auth': { requireWebsiteAdmin: async () => ({ userId: 'test' }) }, '@/lib/supabase/admin': { getSupabaseAdmin: () => ({ from: () => query }) } })('app/api/admin/submissions/route.ts')
  assert.equal((await route.GET(new Request('https://example.invalid?kind=contact'))).status, 200)
  assert.equal((await route.GET(new Request('https://example.invalid?kind=application'))).status, 200)
  const body = { kind: 'application', id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', status: 'reviewing' }
  const patch = value => route.PATCH(new Request('https://example.invalid', { method: 'PATCH', body: JSON.stringify(value) }))
  assert.equal((await patch(body)).status, 404)
  assert.equal((await patch({ ...body, created_at: '2099-01-01' })).status, 400)
  assert.equal((await patch(null)).status, 400)
  assert.equal(calls.length, 3)
  for (const [column, value] of calls) { assert.equal(column, 'retention_expires_at'); assert.ok(Number.isFinite(Date.parse(value))) }
})

test('retention status is admin-only and reports stale/missing evidence as unhealthy', async () => {
  let reads = 0
  for (const [admin, lastSuccess, expected] of [[false, null, 401], [true, null, 503], [true, '2020-01-01T00:00:00Z', 200], [true, new Date().toISOString(), 200]]) {
    const route = loader({
      '@/lib/admin-auth': { requireWebsiteAdmin: async () => admin ? { userId: 'test' } : null },
      '@/lib/supabase/admin': { getSupabaseAdmin: () => ({ from() { reads++; return { select() { return this }, eq() { return this }, maybeSingle: async () => ({ data: lastSuccess ? { last_success_at: lastSuccess } : null }) } } }) },
    })('app/api/admin/retention/route.ts')
    const response = await route.GET(new Request('https://example.invalid'))
    assert.equal(response.status, expected)
    assert.match(response.headers.get('Cache-Control'), /private, no-store/)
    if (!admin) assert.equal(reads, 0)
    if (lastSuccess) assert.equal((await response.json()).healthy, !lastSuccess.startsWith('2020'))
  }
})

test('external health check fails if retention cannot execute', async () => {
  const db = { from: () => ({ select() { return this }, limit() { return this }, abortSignal: async () => ({ error: null }) }), rpc: () => ({ abortSignal: async () => ({ error: {} }) }) }
  const { GET } = loader({ '@/lib/supabase/admin': { getSupabaseAdmin: () => db } }, { CRON_SECRET: 'synthetic' })('app/api/cron/database-health/route.ts')
  const response = await GET(new Request('https://example.invalid', { headers: { Authorization: 'Bearer synthetic' } }))
  assert.equal(response.status, 503)
})

test('retired CV route cannot create a signed download URL', async () => {
  const response = await loader()('app/api/admin/cv/route.ts').GET()
  assert.equal(response.status, 410)
  assert.equal((await response.json()).url, undefined)
})
