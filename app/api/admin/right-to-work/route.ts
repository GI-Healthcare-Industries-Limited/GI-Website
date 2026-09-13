import { z } from 'zod'

import { requireWebsiteAdmin } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

const headers = { 'Cache-Control': 'private, no-store', 'Vary': 'Authorization' }

export async function GET(request: Request) {
  const admin = await requireWebsiteAdmin(request)
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401, headers })

  const id = z.uuid().safeParse(new URL(request.url).searchParams.get('id'))
  if (!id.success) return Response.json({ error: 'Invalid application ID.' }, { status: 400, headers })

  const { data, error } = await getSupabaseAdmin().from('career_applications')
    .select('immigration_status, right_to_work_share_code, right_to_work_date_of_birth, work_permission_declared, student_conditions_acknowledged')
    .eq('id', id.data).maybeSingle()

  if (error) return Response.json({ error: 'Could not load right-to-work evidence.' }, { status: 503, headers })
  if (!data) return Response.json({ error: 'Application not found.' }, { status: 404, headers })
  return Response.json({ evidence: data }, { headers })
}
