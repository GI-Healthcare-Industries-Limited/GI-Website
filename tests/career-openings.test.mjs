import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'
import { personalAnswers } from './fixtures/personal-answers.mjs'

const require = createRequire(import.meta.url)
const title = 'Embedded Systems Engineer'
const identity = { id: '11111111-1111-4111-8111-111111111111', expectedUpdatedAt: '2026-09-14T12:00:00+00:00' }
const posting = { jobTitle: 'QA Test Role', location: 'Edinburgh, UK', department: 'Engineering', employmentType: 'Part-time', description: 'Synthetic description for job management tests.', acceptingApplications: true, closingDate: null, startDate: null }
const validApplication = { jobTitle: title, name: 'Applicant Test', email: 'test@example.invalid', portfolioUrl: 'https://example.invalid/portfolio', projectSummary: 'A test-only project with sufficient detail to exercise application validation without real applicant data.', rightToWork: 'yes', immigrationStatus: 'british_irish', dataSharingAcknowledged: true, dataSharingStatementVersion: 'recruitment-data-sharing-v1', ...personalAnswers }

function loadRoute(file, overrides = {}) {
  let writes = 0
  let notifications = 0
  let update
  let filter
  const filters = []
  const tables = []
  const result = () => overrides.insertError ? { error: { message: overrides.insertError } } : overrides.writeError ? { error: { code: overrides.writeError } } : { data: overrides.missing ? null : { id: identity.id, job_title: title } }
  const query = { insert(value) { writes++; update = value; return this }, delete() { writes++; return this }, update(value) { writes++; update = value; return this }, select() { return this }, eq(...args) { filter = args; filters.push(args); return this }, single: async () => result(), maybeSingle: async () => result() }
  const cache = new Map()
  const dependencies = {
    'server-only': {},
    '@/lib/admin-auth': { requireWebsiteAdmin: async () => overrides.admin === false ? null : { userId: 'test-admin' } },
    '@/lib/supabase/admin': { getSupabaseAdmin: () => ({ from: (table) => { tables.push(table); return query } }) },
    '@/lib/career-openings': { getCareerOpenings: async () => {
      if (overrides.unavailable) throw new Error('Unavailable')
      return { items: overrides.empty ? [] : [{ id: identity.id, job_title: overrides.title || title, is_open: overrides.open !== false }], checkedAt: new Date().toISOString() }
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
  return { route: load(file), filters, tables, get writes() { return writes }, get notifications() { return notifications }, get update() { return update }, get filter() { return filter } }
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
  assert.equal((await f.route.POST(request('POST', posting))).status, 401)
  assert.equal((await f.route.DELETE(request('DELETE', identity))).status, 401)
  assert.equal(f.writes, 0)
})

test('invalid dates, missing IDs, and missing fields cannot change deadlines', async () => {
  for (const body of [null, {}, identity, { jobTitle: title, closingDate: null }, { ...identity, closingDate: '2026-02-30' }, { ...identity, closingDate: '2100-01-01' }]) {
    const f = loadRoute('app/api/admin/openings/route.ts')
    assert.equal((await f.route.PATCH(request('PATCH', body))).status, 400)
    assert.equal(f.writes, 0)
  }
})

test('an admin can set and clear only the selected role closing date', async () => {
  for (const closingDate of ['2026-12-31', null]) {
    const f = loadRoute('app/api/admin/openings/route.ts')
    assert.equal((await f.route.PATCH(request('PATCH', { ...identity, closingDate }))).status, 200)
    assert.equal(f.update.closing_date, closingDate)
    assert.deepEqual(f.filters, [['id', identity.id], ['updated_at', identity.expectedUpdatedAt]])
  }
})

test('start date can be set and cleared independently without resetting closing date', async () => {
  for (const startDate of ['2026-12-01', null]) {
    const f = loadRoute('app/api/admin/openings/route.ts')
    assert.equal((await f.route.PATCH(request('PATCH', { ...identity, startDate }))).status, 200)
    assert.equal(f.update.start_date, startDate)
    assert.equal('closing_date' in f.update, false)
    assert.deepEqual(f.filters, [['id', identity.id], ['updated_at', identity.expectedUpdatedAt]])
  }
})

test('both dates can be saved together; malformed start dates and extra fields are rejected', async () => {
  const f = loadRoute('app/api/admin/openings/route.ts')
  assert.equal((await f.route.PATCH(request('PATCH', { ...identity, closingDate: '2026-10-01', startDate: '2026-11-01' }))).status, 200)
  assert.equal(f.update.start_date, '2026-11-01')
  assert.equal(f.update.closing_date, '2026-10-01')
  for (const input of [{ startDate: '2026-02-30' }, { startDate: '2100-01-01' }, { startDate: null, is_open: true }]) {
    const invalid = loadRoute('app/api/admin/openings/route.ts')
    assert.equal((await invalid.route.PATCH(request('PATCH', { ...identity, ...input }))).status, 400)
    assert.equal(invalid.writes, 0)
  }
})

test('admin can create a new role, rename it and close it using its stable ID', async () => {
  const f = loadRoute('app/api/admin/openings/route.ts')
  assert.equal((await f.route.POST(request('POST', posting))).status, 201)
  assert.equal(f.update.job_title, posting.jobTitle)
  assert.equal(f.update.employment_type, 'Part-time')
  const response = await f.route.PATCH(request('PATCH', { ...identity, jobTitle: 'Renamed role', acceptingApplications: false }))
  assert.equal(response.status, 200)
  assert.equal(f.update.accepting_applications, false)
  assert.equal(f.update.job_title, 'Renamed role')
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
})

test('invalid postings and unbounded or malformed input do not reach the database', async () => {
  for (const body of [{ ...posting, jobTitle: ' ' }, { ...posting, description: 'short' }, { ...posting, employmentType: 'unknown' }, { ...posting, id: identity.id }, { ...posting, description: 'a'.repeat(17000) }]) {
    const f = loadRoute('app/api/admin/openings/route.ts')
    assert.ok([400, 413].includes((await f.route.POST(request('POST', body))).status))
    assert.equal(f.writes, 0)
  }
})

test('duplicate titles report a conflict; stale edits and removals do not report success', async () => {
  const duplicate = loadRoute('app/api/admin/openings/route.ts', { writeError: '23505' })
  assert.equal((await duplicate.route.POST(request('POST', posting))).status, 409)
  const stale = loadRoute('app/api/admin/openings/route.ts', { missing: true })
  assert.equal((await stale.route.PATCH(request('PATCH', { ...identity, ...posting }))).status, 409)
  assert.equal((await stale.route.DELETE(request('DELETE', identity))).status, 409)
})

test('removal targets just the selected posting and never deletes applications', async () => {
  const f = loadRoute('app/api/admin/openings/route.ts')
  assert.equal((await f.route.DELETE(request('DELETE', identity))).status, 200)
  assert.deepEqual(f.tables, ['career_openings'])
  assert.deepEqual(f.filters, [['id', identity.id], ['updated_at', identity.expectedUpdatedAt]])
  for (const body of [{}, { id: identity.id }, { ...identity, id: 'invalid' }]) {
    const invalid = loadRoute('app/api/admin/openings/route.ts')
    assert.equal((await invalid.route.DELETE(request('DELETE', body))).status, 400)
    assert.equal(invalid.writes, 0)
  }
})

test('dynamic roles accept applications and store canonical title by stable ID', async () => {
  const f = loadRoute('app/api/applications/route.ts', { title: posting.jobTitle })
  assert.equal((await f.route.POST(request('POST', { ...validApplication, openingId: identity.id, jobTitle: 'Outdated title' }))).status, 201)
  assert.equal(f.update.job_title, posting.jobTitle)
  assert.equal(f.update.opening_id, identity.id)
})

test('empty listings, stale IDs and deleted roles reject applications without a write', async () => {
  for (const overrides of [{ empty: true }, {}]) {
    const f = loadRoute('app/api/applications/route.ts', overrides)
    assert.equal((await f.route.POST(request('POST', { ...validApplication, openingId: '22222222-2222-4222-8222-222222222222' }))).status, 409)
    assert.equal(f.writes, 0)
  }
  const race = loadRoute('app/api/applications/route.ts', { insertError: 'APPLICATION_OPENING_UNAVAILABLE' })
  assert.equal((await race.route.POST(request('POST', validApplication))).status, 409)
  assert.equal(race.notifications, 0)
})
