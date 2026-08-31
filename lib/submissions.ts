import 'server-only'

import { createHmac } from 'node:crypto'

import { z } from 'zod'

import { JOB_TITLES } from '@/lib/submission-constants'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name.').max(120),
  email: z.string().trim().email('Please enter a valid email address.').max(254),
  phone: z.string().trim().max(50).optional().default(''),
  message: z.string().trim().min(10, 'Please enter a little more detail in your message.').max(5000),
  company: z.string().max(0).optional().default(''),
})

export const applicationSchema = z.object({
  jobTitle: z.enum(JOB_TITLES),
  name: z.string().trim().min(2, 'Please enter your name.').max(120),
  email: z.string().trim().email('Please enter a valid email address.').max(254),
  phone: z.string().trim().max(50).optional().default(''),
  portfolioUrl: z.string().trim().url('Please enter a valid portfolio or project URL.').max(2048)
    .refine((value) => ['http:', 'https:'].includes(new URL(value).protocol), {
      message: 'Your portfolio link must start with http:// or https://.',
    }),
  projectSummary: z.string().trim()
    .min(80, 'Please tell us a little more about the project.')
    .max(800, 'Please keep your project summary to 800 characters or fewer.'),
  rightToWork: z.string().refine((value) => value === 'yes', {
    message: 'You must already have the right to work in the UK to apply.',
  }),
  consent: z.literal('yes'),
  company: z.string().max(0).optional().default(''),
})

export function getRequestFingerprint(request: Request) {
  const secret = process.env.SUBMISSION_HASH_SECRET
  if (!secret) throw new Error('Submission security configuration is incomplete')

  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const ip = forwardedFor || request.headers.get('x-real-ip') || 'unknown'

  return createHmac('sha256', secret).update(ip).digest('hex')
}

export function hasAllowedOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return true

  const requestOrigin = new URL(request.url).origin
  if (origin === requestOrigin) return true

  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const forwardedProtocol = request.headers.get('x-forwarded-proto') || 'https'
  return Boolean(forwardedHost && origin === `${forwardedProtocol}://${forwardedHost}`)
}

export async function isRateLimited(
  table: 'contact_submissions' | 'career_applications',
  fingerprint: string,
  windowMinutes: number,
  maximumRequests: number,
) {
  const since = new Date(Date.now() - windowMinutes * 60_000).toISOString()
  const { count, error } = await getSupabaseAdmin()
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('request_fingerprint', fingerprint)
    .gte('created_at', since)

  if (error) throw error
  return (count ?? 0) >= maximumRequests
}

export function publicError(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message || 'Please check the form and try again.'
  }
  return 'We could not submit your details. Please try again.'
}
