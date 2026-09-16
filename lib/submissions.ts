import 'server-only'

import { createHmac } from 'node:crypto'

import { z } from 'zod'

import { APPLICATION_DATA_SHARING_VERSION, APPLICATION_PRIVACY_NOTICE_VERSION, PRIVACY_NOTICE_VERSION } from '@/lib/privacy'
import { ANSWER_WORD_LIMITS, APPLICATION_QUESTIONS_VERSION, FAILURE_QUESTION, GROWTH_QUESTION, MAX_AWARDS, MAX_WORK_LINKS, WORK_QUESTION, countWords, isSafeWorkLink } from '@/lib/application-questions'
import { rightToWorkSchema } from '@/lib/right-to-work'
import { educationSchema } from '@/lib/application-education'
import { LINKEDIN_PROFILE_ERROR, normalizeLinkedInProfileUrl } from '@/lib/linkedin'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const contactSchema = z.object({
  privacyNoticeVersion: z.literal(PRIVACY_NOTICE_VERSION, { error: 'Please reload the page to view the current privacy notice before submitting.' }),
  name: z.string().trim().min(2, 'Please enter your name.').max(120),
  email: z.string().trim().email('Please enter a valid email address.').max(254),
  phone: z.string().trim().max(50).optional().default(''),
  message: z.string().trim().min(10, 'Please enter a little more detail in your message.').max(5000),
  company: z.string().max(0).optional().default(''),
})

function shortAnswer(maxWords: number, label: string) {
  return z.string().trim().min(1, `Please answer: ${label}`).max(1600)
    .refine(value => countWords(value) <= maxWords, `Please use ${maxWords} words or fewer.`)
}

export const applicationSchema = z.object({
  dataSharingAcknowledged: z.literal(true, { error: 'Please tick the box to agree to the use of your information for this application.' }),
  dataSharingStatementVersion: z.literal(APPLICATION_DATA_SHARING_VERSION, { error: 'Please reload the page to view the current data-sharing statement.' }),
  applicationQuestionsVersion: z.literal(APPLICATION_QUESTIONS_VERSION, { error: 'Please reload the application to see the current questions.' }),
  privacyNoticeVersion: z.literal(APPLICATION_PRIVACY_NOTICE_VERSION, { error: 'The application form has changed. Please keep a copy of your answers, then reload to see the current form and privacy notice.' }),
  jobTitle: z.string().trim().min(2).max(120),
  openingId: z.uuid().optional(),
  name: z.string().trim().min(2, 'Please enter your name.').max(120),
  email: z.string().trim().email('Please enter a valid email address.').max(254),
  linkedInUrl: z.string({ error: LINKEDIN_PROFILE_ERROR }).trim().min(1, LINKEDIN_PROFILE_ERROR).max(2048)
    .refine(value => normalizeLinkedInProfileUrl(value) !== null, LINKEDIN_PROFILE_ERROR)
    .transform(value => normalizeLinkedInProfileUrl(value)!),
  education: educationSchema,
  portfolioUrl: z.string().trim().max(2048).refine((value) => {
    if (!value) return true
    try { return ['http:', 'https:'].includes(new URL(value).protocol) } catch { return false }
  }, {
    message: 'Your portfolio link must start with http:// or https://.',
  }).optional().default(''),
  projectSummary: shortAnswer(ANSWER_WORD_LIMITS.work, WORK_QUESTION),
  workLinks: z.array(z.string().trim().min(1).max(2048).refine(isSafeWorkLink, 'Work links must start with http:// or https:// and must not contain login details.')).max(MAX_WORK_LINKS).optional().default([]),
  awardsStatus: z.enum(['listed', 'none_yet'], { error: 'List your awards, or choose “No competitions or awards yet”.' }),
  awardEntries: z.array(shortAnswer(ANSWER_WORD_LIMITS.award, 'Award')).max(MAX_AWARDS),
  biggestFailure: shortAnswer(ANSWER_WORD_LIMITS.failure, FAILURE_QUESTION),
  growthArea: shortAnswer(ANSWER_WORD_LIMITS.growth, GROWTH_QUESTION),
  company: z.string().max(0).optional().default(''),
}).superRefine((input, context) => {
  if (input.awardsStatus === 'listed' && input.awardEntries.length === 0) {
    context.addIssue({ code: 'custom', path: ['awardEntries'], message: 'Add an award, or choose “No competitions or awards yet”.' })
  }
  if (input.awardsStatus === 'none_yet' && input.awardEntries.length !== 0) {
    context.addIssue({ code: 'custom', path: ['awardEntries'], message: 'Choose either award cards or “No competitions or awards yet”.' })
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
  return 'We could not confirm your submission because the service is temporarily unavailable. Please try again shortly.'
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
