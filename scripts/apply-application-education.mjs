// Dry run by default. --apply commits only this additive migration.
// No real applications are inserted; test values live in a temporary table.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import pg from 'pg'

const apply = process.argv.includes('--apply')
const url = new URL(process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL)
assert(url.hostname.endsWith('.supabase.com') && decodeURIComponent(url.username).includes('qucjtakhurjajoyxbmfh'), 'Unexpected database target')
url.searchParams.delete('sslmode')
const ca = await fetch('https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt')
assert(ca.ok)
const db = new pg.Client({ connectionString: url.href, ssl: { ca: await ca.text(), rejectUnauthorized: true }, connectionTimeoutMillis: 10000 })
await db.connect()
try {
  await db.query('begin; set local statement_timeout=20000; set local lock_timeout=3000;')
  await db.query('lock table public.career_applications in access exclusive mode')
  const fingerprintSql = `select count(*)::int as count, md5(coalesce(string_agg(md5((to_jsonb(a) - 'education')::text), '' order by id), '')) as fingerprint from public.career_applications a`
  const before = (await db.query(fingerprintSql)).rows[0]
  const installed = (await db.query("select exists(select 1 from information_schema.columns where table_schema='public' and table_name='career_applications' and column_name='education') installed")).rows[0].installed
  if (!installed) await db.query(await readFile(new URL('../supabase/migrations/20260916010000_application_education.sql', import.meta.url), 'utf8'))
  assert.deepEqual((await db.query(fingerprintSql)).rows[0], before, 'Existing rows changed')
  const security = (await db.query(`select
    not has_column_privilege('anon','public.career_applications','education','SELECT') as private,
    has_column_privilege('service_role','public.career_applications','education','INSERT') as writable,
    (select relrowsecurity from pg_class where oid='public.career_applications'::regclass) as rls`)).rows[0]
  assert(security.private && security.writable && security.rls)
  const constraints = (await db.query("select pg_get_constraintdef(oid) as definition from pg_constraint where conrelid='public.career_applications'::regclass and conname in ('career_applications_education_check','career_applications_v5_education_required') and convalidated order by conname")).rows
  assert.equal(constraints.length, 2)
  await db.query(`create temporary table education_checks (education jsonb, linkedin_url text, privacy_notice_version text, ${constraints.map(c => c.definition).join(', ')}) on commit drop`)
  const student = { status: 'student', degree: 'BSc Computing', studyYear: 'Year 2' }
  const graduate = { status: 'graduate', graduationYear: '2025' }
  for (const [education, legacy, linkedIn, accepted] of [
    [null, true, true, true], [student, false, true, true], [graduate, false, true, true],
    [null, false, true, false], [student, false, false, false], [{}, false, true, false],
    [{ status: 'student' }, false, true, false], [{ ...student, degree: '' }, false, true, false],
    [{ ...student, degree: 'x'.repeat(121) }, false, true, false], [{ ...student, studyYear: '' }, false, true, false],
    [{ ...student, graduationYear: '2020' }, false, true, false],
    [{ status: 'graduate' }, false, true, false], [{ ...graduate, graduationYear: '25' }, false, true, false],
    [{ ...graduate, graduationYear: 2025 }, false, true, false], [{ ...graduate, degree: 'extra' }, false, true, false],
  ]) {
    await db.query('savepoint check_education')
    let rejected = false
    try { await db.query('insert into education_checks values ($1,$2,$3)', [education === null ? null : JSON.stringify(education), linkedIn ? 'https://www.linkedin.com/in/synthetic-test/' : null, legacy ? '2026-09-15-applications-v4' : '2026-09-16-applications-v5']) }
    catch (error) { if (error.code !== '23514') throw error; rejected = true }
    await db.query('rollback to savepoint check_education; release savepoint check_education')
    assert.equal(rejected, !accepted)
  }
  await db.query(apply ? 'commit' : 'rollback')
  console.log(JSON.stringify({ mode: apply ? 'committed' : 'dry run rolled back', migration: '20260916010000_application_education', previouslyInstalled: installed, existingRecordsUnchanged: true, restrictedAccess: true, constraintsPassed: true, realApplicationsWritten: 0 }))
} catch (error) {
  await db.query('rollback')
  console.error('Education migration failed; rolled back.', { code: error.code || error.name })
  process.exitCode = 1
} finally { await db.end() }
