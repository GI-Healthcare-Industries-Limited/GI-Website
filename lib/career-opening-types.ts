export const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Fixed-term contract', 'Internship'] as const
export type CareerOpening = {
  id: string
  job_title: string
  location: string
  department: string
  employment_type: (typeof EMPLOYMENT_TYPES)[number]
  description: string
  accepting_applications: boolean
  created_at: string
  updated_at: string
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
