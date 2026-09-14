import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const title = 'Embedded Systems Engineer'
const validApplication = { jobTitle: title, name: 'Applicant Test', email: 'test@example.invalid', portfolioUrl: 'https://example.invalid/portfolio', projectSummary: 'A test-only project with sufficient detail to exercise application validation without real applicant data.', rightToWork: 'yes', immigrationStatus: 'british_irish', privacyNoticeVersion: '2026-09-14', dataSharingAcknowledged: true, dataSharingStatementVersion: 'recruitment-data-sharing-v1' }

function loadRoute(file, overrides = {}) {
  let writes = 0
  let notifications = 0
  let update
  let filter
  const query = { insert() { writes++; return this }, update(value) { writes++; update = value; return this }, select() { return this }, eq(...args) { filter = args; return this }, single: async () => overrides.insertError ? { error: { message: overrides.insertError } } : { data: { id: 'test-id' } }, maybeSingle: async () => ({ data: { job_title: title } }) }
  const cache = new Map()
  const dependencies = {
    'server-only': {},
    '@/lib/admin-auth': { requireWebsiteAdmin: async () => overrides.admin === false ? null : { userId: 'test-admin' } },
    '@/lib/supabase/admin': { getSupabaseAdmin: () => ({ from: () => query }) },
    '@/lib/career-openings': { getCareerOpenings: async () => {
      if (overrides.unavailable) throw new Error('Unavailable')
      return { items: [{ job_title: title, is_open: overrides.open !== false }], checkedAt: new Date().toISOString() }
    } },
    'next/server': { after: () => notifications++ },
    '@/lib/notify': { sendSubmissionNotification() {} },
  }
  function load(path) {
    if (cache.has(path)) return cache.get(path)
    const mod = { exports: {} }
    const code = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
    new Function('require', 'module', 'exports', 'process', 'console', code)(name => {
      if (name === '@/lib/submissions') return { ...load('lib/submissions.ts'), isRateLimited: async () => false }
      if (name in dependencies) return dependencies[name]
      if (name.startsWith('@/')) return load(`${name.slice(2)}.ts`)
      return require(name)
    }, mod, mod.exports, { env: { SUBMISSION_HASH_SECRET: 'test-only' } }, { error() {} })
    cache.set(path, mod.exports)
    return mod.exports
  }
  return { route: load(file), get writes() { return writes }, get notifications() { return notifications }, get update() { return update }, get filter() { return filter } }
}

function request(method, body) {
  return new Request('https://example.com/api/test', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
}

test('closed applications cannot be submitted or notify the team', async () => {
  const f = loadRoute('app/api/applications/route.ts', { open: false })
  const response = await f.route.POST(request('POST', validApplication))
  assert.equal(response.status, 409)
  assert.equal((await response.json()).code, 'APPLICATION_CLOSED')
  assert.equal(f.writes, 0)
  assert.equal(f.notifications, 0)
})

test('deadline passing between availability check and insert is still reported as closed', async () => {
  const f = loadRoute('app/api/applications/route.ts', { insertError: 'APPLICATION_CLOSED' })
  assert.equal((await f.route.POST(request('POST', validApplication))).status, 409)
  assert.equal(f.notifications, 0)
})

test('unavailable opening data fails safely without accepting an application', async () => {
  const f = loadRoute('app/api/applications/route.ts', { unavailable: true })
  assert.equal((await f.route.POST(request('POST', validApplication))).status, 503)
  assert.equal(f.writes, 0)
})

test('open roles retain normal storage and notification behavior', async () => {
  const f = loadRoute('app/api/applications/route.ts')
  assert.equal((await f.route.POST(request('POST', validApplication))).status, 201)
  assert.equal(f.writes, 1)
  assert.equal(f.notifications, 1)
})

test('right-to-work ineligibility is still rejected server-side', async () => {
  const f = loadRoute('app/api/applications/route.ts')
  assert.equal((await f.route.POST(request('POST', { ...validApplication, rightToWork: 'no' }))).status, 400)
  assert.equal(f.writes, 0)
})

test('deadline administration requires an authenticated website admin', async () => {
  const f = loadRoute('app/api/admin/openings/route.ts', { admin: false })
  assert.equal((await f.route.GET(new Request('https://example.com'))).status, 401)
  assert.equal((await f.route.PATCH(request('PATCH', { jobTitle: title, closingDate: null }))).status, 401)
  assert.equal(f.writes, 0)
})

test('invalid dates, missing fields, and unknown roles cannot change deadlines', async () => {
  for (const body of [null, {}, { jobTitle: title }, { jobTitle: 'Unknown', closingDate: null }, { jobTitle: title, closingDate: '2026-02-30' }, { jobTitle: title, closingDate: '2100-01-01' }]) {
    const f = loadRoute('app/api/admin/openings/route.ts')
    assert.equal((await f.route.PATCH(request('PATCH', body))).status, 400)
    assert.equal(f.writes, 0)
  }
})

test('an admin can set and clear only the selected role closing date', async () => {
  for (const closingDate of ['2026-12-31', null]) {
    const f = loadRoute('app/api/admin/openings/route.ts')
    assert.equal((await f.route.PATCH(request('PATCH', { jobTitle: title, closingDate }))).status, 200)
    assert.equal(f.update.closing_date, closingDate)
    assert.deepEqual(f.filter, ['job_title', title])
  }
})

test('start date can be set and cleared independently without resetting closing date', async () => {
  for (const startDate of ['2026-12-01', null]) {
    const f = loadRoute('app/api/admin/openings/route.ts')
    assert.equal((await f.route.PATCH(request('PATCH', { jobTitle: title, startDate }))).status, 200)
    assert.equal(f.update.start_date, startDate)
    assert.equal('closing_date' in f.update, false)
    assert.deepEqual(f.filter, ['job_title', title])
  }
})

test('both dates can be saved together; malformed start dates and extra fields are rejected', async () => {
  const f = loadRoute('app/api/admin/openings/route.ts')
  assert.equal((await f.route.PATCH(request('PATCH', { jobTitle: title, closingDate: '2026-10-01', startDate: '2026-11-01' }))).status, 200)
  assert.equal(f.update.start_date, '2026-11-01')
  assert.equal(f.update.closing_date, '2026-10-01')
  for (const input of [{ startDate: '2026-02-30' }, { startDate: '2100-01-01' }, { startDate: null, is_open: true }]) {
    const invalid = loadRoute('app/api/admin/openings/route.ts')
    assert.equal((await invalid.route.PATCH(request('PATCH', { jobTitle: title, ...input }))).status, 400)
    assert.equal(invalid.writes, 0)
  }
})
