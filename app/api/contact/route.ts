import { after } from 'next/server'

import { sendSubmissionNotification } from '@/lib/notify'
import {
  contactSchema,
  getRequestFingerprint,
  hasAllowedOrigin,
  isRateLimited,
  publicError,
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
    const input = contactSchema.parse(await request.json())

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
        request_fingerprint: fingerprint,
      })
      .select('id')
      .single()

    if (error) throw error

    after(async () => {
      try {
        await sendSubmissionNotification({
          subject: `New website enquiry from ${input.name}`,
          heading: 'New GI Healthcare website enquiry',
          lines: [
            { label: 'Name', value: input.name },
            { label: 'Email', value: input.email },
            { label: 'Phone', value: input.phone || 'Not provided' },
            { label: 'Message', value: input.message },
          ],
        })
      } catch (notificationError) {
        console.error('Contact notification failed', notificationError)
      }
    })

    return Response.json({ ok: true, id: data.id }, { status: 201 })
  } catch (error) {
    console.error('Contact submission failed', error)
    return Response.json({ error: publicError(error) }, { status: 400 })
  }
}
