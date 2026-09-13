import { timingSafeEqual } from 'node:crypto'

import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const headers = { 'Cache-Control': 'no-store' }

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const supplied = Buffer.from(request.headers.get('authorization') || '')
  const expected = Buffer.from(`Bearer ${secret || ''}`)

  // Fail closed if the production secret has not been configured.
  if (!secret || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers })
  }

  // These real, bounded database reads check the submission/admin tables without
  // downloading personal data or inserting fake submissions. Vercel runs this
  // externally, so it does not depend on traffic or a visitor leaving a tab open.
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const db = getSupabaseAdmin()
      const checks = await Promise.all(
        ['contact_submissions', 'career_applications', 'website_admins'].map(async (table) => {
          const { error } = await db.from(table)
            .select('*', { head: true })
            .limit(1)
            .abortSignal(AbortSignal.timeout(10_000))
          return { table, ok: !error }
        }),
      )

      if (checks.every((check) => check.ok)) {
        // External fallback to the every-minute database retention job. A failed
        // purge makes this health check fail rather than a silent green.
        const { error: retentionError } = await db.rpc('purge_expired_submissions')
          .abortSignal(AbortSignal.timeout(10_000))
        if (retentionError) throw new Error('Retention unavailable')
        const checkedAt = new Date().toISOString()
        console.info('Database health check passed', { checkedAt, attempt })
        return Response.json({ ok: true, checkedAt }, { headers })
      }

      console.error('Database health check failed', { attempt, checks })
    } catch {
      // Keep credentials, query contents and personal data out of health logs.
      console.error('Database health check unavailable', { attempt })
    }
  }

  // A scheduled request cannot resume an already-paused Supabase project.
  return Response.json({ ok: false, error: 'Database unavailable' }, { status: 503, headers })
}
