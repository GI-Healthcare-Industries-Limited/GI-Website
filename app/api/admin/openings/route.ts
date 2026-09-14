import { requireWebsiteAdmin } from '@/lib/admin-auth'
import { getCareerOpenings } from '@/lib/career-openings'
import { createJobSchema, jobFields, jobIdentitySchema, updateJobSchema } from '@/lib/job-postings'
import { readSubmissionJson, submissionErrorResponse } from '@/lib/submissions'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

const headers = { 'Cache-Control': 'private, no-store', Vary: 'Authorization' }
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers })
function failure(error: unknown) {
  if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
    return reply({ error: 'A posting with that title already exists. Please use a different title.' }, 409)
  }
  const response = submissionErrorResponse(error)
  for (const [key, value] of Object.entries(headers)) response.headers.set(key, value)
  return response
}

export async function GET(request: Request) {
  if (!await requireWebsiteAdmin(request)) return reply({ error: 'Unauthorized' }, 401)
  try { return reply(await getCareerOpenings()) }
  catch { return reply({ error: 'Could not load job postings. Please try again.' }, 503) }
}

export async function POST(request: Request) {
  if (!await requireWebsiteAdmin(request)) return reply({ error: 'Unauthorized' }, 401)
  try {
    const input = createJobSchema.parse(await readSubmissionJson(request, 16_000))
    const { data, error } = await getSupabaseAdmin().from('career_openings')
      .insert(jobFields(input)).select('id').single()
    if (error) throw error
    return reply({ ok: true, id: data.id }, 201)
  } catch (error) { return failure(error) }
}

export async function PATCH(request: Request) {
  if (!await requireWebsiteAdmin(request)) return reply({ error: 'Unauthorized' }, 401)
  try {
    const input = updateJobSchema.parse(await readSubmissionJson(request, 16_000))
    const { data, error } = await getSupabaseAdmin().from('career_openings')
      .update({ ...jobFields(input), updated_at: new Date().toISOString() })
      .eq('id', input.id).eq('updated_at', input.expectedUpdatedAt).select('id').maybeSingle()
    if (error) throw error
    if (!data) return reply({ error: 'This posting has changed or been removed. Cancel editing and refresh the list before trying again.' }, 409)
    return reply({ ok: true })
  } catch (error) { return failure(error) }
}

export async function DELETE(request: Request) {
  if (!await requireWebsiteAdmin(request)) return reply({ error: 'Unauthorized' }, 401)
  try {
    const input = jobIdentitySchema.parse(await readSubmissionJson(request, 2000))
    // The database unlinks, but never deletes, applications for a removed posting.
    const { data, error } = await getSupabaseAdmin().from('career_openings').delete()
      .eq('id', input.id).eq('updated_at', input.expectedUpdatedAt).select('id').maybeSingle()
    if (error) throw error
    if (!data) return reply({ error: 'This posting has changed or been removed. Refresh the list before trying again.' }, 409)
    return reply({ ok: true })
  } catch (error) { return failure(error) }
}
