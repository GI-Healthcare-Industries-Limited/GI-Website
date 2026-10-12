import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

const source = ts.transpileModule(readFileSync('lib/career-opening-types.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const module = { exports: {} }
new Function('module', 'exports', source)(module, module.exports)
const { getOpenCareerOpenings, isCareerOpeningOpenAt, selectOpenCareerOpeningId } = module.exports

const now = Date.parse('2026-10-12T12:00:00Z')
const opening = (id, overrides = {}) => ({
  id,
  job_title: `Role ${id}`,
  closes_at: null,
  is_open: true,
  ...overrides,
})

test('the application selector exposes only roles that are open at the checked time', () => {
  const items = [
    opening('open-no-date'),
    opening('open-future', { closes_at: '2026-10-13T00:00:00Z' }),
    opening('closed-flag', { is_open: false }),
    opening('closed-boundary', { closes_at: '2026-10-12T12:00:00Z' }),
    opening('closed-invalid', { closes_at: 'not-a-date' }),
  ]
  assert.deepEqual(getOpenCareerOpenings(items, now).map((item) => item.id), ['open-no-date', 'open-future'])
  assert.equal(isCareerOpeningOpenAt(items[3], now), false)
})

test('closed requested roles fall back to an open role and never remain selected', () => {
  const items = [
    opening('closed', { job_title: 'Closed role', is_open: false }),
    opening('open', { job_title: 'Open role' }),
  ]
  assert.equal(selectOpenCareerOpeningId(items, now, 'closed'), 'open')
  assert.equal(selectOpenCareerOpeningId(items, now, '', 'Closed role'), 'open')
  assert.equal(selectOpenCareerOpeningId(items, now, 'open'), 'open')
  assert.equal(selectOpenCareerOpeningId([items[0]], now, 'closed'), '')
})
