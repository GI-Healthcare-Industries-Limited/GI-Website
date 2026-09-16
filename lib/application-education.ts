import { z } from 'zod'

export const educationSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('student'),
    degree: z.string().trim().min(1, 'Please enter your degree.').max(120),
    studyYear: z.string().trim().min(1, 'Please enter your current year of study.').max(40),
  }),
  z.object({
    status: z.literal('graduate'),
    graduationYear: z.string().trim().regex(/^\d{4}$/, 'Please enter a four-digit graduation year.')
      .refine(value => Number(value) >= 1900 && Number(value) <= new Date().getUTCFullYear(), 'Please enter a graduation year from 1900 to the current year.'),
  }),
], { error: 'Please select current student or graduate.' })

export type ApplicationEducation = z.infer<typeof educationSchema>
