import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'
import { personalAnswers } from './fixtures/personal-answers.mjs'

const require = createRequire(import.meta.url)
const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const base = { jobTitle: 'Embedded Systems Engineer', name: 'Synthetic Test', email: 'test@example.invalid', portfolioUrl: 'https://example.invalid', projectSummary: 'A synthetic test project description to validate the submission flow without using any real applicant data.', rightToWork: 'yes', dataSharingAcknowledged: true, dataSharingStatementVersion: 'recruitment-data-sharing-v1', ...personalAnswers }
const visa = { immigrationStatus: 'graduate', workPermission: 'yes', shareCode: 'w12 345 678', dateOfBirth: '2000-02-29' }

function harness(options = {}) {
  const writes = [], emails = [], logs = [], reads = []
  let filter
  const cache = new Map()
  const query = {
    insert(value) { writes.push(value); return this },
    select(value) { reads.push(value); return this },
    eq(...value) { filter = value; return this },
    gt(...value) { reads.push(value.join(':')); return this },
    order() { return this },
    limit: async () => ({ data: [] }),
    single: async () => options.error ? { error: { message: 'Constraint failed', details: JSON.stringify(visa) } } : { data: { id } },
    maybeSingle: async () => ({ data: options.missing ? null : { immigration_status: 'graduate', work_permission_declared: true } }),
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

test('LinkedIn is required and invalid or non-profile links never reach storage', async () => {
  for (const linkedInUrl of [undefined, null, '', '   ', 'not-a-url', 'http://www.linkedin.com/in/test', 'https://linkedin.com.evil.invalid/in/test', 'https://evil.invalid/linkedin.com/in/test', 'https://www.linkedin.com/company/test', 'https://www.linkedin.com/in/', 'https://u:p@www.linkedin.com/in/test', 'https://www.linkedin.com:444/in/test', 'https://www.linkedin.com/in/%2Ftest', 'javascript:alert(1)', 'https://www.linkedin.com/in/' + 'a'.repeat(2048)]) {
    const f = harness()
    const response = await f.load('app/api/applications/route.ts').POST(request({ ...base, ...visa, linkedInUrl }))
    assert.equal(response.status, 400, String(linkedInUrl))
    assert.equal(f.writes.length, 0)
    assert.equal(f.emails.length, 0)
  }
})

test('LinkedIn is normalised, saved separately from phone and kept out of notifications', async () => {
  for (const linkedInUrl of [' https://uk.linkedin.com/in/synthetic-test/?trk=example#about ', 'https://linkedin.com/in/synthetic-test', 'https://www.linkedin.com/in/synthetic-test/']) {
    const f = harness()
    const response = await f.load('app/api/applications/route.ts').POST(request({ ...base, ...visa, linkedInUrl, phone: '+440000000000' }))
    assert.equal(response.status, 201)
    assert.equal(f.writes[0].linkedin_url, 'https://www.linkedin.com/in/synthetic-test/')
    assert.equal(f.writes[0].phone, undefined)
    assert.doesNotMatch(JSON.stringify(f.emails), /linkedin|440000/)
  }
})

test('only authenticated application listings include LinkedIn; expiry protection remains', async () => {
  const f = harness()
  await f.load('app/api/admin/submissions/route.ts').GET(new Request('https://example.invalid?kind=application'))
  assert(f.reads.some(value => value.includes('linkedin_url')))
  assert(f.reads.some(value => value.startsWith('retention_expires_at:')))
  const contact = harness()
  await contact.load('app/api/admin/submissions/route.ts').GET(new Request('https://example.invalid?kind=contact'))
  assert(!contact.reads.some(value => value.includes('linkedin_url')))
})

test('work links are optional and do not consume the work-answer word limit', async () => {
  for (const workLinks of [undefined, [], ['https://example.invalid/one', 'http://example.invalid/two?demo=1']]) {
    const f = harness()
    const response = await f.load('app/api/applications/route.ts').POST(request({ ...base, ...visa, projectSummary: Array(80).fill('word').join(' '), workLinks }))
    assert.equal(response.status, 201)
    assert.deepEqual(f.writes[0].work_links, workLinks ?? [])
    assert.doesNotMatch(JSON.stringify(f.emails), /example.invalid|one|two/)
  }
})

test('work links validate count, scheme, length, login details and malformed input before storage', async () => {
  for (const workLinks of [null, 'https://example.invalid', [''], ['not-a-url'], ['javascript:alert(1)'], ['data:text/plain,hello'], ['ftp://example.invalid'], ['https://user:password@example.invalid'], [null], Array(6).fill('https://example.invalid'), ['https://example.invalid/' + 'a'.repeat(2048)]]) {
    const f = harness()
    const response = await f.load('app/api/applications/route.ts').POST(request({ ...base, ...visa, workLinks }))
    assert.equal(response.status, 400, JSON.stringify(workLinks))
    assert.equal(f.writes.length, 0)
    assert.equal(f.emails.length, 0)
  }
  const f = harness()
  const workLinks = Array.from({ length: 5 }, (_, index) => ` https://example.invalid/${index} `)
  const response = await f.load('app/api/applications/route.ts').POST(request({ ...base, ...visa, workLinks }))
  assert.equal(response.status, 201)
  assert.deepEqual(f.writes[0].work_links, workLinks.map(value => value.trim()))
})

test('admin work links remain under authentication and expiry filtering', async () => {
  const f = harness()
  await f.load('app/api/admin/submissions/route.ts').GET(new Request('https://example.invalid?kind=application'))
  assert(f.reads.some(value => value.includes('work_links')))
  assert(f.reads.some(value => value.startsWith('retention_expires_at:')))
  const denied = harness({ admin: false })
  assert.equal((await denied.load('app/api/admin/submissions/route.ts').GET(new Request('https://example.invalid?kind=application'))).status, 401)
  assert.equal(denied.reads.length, 0)
})

test('British and Irish citizen route needs neither code nor DOB and discards irrelevant evidence', () => {
  const { rightToWorkSchema } = harness().load('lib/right-to-work.ts')
  const data = rightToWorkSchema.parse({ ...base, ...visa, immigrationStatus: 'british_irish' })
  assert.equal(data.shareCode, undefined)
  assert.equal(data.dateOfBirth, undefined)
  assert.equal(data.workPermission, '')
})

test('each listed permission accepts a declaration for human review, not automated verification', () => {
  const { rightToWorkSchema, IMMIGRATION_OPTIONS } = harness().load('lib/right-to-work.ts')
  for (const { value } of IMMIGRATION_OPTIONS) {
    const result = rightToWorkSchema.parse({ ...base, ...visa, immigrationStatus: value, studentConditions: 'yes' })
    assert.equal(result.shareCode, undefined)
    assert.equal(result.dateOfBirth, undefined)
    assert.equal(result.studentConditions, value === 'student' ? 'yes' : '')
    assert.equal(result.verified, undefined)
  }
})

test('server rejects missing answers, no permission, unsupported categories and missing notice version before writing', async () => {
  const changes = [
    { rightToWork: 'no' }, { immigrationStatus: undefined }, { immigrationStatus: 'none' },
    { immigrationStatus: 'skilled_worker' }, { immigrationStatus: 'invented' },
    { workPermission: '' }, { privacyNoticeVersion: undefined }, { privacyNoticeVersion: 'old' },
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

test('application stores declaration and notice version; notification contains no personal data', async () => {
  const f = harness()
  const response = await f.load('app/api/applications/route.ts').POST(request({ ...base, ...visa }))
  assert.equal(response.status, 201)
  assert.equal(f.writes.length, 1)
  assert.equal(f.writes[0].right_to_work_share_code, undefined)
  assert.equal(f.writes[0].right_to_work_date_of_birth, undefined)
  assert.equal(f.writes[0].privacy_notice_version, personalAnswers.privacyNoticeVersion)
  assert.ok(Number.isFinite(Date.parse(f.writes[0].privacy_notice_provided_at)))
  assert.equal(f.writes[0].data_sharing_statement_version, personalAnswers.dataSharingStatementVersion)
  assert.equal(f.writes[0].data_sharing_acknowledged_at, f.writes[0].privacy_notice_provided_at)
  assert.equal(f.writes[0].work_permission_declared, true)
  const output = JSON.stringify([await response.json(), f.emails, f.logs])
  assert.doesNotMatch(output, /W12345678|2000-02-29|"Confirmed"/)
  assert.deepEqual(f.emails, ['application'])
  assert.doesNotMatch(JSON.stringify(f.emails), /Synthetic|example|graduate/)
})

test('application requires an explicit true checkbox and current statement before storage or notification', async () => {
  for (const change of [
    { dataSharingAcknowledged: undefined }, { dataSharingAcknowledged: false },
    { dataSharingAcknowledged: 'true' }, { dataSharingAcknowledged: 'yes' },
    { dataSharingAcknowledged: 1 }, { dataSharingAcknowledged: null },
    { dataSharingStatementVersion: undefined }, { dataSharingStatementVersion: 'old' },
  ]) {
    const f = harness()
    const response = await f.load('app/api/applications/route.ts').POST(request({ ...base, ...visa, ...change }))
    assert.equal(response.status, 400, JSON.stringify(change))
    assert.match((await response.json()).error, /tick the box|reload the page/)
    assert.equal(f.writes.length, 0)
    assert.equal(f.emails.length, 0)
  }
})

test('confirmation time is generated on the server, not accepted from the applicant', async () => {
  const f = harness()
  const before = Date.now()
  const response = await f.load('app/api/applications/route.ts').POST(request({ ...base, ...visa, dataSharingAcknowledgedAt: '1970-01-01', data_sharing_acknowledged_at: '1970-01-01' }))
  assert.equal(response.status, 201)
  const recorded = Date.parse(f.writes[0].data_sharing_acknowledged_at)
  assert.ok(recorded >= before && recorded <= Date.now())
})

test('citizen insert never stores code, DOB or visa declarations', async () => {
  const f = harness()
  const response = await f.load('app/api/applications/route.ts').POST(request({ ...base, ...visa, immigrationStatus: 'british_irish' }))
  assert.equal(response.status, 201)
  for (const key of ['right_to_work_share_code', 'right_to_work_date_of_birth']) assert.equal(f.writes[0][key], undefined)
  for (const key of ['work_permission_declared', 'student_conditions_acknowledged']) assert.equal(f.writes[0][key], null)
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
  assert.equal((await allowed.json()).evidence.right_to_work_share_code, undefined)
  assert.ok(f.reads.some(value => value.startsWith('retention_expires_at:')))
  assert.doesNotMatch(f.reads.join(), /share_code|date_of_birth/)
  assert.equal((await harness({ missing: true }).load('app/api/admin/right-to-work/route.ts').GET(new Request(`https://example.invalid?id=${id}`))).status, 404)
})

test('bulk application list never selects private code, DOB or immigration category', async () => {
  const f = harness()
  const response = await f.load('app/api/admin/submissions/route.ts').GET(new Request('https://example.invalid?kind=application'))
  assert.equal(response.status, 200)
  assert.doesNotMatch(f.reads.join(), /share_code|date_of_birth|immigration_status/)
})

test('all short answers and an award choice are required before any storage', async () => {
  for (const change of [
    { awardsStatus: undefined }, { awardsStatus: 'made-up' }, { awardEntries: [] },
    { awardEntries: [''] }, { awardEntries: undefined }, { awardEntries: [null] },
    { awardEntries: ['   '] }, { awardEntries: Array(11).fill('Award') },
    { biggestFailure: '' }, { growthArea: '' }, { projectSummary: '' },
    { projectSummary: ' '.repeat(100) }, { growthArea: 'a'.repeat(1601) },
    { applicationQuestionsVersion: undefined },
    { applicationQuestionsVersion: 'old' }, { privacyNoticeVersion: '2026-09-14' },
  ]) {
    const f = harness()
    assert.equal((await f.load('app/api/applications/route.ts').POST(request({ ...base, ...visa, ...change }))).status, 400, JSON.stringify(change))
    assert.equal(f.writes.length, 0)
    assert.equal(f.emails.length, 0)
  }
})

test('portfolio is optional, but non-empty links must be valid HTTP or HTTPS', async () => {
  for (const portfolioUrl of ['', '   ', undefined]) {
    const f = harness()
    assert.equal((await f.load('app/api/applications/route.ts').POST(request({ ...base, ...visa, portfolioUrl }))).status, 201)
    assert.equal(f.writes[0].portfolio_url, null)
  }
  for (const portfolioUrl of ['javascript:alert(1)', 'not a URL', 'file:///etc/passwd']) {
    const f = harness()
    assert.equal((await f.load('app/api/applications/route.ts').POST(request({ ...base, ...visa, portfolioUrl }))).status, 400)
    assert.equal(f.writes.length, 0)
  }
})

test('no awards yet needs no invented award or follow-up', async () => {
  const f = harness()
  assert.equal((await f.load('app/api/applications/route.ts').POST(request({ ...base, ...visa, awardsStatus: 'none_yet', awardEntries: [] }))).status, 201)
  assert.equal(f.writes[0].awards_status, 'none_yet')
  assert.deepEqual(f.writes[0].award_entries, [])
  assert.equal(f.writes[0].awards_detail, undefined)
  const conflict = harness()
  assert.equal((await conflict.load('app/api/applications/route.ts').POST(request({ ...base, ...visa, awardsStatus: 'none_yet' }))).status, 400)
  assert.equal(conflict.writes.length, 0)
})

test('short answers and ordered cards are stored without retired prompts or pledges', async () => {
  const f = harness()
  assert.equal((await f.load('app/api/applications/route.ts').POST(request({ ...base, ...visa, authorshipAcknowledged: true, authorshipConfirmedAt: '1970-01-01', awardsDetail: 'Retired answer', competitionAwards: 'Retired list', aiScore: 99, allowPaste: true, typingEvents: ['private'], clipboard: 'private', projectSummary: 'A small app.' }))).status, 201)
  const row = f.writes[0]
  for (const [field, input] of [['biggest_failure','biggestFailure'],['growth_area','growthArea']]) assert.equal(row[field], personalAnswers[input])
  assert.deepEqual(row.award_entries, personalAnswers.awardEntries)
  for (const field of ['authorship_confirmed_at','awards_detail','competition_awards']) assert.equal(row[field], undefined)
  assert.equal(row.application_questions_version, personalAnswers.applicationQuestionsVersion)
  assert.doesNotMatch(JSON.stringify(row), /aiScore|allowPaste|typingEvents|clipboard|1970-01-01/)
  assert.doesNotMatch(JSON.stringify([f.emails, f.logs]), /synthetic test rig|prototype|teammate/)
})

test('admin reads include all personal answers under the existing authentication and expiry filter', async () => {
  const f = harness()
  const response = await f.load('app/api/admin/submissions/route.ts').GET(new Request('https://example.invalid?kind=application'))
  assert.equal(response.status, 200)
  for (const field of ['awards_status','award_entries','competition_awards','awards_detail','biggest_failure','growth_area','authorship_confirmed_at','application_questions_version']) assert.ok(f.reads.join().includes(field))
  assert.match(f.reads.join(), /retention_expires_at/)
  assert.match(response.headers.get('Cache-Control'), /private, no-store/)
})

test('compact form has no paste restriction, pledge or input surveillance', () => {
  const source = readFileSync('app/apply/application-questions.tsx','utf8')
  assert.doesNotMatch(source, /onPaste|onDrop|authorship|AI-generated|allowPaste|clipboardData|navigator\.clipboard|onKeyDown|onKeyUp|localStorage|sessionStorage|Date\.now/)
  assert.match(source, /Add another award/)
})

test('word limits accept their exact boundary and reject excess on the server', async () => {
  for (const [field, max] of [['awardEntries',20],['projectSummary',80],['biggestFailure',50],['growthArea',40]]) {
    for (const [count, status] of [[max,201],[max+1,400]]) {
      const f = harness()
      const answer = Array(count).fill('word').join(' ')
      const value = field === 'awardEntries' ? [answer] : answer
      assert.equal((await f.load('app/api/applications/route.ts').POST(request({...base,...visa,[field]:value}))).status,status,`${field}:${count}`)
      assert.equal(f.writes.length,status===201?1:0)
    }
  }
})

test('word counting handles line breaks, Unicode whitespace, URLs and empty answers', () => {
  const { countWords } = harness().load('lib/application-questions.ts')
  for (const separator of [' ', '\t', '\n', '\u00a0', '\u202f', '\ufeff']) assert.equal(countWords(`one${separator}two`),2)
  assert.equal(countWords('  \n '),0)
  assert.equal(countWords('hands-on https://example.invalid'),2)
})
