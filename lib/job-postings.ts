import { z } from 'zod'
import { questionSetSchema } from '@/lib/role-questions'
import { EDUCATION_ELIGIBILITY, EMPLOYMENT_TYPES } from '@/lib/career-opening-types'

const date = z.iso.date().refine((value) => value >= '2020-01-01' && value <= '2099-12-31', 'Choose a date between 2020 and 2099.').nullable()
const fields = z.object({
  sectionThreeQuestions: questionSetSchema.nullable().optional(),
  jobTitle: z.string().trim().min(2, 'Enter a job title.').max(120),
  location: z.string().trim().min(2, 'Enter a location.').max(120),
  department: z.string().trim().min(2, 'Enter a department.').max(120),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  description: z.string().trim().min(10, 'Add a short description of the role.').max(2000),
  acceptingApplications: z.boolean(),
  educationEligibility: z.enum(EDUCATION_ELIGIBILITY),
  closingDate: date,
  extendedClosingDate: date.optional(),
  startDate: date,
}).strict()
function validExtension(input: {closingDate?: string | null;extendedClosingDate?: string | null}) {
  return !input.extendedClosingDate || (input.closingDate === undefined || Boolean(input.closingDate && input.extendedClosingDate > input.closingDate))
}
export const createJobSchema = fields.extend({ educationEligibility: z.enum(EDUCATION_ELIGIBILITY).default('all') }).refine(validExtension,'The extended deadline must be later than the original closing date.')
export const jobIdentitySchema = z.object({ id: z.uuid(), expectedUpdatedAt: z.iso.datetime({ offset: true }) }).strict()
export const updateJobSchema = fields.partial().extend(jobIdentitySchema.shape).strict()
  .refine((input) => Object.keys(input).length > 2, 'Choose a field to update.')
  .refine(validExtension,'The extended deadline must be later than the original closing date.')

export function jobFields(input: Partial<z.infer<typeof fields>>) {
  return {
    ...(input.sectionThreeQuestions !== undefined ? { section_three_questions: input.sectionThreeQuestions } : {}),
    ...(input.jobTitle !== undefined ? { job_title: input.jobTitle } : {}),
    ...(input.location !== undefined ? { location: input.location } : {}),
    ...(input.department !== undefined ? { department: input.department } : {}),
    ...(input.employmentType !== undefined ? { employment_type: input.employmentType } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.acceptingApplications !== undefined ? { accepting_applications: input.acceptingApplications } : {}),
    ...(input.educationEligibility !== undefined ? { education_eligibility: input.educationEligibility } : {}),
    ...(input.closingDate !== undefined ? { closing_date: input.closingDate } : {}),
    ...(input.extendedClosingDate !== undefined ? { extended_closing_date: input.extendedClosingDate } : {}),
    ...(input.startDate !== undefined ? { start_date: input.startDate } : {}),
  }
}
