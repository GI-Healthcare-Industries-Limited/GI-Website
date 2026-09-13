import { z } from 'zod'

// Categories describe the applicant's declaration, not an immigration decision.
// The employer must check the actual permission and any restrictions on GOV.UK.
export const IMMIGRATION_OPTIONS = [
  { value: 'graduate', label: 'UK Graduate visa', detail: 'Post-study work permission' },
  { value: 'student', label: 'UK Student visa', detail: 'Work restrictions apply' },
  { value: 'settlement', label: 'Indefinite leave', detail: 'ILR or indefinite leave to enter' },
  { value: 'eu_settlement', label: 'EU Settlement Scheme', detail: 'Settled or pre-settled status' },
  { value: 'global_talent', label: 'Global Talent', detail: 'Existing UK permission' },
  { value: 'hpi', label: 'High Potential Individual', detail: 'UK HPI visa' },
  { value: 'youth_mobility', label: 'Youth Mobility Scheme', detail: 'Existing UK permission' },
  { value: 'ancestry', label: 'UK Ancestry', detail: 'Existing UK permission' },
  { value: 'family_dependant', label: 'Family or dependant', detail: 'With permission to do this work' },
  { value: 'other_permission', label: 'Other existing permission', detail: 'Allows this role without sponsorship' },
] as const

export const IMMIGRATION_STATUSES = ['british_irish', ...IMMIGRATION_OPTIONS.map((option) => option.value)] as const
export type ImmigrationStatus = typeof IMMIGRATION_STATUSES[number]

export function immigrationStatusLabel(value: string) {
  return value === 'british_irish' ? 'British or Irish citizen' : IMMIGRATION_OPTIONS.find((option) => option.value === value)?.label || 'Not recorded'
}

export function normalizeShareCode(value: string) {
  return value.replace(/\s/g, '').toUpperCase()
}

export const rightToWorkSchema = z.object({
  rightToWork: z.literal('yes', { error: 'Please confirm that you currently have the right to work in the UK.' }),
  immigrationStatus: z.enum(IMMIGRATION_STATUSES, { error: 'Please select your citizenship or existing UK immigration permission.' }),
  shareCode: z.string().max(40).optional().default('').transform(normalizeShareCode),
  dateOfBirth: z.string().max(10).optional().default(''),
  workPermission: z.string().max(3).optional().default(''),
  studentConditions: z.string().max(3).optional().default(''),
}).superRefine((input, context) => {
  if (input.immigrationStatus === 'british_irish') return
  if (input.workPermission !== 'yes') context.addIssue({ code: 'custom', path: ['workPermission'], message: 'Please confirm your permission allows this full-time role without sponsorship from GI Healthcare.' })
  if (input.immigrationStatus === 'student' && input.studentConditions !== 'yes') context.addIssue({ code: 'custom', path: ['studentConditions'], message: 'Please read and acknowledge the Student visa work restrictions.' })
  // Format checking is NOT a Home Office check. Codes must be verified by an employer.
  if (!/^W[A-Z0-9]{8}$/.test(input.shareCode)) context.addIssue({ code: 'custom', path: ['shareCode'], message: 'Enter the 9-character right-to-work share code beginning with W. Residence or rent codes cannot be used.' })
  const validDate = z.iso.date().safeParse(input.dateOfBirth).success
  if (!validDate || input.dateOfBirth >= new Date().toISOString().slice(0, 10)) context.addIssue({ code: 'custom', path: ['dateOfBirth'], message: 'Enter your date of birth as a real date in the past.' })
}).transform((input) => input.immigrationStatus === 'british_irish'
  ? { ...input, shareCode: '', dateOfBirth: '', workPermission: '', studentConditions: '' }
  : { ...input, studentConditions: input.immigrationStatus === 'student' ? 'yes' : '' })

export type RightToWorkDeclaration = z.output<typeof rightToWorkSchema>
