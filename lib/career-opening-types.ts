import type { JOB_TITLES } from '@/lib/submission-constants'

export type JobTitle = (typeof JOB_TITLES)[number]
export type CareerOpening = {
  job_title: JobTitle
  closing_date: string | null
  start_date: string | null
  closes_at: string | null
  is_open: boolean
}
export type OpeningsSnapshot = { items: CareerOpening[]; checkedAt: string }

export function formatClosingDate(date: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/London',
  }).format(new Date(`${date}T12:00:00Z`))
}
