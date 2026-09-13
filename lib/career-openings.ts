import 'server-only'

import type { CareerOpening, OpeningsSnapshot } from '@/lib/career-opening-types'
import { JOB_TITLES } from '@/lib/submission-constants'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function getCareerOpenings(): Promise<OpeningsSnapshot> {
  const { data, error } = await getSupabaseAdmin()
    .from('career_opening_availability')
    .select('job_title, closing_date, closes_at, is_open, start_date')
  if (error) throw error
  const items = JOB_TITLES.map((title) => data?.find((row) => row.job_title === title))
  if (items.some((row) => !row || typeof row.is_open !== 'boolean')) {
    throw new Error('Career opening configuration is incomplete')
  }
  return { items: items as CareerOpening[], checkedAt: new Date().toISOString() }
}
