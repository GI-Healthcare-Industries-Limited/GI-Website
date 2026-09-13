import { after } from 'next/server'

import { sendSubmissionNotification } from '@/lib/notify'
import {
  contactSchema,
  getRequestFingerprint,
  hasAllowedOrigin,
  isRateLimited,
  readSubmissionJson,
  submissionErrorResponse,
} from '@/lib/submissions'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  if (!hasAllowedOrigin(request)) {
    return Response.json({ error: 'This submission was blocked. Please reload the page and try again.' }, { status: 403 })
  }

  const contentLength = Number(request.headers.get('content-length') || 0)
  if (contentLength > 20_000) {
    return Response.json({ error: 'The message is too large.' }, { status: 413 })
  }

  try {
    const input = contactSchema.parse(await readSubmissionJson(request, 20_000))

    // Honeypot submissions receive a normal response so automated senders do
    // not learn how the protection works.
    if (input.company) return Response.json({ ok: true }, { status: 201 })

    const fingerprint = getRequestFingerprint(request)
    if (await isRateLimited('contact_submissions', fingerprint, 60, 5)) {
      return Response.json(
        { error: 'Too many messages have been sent from this connection. Please try again later.' },
        { status: 429 },
      )
    }

    const { data, error } = await getSupabaseAdmin()
      .from('contact_submissions')
      .insert({
        name: input.name,
        email: input.email.toLowerCase(),
        phone: input.phone || null,
        message: input.message,
        privacy_notice_version: input.privacyNoticeVersion,
        privacy_notice_provided_at: new Date().toISOString(),
        request_fingerprint: fingerprint,
      })
      .select('id')
      .single()

    if (error) throw error

    after(async () => {
      try {
        await sendSubmissionNotification('contact')
      } catch {
        console.error('Contact notification failed; no personal details logged')
      }
    })

    return Response.json({ ok: true, id: data.id }, { status: 201 })
  } catch (error) {
    console.error('Contact submission failed; no personal details logged')
    return submissionErrorResponse(error)
  }
}
