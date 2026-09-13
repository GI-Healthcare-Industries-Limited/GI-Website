import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const base = { jobTitle: 'Embedded Systems Engineer', name: 'Synthetic Test', email: 'test@example.invalid', portfolioUrl: 'https://example.invalid', projectSummary: 'A synthetic test project description to validate the submission flow without using any real applicant data.', consent: 'yes', rightToWork: 'yes' }
const visa = { immigrationStatus: 'graduate', workPermission: 'yes', shareCode: 'w12 345 678', dateOfBirth: '2000-02-29' }

function harness(options = {}) {
  const writes = [], emails = [], logs = [], reads = []
  let filter
  const cache = new Map()
  const query = {
    insert(value) { writes.push(value); return this },
    select(value) { reads.push(value); return this },
    eq(...value) { filter = value; return this },
    order() { return this },
    limit: async () => ({ data: [] }),
    single: async () => options.error ? { error: { message: 'Constraint failed', details: JSON.stringify(visa) } } : { data: { id } },
    maybeSingle: async () => ({ data: options.missing ? null : { immigration_status: 'graduate', right_to_work_share_code: 'W12345678', right_to_work_date_of_birth: '2000-02-29' } }),
  }
  const dependencies = {
    'server-only': {},
    '@/lib/admin-auth': { requireWebsiteAdmin: async () => options.admin === false ? null : { userId: 'synthetic-admin' } },
    '@/lib/supabase/admin': { getSupabaseAdmin: () => ({ from: () => query }) },
    '@/lib/career-openings': { getCareerOpenings: async () => ({ items: [{ job_title: base.jobTitle, is_open: true }] }) },
    'next/server': { after: async (callback) => callback() },
    '@/lib/notify': { sendSubmissionNotification: async (value) => emails.push(value) },
  }
  function load(file) {
    if (cache.has(file)) return cache.get(file)
    const mod = { exports: {} }
    const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
    new Function('require', 'module', 'exports', 'process', 'console', code)((name) => {
      if (name === '@/lib/submissions') return { ...load('lib/submissions.ts'), isRateLimited: async () => false }
      if (name in dependencies) return dependencies[name]
      return name.startsWith('@/') ? load(`${name.slice(2)}.ts`) : require(name)
    }, mod, mod.exports, { env: { SUBMISSION_HASH_SECRET: 'synthetic-test-secret' } }, { error: (...args) => logs.push(args) })
    cache.set(file, mod.exports)
    return mod.exports
  }
  return { load, writes, emails, logs, reads, get filter() { return filter } }
}

function request(body) {
  return new Request('https://example.invalid/api/applications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
}

test('British and Irish citizen route needs neither code nor DOB and discards irrelevant evidence', () => {
  const { rightToWorkSchema } = harness().load('lib/right-to-work.ts')
  const data = rightToWorkSchema.parse({ ...base, ...visa, immigrationStatus: 'british_irish' })
  assert.equal(data.shareCode, '')
  assert.equal(data.dateOfBirth, '')
  assert.equal(data.workPermission, '')
})

test('each listed permission accepts a declaration for human review, not automated verification', () => {
  const { rightToWorkSchema, IMMIGRATION_OPTIONS } = harness().load('lib/right-to-work.ts')
  for (const { value } of IMMIGRATION_OPTIONS) {
    const result = rightToWorkSchema.parse({ ...base, ...visa, immigrationStatus: value, studentConditions: 'yes' })
    assert.equal(result.shareCode, 'W12345678')
    assert.equal(result.dateOfBirth, '2000-02-29')
    assert.equal(result.studentConditions, value === 'student' ? 'yes' : '')
    assert.equal(result.verified, undefined)
  }
})

test('server rejects missing answers, no permission, sponsorship, malformed codes and invalid dates before writing', async () => {
  const changes = [
    { rightToWork: 'no' }, { immigrationStatus: undefined }, { immigrationStatus: 'none' },
    { immigrationStatus: 'skilled_worker' }, { immigrationStatus: 'invented' },
    { workPermission: '' }, { shareCode: '' }, { shareCode: 'R12345678' }, { shareCode: 'S12345678' },
    { shareCode: 'W1234567' }, { shareCode: 'W123456789' }, { shareCode: 'W12345!78' },
    { dateOfBirth: '' }, { dateOfBirth: '2001-02-29' }, { dateOfBirth: '2100-01-01' },
    { dateOfBirth: new Date().toISOString().slice(0, 10) }, { dateOfBirth: '01/02/2000' },
    { immigrationStatus: 'student', studentConditions: '' },
  ]
  for (const change of changes) {
    const f = harness()
    const response = await f.load('app/api/applications/route.ts').POST(request({ ...base, ...visa, ...change }))
    assert.equal(response.status, 400, JSON.stringify(change))
    assert.equal(f.writes.length, 0)
    assert.equal(f.emails.length, 0)
  }
})

test('application and evidence are saved in one insert; notification and response exclude private evidence', async () => {
  const f = harness()
  const response = await f.load('app/api/applications/route.ts').POST(request({ ...base, ...visa }))
  assert.equal(response.status, 201)
  assert.equal(f.writes.length, 1)
  assert.equal(f.writes[0].right_to_work_share_code, 'W12345678')
  assert.equal(f.writes[0].right_to_work_date_of_birth, '2000-02-29')
  assert.equal(f.writes[0].work_permission_declared, true)
  const output = JSON.stringify([await response.json(), f.emails, f.logs])
  assert.doesNotMatch(output, /W12345678|2000-02-29|"Confirmed"/)
  assert.match(JSON.stringify(f.emails), /employer check required/)
})

test('citizen insert never stores code, DOB or visa declarations', async () => {
  const f = harness()
  const response = await f.load('app/api/applications/route.ts').POST(request({ ...base, ...visa, immigrationStatus: 'british_irish' }))
  assert.equal(response.status, 201)
  for (const key of ['right_to_work_share_code', 'right_to_work_date_of_birth', 'work_permission_declared', 'student_conditions_acknowledged']) assert.equal(f.writes[0][key], null)
})

test('database errors cannot leak a failing row into application logs or responses', async () => {
  const f = harness({ error: true })
  const response = await f.load('app/api/applications/route.ts').POST(request({ ...base, ...visa }))
  assert.equal(response.status, 503)
  assert.doesNotMatch(JSON.stringify([f.logs, await response.json()]), /2000-02-29|w12 345 678|Constraint failed/)
  assert.equal(f.emails.length, 0)
})

test('private evidence endpoint requires an authorised website admin, valid ID and no caching', async () => {
  const unauthorised = harness({ admin: false })
  const denied = await unauthorised.load('app/api/admin/right-to-work/route.ts').GET(new Request(`https://example.invalid?id=${id}`))
  assert.equal(denied.status, 401)
  assert.equal(unauthorised.reads.length, 0)
  assert.match(denied.headers.get('Cache-Control'), /no-store/)
  const f = harness()
  const route = f.load('app/api/admin/right-to-work/route.ts')
  assert.equal((await route.GET(new Request('https://example.invalid?id=bad'))).status, 400)
  assert.equal(f.reads.length, 0)
  const allowed = await route.GET(new Request(`https://example.invalid?id=${id}`))
  assert.equal(allowed.status, 200)
  assert.deepEqual(f.filter, ['id', id])
  assert.equal(allowed.headers.get('Vary'), 'Authorization')
  assert.match(allowed.headers.get('Cache-Control'), /private, no-store/)
  assert.equal((await allowed.json()).evidence.right_to_work_share_code, 'W12345678')
  assert.equal((await harness({ missing: true }).load('app/api/admin/right-to-work/route.ts').GET(new Request(`https://example.invalid?id=${id}`))).status, 404)
})

test('bulk application list never selects private code, DOB or immigration category', async () => {
  const f = harness()
  const response = await f.load('app/api/admin/submissions/route.ts').GET(new Request('https://example.invalid?kind=application'))
  assert.equal(response.status, 200)
  assert.doesNotMatch(f.reads.join(), /share_code|date_of_birth|immigration_status/)
})
