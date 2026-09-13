import { z } from 'zod'

import { requireWebsiteAdmin } from '@/lib/admin-auth'
import { applicationStatuses, contactStatuses } from '@/lib/submission-constants'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

const headers = { 'Cache-Control': 'private, no-store', Vary: 'Authorization' }
const kindSchema = z.enum(['contact', 'application'])
const identitySchema = z.object({ kind: kindSchema, id: z.uuid() })
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers })

export async function GET(request: Request) {
  const admin = await requireWebsiteAdmin(request)
  if (!admin) return reply({ error: 'Unauthorized' }, 401)
  const url = new URL(request.url)
  const kind = kindSchema.safeParse(url.searchParams.get('kind'))
  if (!kind.success) return reply({ error: 'Unknown submission type.' }, 400)
  const status = url.searchParams.get('status')
  const allowed = kind.data === 'contact' ? contactStatuses : applicationStatuses
  if (status && status !== 'all' && !(allowed as readonly string[]).includes(status)) return reply({ error: 'Invalid status.' }, 400)
  const checkedAt = new Date().toISOString()
  let query = kind.data === 'contact'
    ? getSupabaseAdmin().from('contact_submissions').select('id, created_at, updated_at, retention_expires_at, privacy_notice_version, name, email, phone, message, status')
    : getSupabaseAdmin().from('career_applications').select('id, created_at, updated_at, retention_expires_at, privacy_notice_version, job_title, name, email, phone, portfolio_url, project_summary, right_to_work, cover_letter, status')
  query = query.gt('retention_expires_at', checkedAt)
  if (status && status !== 'all') query = query.eq('status', status)
  const { data, error } = await query.order('created_at', { ascending: false }).limit(100)
  if (error) {
    console.error('Admin submissions query failed; no personal details logged')
    return reply({ error: 'Could not load submissions.' }, 503)
  }
  return reply({ items: data ?? [], admin, checkedAt })
}

export async function PATCH(request: Request) {
  const admin = await requireWebsiteAdmin(request)
  if (!admin) return reply({ error: 'Unauthorized' }, 401)
  const input = identitySchema.extend({ status: z.string() }).strict().safeParse(await request.json().catch(() => null))
  if (!input.success) return reply({ error: 'Invalid status update.' }, 400)
  const { kind, id, status } = input.data
  const allowed = kind === 'contact' ? contactStatuses : applicationStatuses
  if (!(allowed as readonly string[]).includes(status)) return reply({ error: 'Invalid status.' }, 400)
  const { data, error } = await getSupabaseAdmin().from(kind === 'contact' ? 'contact_submissions' : 'career_applications')
    .update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    .gt('retention_expires_at', new Date().toISOString()).select('id').maybeSingle()
  if (error) return reply({ error: 'Could not update the status.' }, 503)
  if (!data) return reply({ error: 'Submission no longer available.' }, 404)
  return reply({ ok: true })
}

export async function DELETE(request: Request) {
  const admin = await requireWebsiteAdmin(request)
  if (!admin) return reply({ error: 'Unauthorized' }, 401)
  const input = identitySchema.strict().safeParse(await request.json().catch(() => null))
  if (!input.success) return reply({ error: 'Invalid deletion request.' }, 400)
  const { kind, id } = input.data
  // The privacy migration verifies the legacy file store is empty and prevents
  // new CV paths. There is no file or notification copy to leave orphaned here.
  const { data, error } = await getSupabaseAdmin().from(kind === 'contact' ? 'contact_submissions' : 'career_applications')
    .delete().eq('id', id).select('id').maybeSingle()
  if (error) return reply({ error: 'Could not delete the submission.' }, 503)
  if (!data) return reply({ error: 'Submission no longer available.' }, 404)
  return reply({ ok: true })
}
