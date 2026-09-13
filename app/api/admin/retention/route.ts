import { requireWebsiteAdmin } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

const headers = { 'Cache-Control': 'private, no-store', Vary: 'Authorization' }

export async function GET(request: Request) {
  if (!await requireWebsiteAdmin(request)) return Response.json({ error: 'Unauthorized' }, { status: 401, headers })
  const { data, error } = await getSupabaseAdmin().from('submission_retention_health')
    .select('last_success_at').eq('id', true).maybeSingle()
  if (error || !data) return Response.json({ error: 'Deletion health is unavailable. Check the database scheduler.' }, { status: 503, headers })
  const checkedAt = new Date().toISOString()
  const healthy = Date.parse(checkedAt) - Date.parse(data.last_success_at) < 10 * 60_000
  return Response.json({ healthy, lastSuccessAt: data.last_success_at, checkedAt }, { headers })
}
