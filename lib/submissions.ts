import 'server-only'

import { createHmac } from 'node:crypto'

import { z } from 'zod'

import { APPLICATION_DATA_SHARING_VERSION, APPLICATION_PRIVACY_NOTICE_VERSION, PRIVACY_NOTICE_VERSION } from '@/lib/privacy'
import { APPLICATION_QUESTIONS_VERSION } from '@/lib/application-questions'
import { rightToWorkSchema } from '@/lib/right-to-work'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const contactSchema = z.object({
  privacyNoticeVersion: z.literal(PRIVACY_NOTICE_VERSION, { error: 'Please reload the page to view the current privacy notice before submitting.' }),
  name: z.string().trim().min(2, 'Please enter your name.').max(120),
  email: z.string().trim().email('Please enter a valid email address.').max(254),
  phone: z.string().trim().max(50).optional().default(''),
  message: z.string().trim().min(10, 'Please enter a little more detail in your message.').max(5000),
  company: z.string().max(0).optional().default(''),
})

export const applicationSchema = z.object({
  dataSharingAcknowledged: z.literal(true, { error: 'Please tick the box to confirm you are happy to share your data with GI Healthcare.' }),
  dataSharingStatementVersion: z.literal(APPLICATION_DATA_SHARING_VERSION, { error: 'Please reload the page to view the current data-sharing statement.' }),
  applicationQuestionsVersion: z.literal(APPLICATION_QUESTIONS_VERSION, { error: 'Please reload the application to see the current questions.' }),
  jobTitle: z.string().trim().min(2).max(120),
  openingId: z.uuid().optional(),
  name: z.string().trim().min(2, 'Please enter your name.').max(120),
  email: z.string().trim().email('Please enter a valid email address.').max(254),
  phone: z.string().trim().max(50).optional().default(''),
  portfolioUrl: z.string().trim().max(2048).refine((value) => {
    if (!value) return true
    try { return ['http:', 'https:'].includes(new URL(value).protocol) } catch { return false }
  }, {
    message: 'Your portfolio link must start with http:// or https://.',
  }).optional().default(''),
  projectSummary: z.string().trim()
    .min(80, 'Please tell us a little more about things you’ve built.')
    .max(2400, 'Please keep your work examples to 2,400 characters or fewer.'),
  awardsStatus: z.enum(['listed', 'none_yet'], { error: 'List your awards, or choose “No competitions or awards yet”.' }),
  competitionAwards: z.string().trim().max(1600).optional().default(''),
  awardsDetail: z.string().trim().min(60, 'Please answer the short follow-up about your own experience.').max(800),
  biggestFailure: z.string().trim().min(80, 'Please describe a setback and what you learned.').max(1400),
  growthArea: z.string().trim().min(60, 'Please describe a habit you’re working on, with an example.').max(1000),
  authorshipAcknowledged: z.literal(true, { error: 'Please confirm the answers are your own writing and experience.' }),
  privacyNoticeVersion: z.literal(APPLICATION_PRIVACY_NOTICE_VERSION, { error: 'Please reload the page to view the current privacy notice before submitting.' }),
  company: z.string().max(0).optional().default(''),
}).superRefine((input, context) => {
  if (input.awardsStatus === 'listed' && input.competitionAwards.length < 10) {
    context.addIssue({ code: 'custom', path: ['competitionAwards'], message: 'List your awards with the event, year and result, or choose “No competitions or awards yet”.' })
  }
  if (input.awardsStatus === 'none_yet' && input.competitionAwards !== '') {
    context.addIssue({ code: 'custom', path: ['competitionAwards'], message: 'Choose either an awards list or “No competitions or awards yet”.' })
  }
}).and(rightToWorkSchema)

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
  if (error instanceof SubmissionInputError) return error.message
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message || 'Please check the form and try again.'
  }
  if (error instanceof SyntaxError) return 'Please reload the page and try again.'
  return 'We could not confirm your submission because the service is temporarily unavailable. Please try again shortly, or email info@gihealthcare.co.uk if this continues.'
}

export function submissionErrorResponse(error: unknown) {
  if (error instanceof SubmissionInputError) return Response.json({ error: error.message }, { status: error.status })
  const invalidInput = error instanceof z.ZodError || error instanceof SyntaxError
  return Response.json({ error: publicError(error) }, {
    status: invalidInput ? 400 : 503,
    headers: invalidInput ? {} : { 'Retry-After': '60' },
  })
}

class SubmissionInputError extends Error {
  constructor(message: string, readonly status: number) { super(message) }
}

export async function readSubmissionJson(request: Request, maximumBytes: number) {
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    throw new SubmissionInputError('Please submit the form as JSON.', 415)
  }
  const reader = request.body?.getReader()
  if (!reader) throw new SyntaxError('Missing request body')
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maximumBytes) {
        await reader.cancel()
        throw new SubmissionInputError('The submission is too large.', 413)
      }
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
}
