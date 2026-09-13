import { z } from 'zod'

import { requireWebsiteAdmin } from '@/lib/admin-auth'
import { getCareerOpenings } from '@/lib/career-openings'
import { JOB_TITLES } from '@/lib/submission-constants'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

const dateSchema = z.iso.date().refine((date) => date >= '2020-01-01' && date <= '2099-12-31').nullable()
const updateSchema = z.object({
  jobTitle: z.enum(JOB_TITLES),
  closingDate: dateSchema.optional(),
  startDate: dateSchema.optional(),
}).strict().refine((input) => input.closingDate !== undefined || input.startDate !== undefined)

export async function GET(request: Request) {
  if (!await requireWebsiteAdmin(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    return Response.json(await getCareerOpenings(), { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    console.error('Admin opening settings query failed')
    return Response.json({ error: 'Could not load role dates.' }, { status: 503 })
  }
}

export async function PATCH(request: Request) {
  if (!await requireWebsiteAdmin(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const input = updateSchema.parse(await request.json())
    const { data, error } = await getSupabaseAdmin().from('career_openings')
      .update({ ...(input.closingDate !== undefined ? { closing_date: input.closingDate } : {}), ...(input.startDate !== undefined ? { start_date: input.startDate } : {}), updated_at: new Date().toISOString() })
      .eq('job_title', input.jobTitle).select('job_title').maybeSingle()
    if (error) throw error
    if (!data) return Response.json({ error: 'Role not found.' }, { status: 404 })
    return Response.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return Response.json({ error: 'Choose a valid date, or clear it to leave it unset.' }, { status: 400 })
    }
    console.error('Admin role dates update failed')
    return Response.json({ error: 'Could not save the role dates. Please try again.' }, { status: 503 })
  }
}
