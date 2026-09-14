// npm install; node --env-file=.env.local scripts/verify-privacy-database.mjs
// All DDL and synthetic records are inside one transaction which ALWAYS rolls
// back. No notifications run. Never use this as a migration-apply command.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import pg from 'pg'

const url = new URL(process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL)
if (!url.hostname.endsWith('.supabase.com') || !decodeURIComponent(url.username).includes('qucjtakhurjajoyxbmfh')) throw new Error('Unexpected database target')
url.searchParams.delete('sslmode')
const response = await fetch('https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt')
if (!response.ok) throw new Error('Cannot load database certificate authority')
const db = new pg.Client({ connectionString: url.href, ssl: { ca: await response.text(), rejectUnauthorized: true }, connectionTimeoutMillis: 10000 })
await db.connect()
try {
  const countSql = 'select (select count(*)::int from public.career_applications) applications, (select count(*)::int from public.contact_submissions) enquiries'
  const before = (await db.query(countSql)).rows[0]
  await db.query('begin; set local statement_timeout = 20000; set local lock_timeout = 3000;')
  try {
    const { rows } = await db.query("select exists (select 1 from information_schema.columns where table_schema='public' and table_name='contact_submissions' and column_name='retention_expires_at') installed")
    if (!rows[0].installed) {
      for (const file of ['20260914010000_role_start_dates.sql', '20260914020000_submission_privacy_and_retention.sql']) {
        await db.query(await readFile(new URL(`../supabase/migrations/${file}`, import.meta.url), 'utf8'))
      }
    }
    const confirmation = await db.query("select exists (select 1 from information_schema.columns where table_schema='public' and table_name='career_applications' and column_name='data_sharing_acknowledged_at') installed")
    if (!confirmation.rows[0].installed) {
      await db.query(await readFile(new URL('../supabase/migrations/20260914030000_application_data_sharing_confirmation.sql', import.meta.url), 'utf8'))
    }
    const postings = await db.query("select exists (select 1 from information_schema.columns where table_schema='public' and table_name='career_openings' and column_name='id') installed")
    if (!postings.rows[0].installed) {
      await db.query(await readFile(new URL('../supabase/migrations/20260914040000_manage_job_postings.sql', import.meta.url), 'utf8'))
    }
    // Historical regression fixtures must still run after the owner removes or
    // renames the original roles. These rows/changes are rolled back too.
    await db.query("insert into public.career_openings(job_title) values ('Embedded Systems Engineer'), ('Business Development and Operations Manager') on conflict do nothing")
    await db.query("update public.career_openings set accepting_applications = true where job_title in ('Embedded Systems Engineer', 'Business Development and Operations Manager')")
    for (const file of ['submission-privacy.sql', 'career-closing-dates.sql', 'right-to-work.sql', 'application-data-sharing.sql', 'job-postings.sql']) {
      await db.query(await readFile(new URL(`../tests/${file}`, import.meta.url), 'utf8'))
    }
    console.log('PASS: calendar boundaries, permissions, evidence minimisation, all-status purge, fingerprint expiry, immutable retention, role dates, data-sharing confirmation and job posting lifecycle')
  } finally { await db.query('rollback') }
  const after = (await db.query(countSql)).rows[0]
  assert.deepEqual(after, before)
  console.log('PASS: transaction rolled back; original submission counts unchanged')
} catch (error) {
  // PostgreSQL error details can include rows; never print them or credentials.
  console.error('Database verification failed; rolled back.', { code: error.code || error.name })
  process.exitCode = 1
} finally { await db.end() }
