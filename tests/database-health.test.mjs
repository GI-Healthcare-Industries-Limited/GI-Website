import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import test from 'node:test'
import ts from 'typescript'

const require = createRequire(import.meta.url)

// Run the actual TypeScript handlers with isolated server dependencies. No
// production credentials, network requests or applicant records are used.
function loadServer(dependencies, env = {}) {
  const cache = new Map()
  function load(path) {
    if (cache.has(path)) return cache.get(path)
    const module = { exports: {} }
    const source = ts.transpileModule(readFileSync(resolve(path), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText
    const localRequire = (name) => {
      if (name in dependencies) return dependencies[name]
      if (name === 'server-only') return {}
      if (name.startsWith('@/')) return load(`${name.slice(2)}.ts`)
      return require(name)
    }
    new Function('require', 'module', 'exports', 'process', 'console', source)(
      localRequire, module, module.exports, { env }, { info() {}, error() {} },
    )
    cache.set(path, module.exports)
    return module.exports
  }
  return load
}

function cronFixture(result = () => ({ error: null }), secret = 'test-cron-secret') {
  const calls = []
  const db = {
    from(table) {
      const call = { table }
      calls.push(call)
      return {
        select(columns, options) {
          Object.assign(call, { columns, options })
          return this
        },
        limit(limit) { call.limit = limit; return this },
        abortSignal(signal) { call.signal = signal; return Promise.resolve(result(call, calls.length)) },
      }
    },
  }
  const load = loadServer({ '@/lib/supabase/admin': { getSupabaseAdmin: () => db } }, { CRON_SECRET: secret })
  const { GET } = load('app/api/cron/database-health/route.ts')
  return {
    calls,
    run: (authorization = 'Bearer test-cron-secret') => GET(new Request('https://example.com/api/cron/database-health', {
      headers: authorization ? { authorization } : {},
    })),
  }
}

test('cron rejects missing, incorrect and undefined credentials without database access', async () => {
  for (const [secret, authorization] of [
    ['test-cron-secret', ''], ['test-cron-secret', 'Bearer wrong'],
    ['test-cron-secret', 'Bearer test-cron-secrex'], [undefined, 'Bearer undefined'], ['', 'Bearer '],
  ]) {
    const fixture = cronFixture(undefined, secret === undefined ? '' : secret)
    assert.equal((await fixture.run(authorization)).status, 401)
    assert.equal(fixture.calls.length, 0)
  }
})

test('cron performs three bounded HEAD queries and returns no personal data', async () => {
  const fixture = cronFixture()
  const response = await fixture.run()
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  const body = await response.json()
  assert.deepEqual(Object.keys(body).sort(), ['checkedAt', 'ok'])
  assert.equal(body.ok, true)
  assert.ok(Number.isFinite(Date.parse(body.checkedAt)))
  assert.deepEqual(fixture.calls.map(c => c.table), ['contact_submissions', 'career_applications', 'website_admins'])
  for (const call of fixture.calls) {
    assert.deepEqual(call.options, { head: true })
    assert.equal(call.limit, 1)
    assert.ok(call.signal instanceof AbortSignal)
  }
})

test('cron retries transient failures once', async () => {
  const fixture = cronFixture((call, n) => ({ error: n === 1 ? { message: 'Temporary error' } : null }))
  assert.equal((await fixture.run()).status, 200)
  assert.equal(fixture.calls.length, 6)
})

test('cron returns uncached 503 after persistent database errors', async () => {
  const fixture = cronFixture(() => ({ error: { message: 'Private upstream diagnostic' } }))
  const response = await fixture.run()
  assert.equal(response.status, 503)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.deepEqual(await response.json(), { ok: false, error: 'Database unavailable' })
  assert.equal(fixture.calls.length, 6)
})

test('cron fails safely when the database client cannot be configured', async () => {
  const load = loadServer({ '@/lib/supabase/admin': { getSupabaseAdmin() { throw new Error('Missing key') } } }, { CRON_SECRET: 'test' })
  const { GET } = load('app/api/cron/database-health/route.ts')
  const response = await GET(new Request('https://example.com', { headers: { authorization: 'Bearer test' } }))
  assert.equal(response.status, 503)
  assert.equal((await response.json()).ok, false)
})

for (const endpoint of ['contact', 'applications']) {
  for (const failureAt of ['rate-limit check', 'insert']) {
    test(`${endpoint} reports 503, not success, when the ${failureAt} fails`, async () => {
      let notifications = 0
      const db = { from: () => ({
        select() { return this }, eq() { return this },
        gte: async () => ({ count: 0, error: failureAt === 'rate-limit check' ? { message: 'Database down' } : null }),
        insert() { return this },
        single: async () => ({ data: null, error: { message: 'Database down' } }),
      }) }
      const load = loadServer({
        '@/lib/supabase/admin': { getSupabaseAdmin: () => db },
        'next/server': { after: () => notifications++ },
        '@/lib/notify': { sendSubmissionNotification() {} },
      }, { SUBMISSION_HASH_SECRET: 'test-only' })
      const { JOB_TITLES } = load('lib/submission-constants.ts')
      const body = {
        name: 'Test Applicant', email: 'test@example.com', message: 'This is a test enquiry.',
        jobTitle: JOB_TITLES[0], portfolioUrl: 'https://example.com/portfolio',
        projectSummary: 'This is an example project description used only for an isolated automated test. No data is sent.',
        rightToWork: 'yes', consent: 'yes',
      }
      const { POST } = load(`app/api/${endpoint}/route.ts`)
      const response = await POST(new Request(`https://example.com/api/${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      }))
      assert.equal(response.status, 503)
      assert.equal(response.headers.get('retry-after'), '60')
      const payload = await response.json()
      assert.equal(payload.ok, undefined)
      assert.match(payload.error, /could not confirm your submission/)
      assert.equal(notifications, 0)
    })
  }
}

test('input validation remains 400 rather than being mistaken for an outage', async () => {
  const load = loadServer({ '@/lib/supabase/admin': {} })
  const { contactSchema, submissionErrorResponse } = load('lib/submissions.ts')
  const { error } = contactSchema.safeParse({ name: '', email: '', message: '' })
  for (const invalid of [error, new SyntaxError('Invalid JSON')]) {
    const response = submissionErrorResponse(invalid)
    assert.equal(response.status, 400)
    assert.equal(response.headers.get('retry-after'), null)
  }
})
