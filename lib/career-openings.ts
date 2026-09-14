import 'server-only'

import type { CareerOpening, OpeningsSnapshot } from '@/lib/career-opening-types'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function getCareerOpenings(): Promise<OpeningsSnapshot> {
  const { data, error } = await getSupabaseAdmin()
    .from('career_opening_availability')
    .select('id, job_title, location, department, employment_type, description, accepting_applications, created_at, updated_at, closing_date, closes_at, is_open, start_date')
    .order('created_at').order('job_title')
  if (error) throw error
  const items = data ?? []
  if (items.some((row) => !row.id || typeof row.is_open !== 'boolean')) {
    throw new Error('Career opening configuration is incomplete')
  }
  return { items: items as CareerOpening[], checkedAt: new Date().toISOString() }
}
