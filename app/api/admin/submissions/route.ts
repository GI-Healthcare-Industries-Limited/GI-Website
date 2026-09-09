import { requireWebsiteAdmin } from '@/lib/admin-auth'
import { applicationStatuses, contactStatuses } from '@/lib/submission-constants'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

type SubmissionKind = 'contact' | 'application'

function parseKind(value: unknown): SubmissionKind | null {
  return value === 'contact' || value === 'application' ? value : null
}

export async function GET(request: Request) {
  const admin = await requireWebsiteAdmin(request)
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const kind = parseKind(url.searchParams.get('kind'))
  if (!kind) return Response.json({ error: 'Unknown submission type.' }, { status: 400 })

  const status = url.searchParams.get('status')
  const supabase = getSupabaseAdmin()
  let query = kind === 'contact'
    ? supabase
        .from('contact_submissions')
        .select('id, created_at, updated_at, name, email, phone, message, status')
    : supabase
        .from('career_applications')
        .select('id, created_at, updated_at, job_title, name, email, phone, portfolio_url, project_summary, right_to_work, cover_letter, cv_path, cv_original_name, status')

  if (status && status !== 'all') query = query.eq('status', status)

  const { data, error } = await query.order('created_at', { ascending: false }).limit(100)
  if (error) {
    console.error('Admin submissions query failed', error)
    return Response.json({ error: 'Could not load submissions.' }, { status: 500 })
  }

  return Response.json({ items: data ?? [], admin })
}

export async function PATCH(request: Request) {
  const admin = await requireWebsiteAdmin(request)
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json()) as { kind?: unknown; id?: unknown; status?: unknown }
  const kind = parseKind(body.kind)
  if (!kind || typeof body.id !== 'string' || typeof body.status !== 'string') {
    return Response.json({ error: 'Invalid status update.' }, { status: 400 })
  }

  const allowedStatuses = kind === 'contact' ? contactStatuses : applicationStatuses
  if (!(allowedStatuses as readonly string[]).includes(body.status)) {
    return Response.json({ error: 'Invalid status.' }, { status: 400 })
  }

  const table = kind === 'contact' ? 'contact_submissions' : 'career_applications'
  const { error } = await getSupabaseAdmin()
    .from(table)
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq('id', body.id)

  if (error) {
    console.error('Admin status update failed', error)
    return Response.json({ error: 'Could not update the status.' }, { status: 500 })
  }

  return Response.json({ ok: true })
}

export async function DELETE(request: Request) {
  const admin = await requireWebsiteAdmin(request)
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { kind?: unknown; id?: unknown }
  try {
    body = (await request.json()) as { kind?: unknown; id?: unknown }
  } catch {
    return Response.json({ error: 'Invalid deletion request.' }, { status: 400 })
  }

  const kind = parseKind(body.kind)
  if (!kind || typeof body.id !== 'string' || !body.id) {
    return Response.json({ error: 'Invalid deletion request.' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  let legacyCvPath: string | null = null

  if (kind === 'application') {
    const { data: application, error: lookupError } = await supabase
      .from('career_applications')
      .select('cv_path')
      .eq('id', body.id)
      .maybeSingle()

    if (lookupError) {
      console.error('Admin application lookup before deletion failed', lookupError)
      return Response.json({ error: 'Could not delete the application.' }, { status: 500 })
    }
    if (!application) return Response.json({ error: 'Application not found.' }, { status: 404 })
    legacyCvPath = application.cv_path as string | null
  }

  const table = kind === 'contact' ? 'contact_submissions' : 'career_applications'
  const { data: deleted, error: deleteError } = await supabase
    .from(table)
    .delete()
    .eq('id', body.id)
    .select('id')
    .maybeSingle()

  if (deleteError) {
    console.error('Admin submission deletion failed', deleteError)
    return Response.json({ error: `Could not delete the ${kind === 'contact' ? 'message' : 'application'}.` }, { status: 500 })
  }
  if (!deleted) {
    return Response.json({ error: `${kind === 'contact' ? 'Message' : 'Application'} not found.` }, { status: 404 })
  }

  if (legacyCvPath) {
    const { error: storageError } = await supabase.storage.from('career-cvs').remove([legacyCvPath])
    if (storageError) console.error('Legacy CV cleanup after application deletion failed', storageError)
  }

  return Response.json({ ok: true })
}
