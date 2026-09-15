// Dry run by default; --apply commits only the additive schema migration.
// Credentials come from the existing environment and are never printed.
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
  // Bound the DDL lock; compare old column values while concurrent writes wait.
  await db.query('lock table public.career_applications in access exclusive mode')
  const fingerprintSql = `select count(*)::int as count, md5(coalesce(string_agg(md5((to_jsonb(a) - 'linkedin_url')::text), '' order by id), '')) as fingerprint from public.career_applications a`
  const before = (await db.query(fingerprintSql)).rows[0]
  const installed = (await db.query("select exists(select 1 from information_schema.columns where table_schema='public' and table_name='career_applications' and column_name='linkedin_url') installed")).rows[0].installed
  if (!installed) await db.query(await readFile(new URL('../supabase/migrations/20260915143000_application_linkedin.sql', import.meta.url), 'utf8'))
  assert.deepEqual((await db.query(fingerprintSql)).rows[0], before, 'Existing rows changed')
  const security = (await db.query(`select
    not has_column_privilege('anon','public.career_applications','linkedin_url','SELECT') as private,
    has_column_privilege('service_role','public.career_applications','linkedin_url','INSERT') as writable,
    (select relrowsecurity from pg_class where oid='public.career_applications'::regclass) as rls,
    (select count(*)::int from pg_constraint where conrelid='public.career_applications'::regclass and conname in ('career_applications_linkedin_url_check','career_applications_v4_linkedin_required') and convalidated) as checks`)).rows[0]
  assert(security.private && security.writable && security.rls && security.checks === 2)
  // Exercise the actual installed checks on a TEMPORARY table, not real applicants.
  const constraints = (await db.query("select pg_get_constraintdef(oid) as definition from pg_constraint where conrelid='public.career_applications'::regclass and conname in ('career_applications_linkedin_url_check','career_applications_v4_linkedin_required') order by conname")).rows
  await db.query(`create temporary table linkedin_checks (linkedin_url text, privacy_notice_version text, ${constraints.map(c => c.definition).join(', ')}) on commit drop`)
  for (const [profile, version, accepted] of [
    [null, '2026-09-15-applications-v3', true],
    ['https://www.linkedin.com/in/synthetic-test/', '2026-09-15-applications-v4', true],
    [null, '2026-09-15-applications-v4', false],
    ['', '2026-09-15-applications-v4', false],
    ['https://evil.invalid/in/test/', '2026-09-15-applications-v4', false],
    ['javascript:alert(1)', '2026-09-15-applications-v4', false],
  ]) {
    await db.query('savepoint check_profile')
    let rejected = false
    try { await db.query('insert into linkedin_checks values ($1,$2)', [profile, version]) }
    catch (error) { if (error.code !== '23514') throw error; rejected = true }
    await db.query('rollback to savepoint check_profile; release savepoint check_profile')
    assert.equal(rejected, !accepted)
  }
  await db.query(apply ? 'commit' : 'rollback')
  console.log(JSON.stringify({ mode: apply ? 'committed' : 'dry run rolled back', migration: '20260915143000_application_linkedin', previouslyInstalled: installed, existingRecordsUnchanged: true, restrictedAccess: true, constraintsPassed: true, realApplicationsWritten: 0 }))
} catch (error) {
  await db.query('rollback')
  console.error('LinkedIn migration failed; rolled back.', { code: error.code || error.name })
  process.exitCode = 1
} finally { await db.end() }
