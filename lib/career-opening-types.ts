export const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Fixed-term contract', 'Internship'] as const
export const EDUCATION_ELIGIBILITY = ['all', 'student', 'graduate'] as const
export type EducationEligibility = (typeof EDUCATION_ELIGIBILITY)[number]
export const EDUCATION_ELIGIBILITY_LABELS: Record<EducationEligibility, string> = {
  all: 'All — students and graduates', student: 'Current students only', graduate: 'Graduates only',
}
export function isEducationEligible(policy: unknown, status: unknown) {
  return (status === 'student' || status === 'graduate') && (policy === 'all' || policy === status)
}
export type CareerOpening = {
  section_three_questions?: import('./role-questions').RoleQuestion[] | null
  id: string
  job_title: string
  location: string
  department: string
  employment_type: (typeof EMPLOYMENT_TYPES)[number]
  description: string
  accepting_applications: boolean
  education_eligibility: EducationEligibility
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
