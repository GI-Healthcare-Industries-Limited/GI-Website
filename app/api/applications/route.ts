import { randomUUID } from 'node:crypto'
import path from 'node:path'

import { after } from 'next/server'

import { sendSubmissionNotification } from '@/lib/notify'
import { MAXIMUM_CV_SIZE_BYTES } from '@/lib/submission-constants'
import {
  applicationSchema,
  getRequestFingerprint,
  hasAllowedOrigin,
  isRateLimited,
  publicError,
} from '@/lib/submissions'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

const ALLOWED_CV_TYPES = new Map([
  ['application/pdf', '.pdf'],
  ['application/msword', '.doc'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'],
])

export async function POST(request: Request) {
  if (!hasAllowedOrigin(request)) {
    return Response.json({ error: 'This submission was blocked. Please reload the page and try again.' }, { status: 403 })
  }

  const contentLength = Number(request.headers.get('content-length') || 0)
  if (contentLength > MAXIMUM_CV_SIZE_BYTES + 128 * 1024) {
    return Response.json({ error: 'Your CV must be 4 MB or smaller.' }, { status: 413 })
  }

  let uploadedPath: string | null = null

  try {
    const formData = await request.formData()
    const input = applicationSchema.parse({
      jobTitle: formData.get('jobTitle'),
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      coverLetter: formData.get('coverLetter'),
      consent: formData.get('consent'),
      company: formData.get('company'),
    })

    if (input.company) return Response.json({ ok: true }, { status: 201 })

    const cv = formData.get('cv')
    if (!(cv instanceof File) || cv.size === 0) {
      return Response.json({ error: 'Please attach your CV.' }, { status: 400 })
    }
    if (cv.size > MAXIMUM_CV_SIZE_BYTES) {
      return Response.json({ error: 'Your CV must be 4 MB or smaller.' }, { status: 413 })
    }

    const extension = ALLOWED_CV_TYPES.get(cv.type)
    if (!extension) {
      return Response.json({ error: 'Please attach a PDF, DOC or DOCX file.' }, { status: 400 })
    }

    const fingerprint = getRequestFingerprint(request)
    if (await isRateLimited('career_applications', fingerprint, 24 * 60, 3)) {
      return Response.json(
        { error: 'Too many applications have been sent from this connection. Please try again tomorrow.' },
        { status: 429 },
      )
    }

    const applicationId = randomUUID()
    const safeOriginalName = path.basename(cv.name).replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 120)
    uploadedPath = `${applicationId}/${randomUUID()}${extension}`
    const supabase = getSupabaseAdmin()

    const { error: uploadError } = await supabase.storage
      .from('career-cvs')
      .upload(uploadedPath, Buffer.from(await cv.arrayBuffer()), {
        contentType: cv.type,
        upsert: false,
      })

    if (uploadError) throw uploadError

    const { error: insertError } = await supabase.from('career_applications').insert({
      id: applicationId,
      job_title: input.jobTitle,
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone || null,
      cover_letter: input.coverLetter,
      cv_path: uploadedPath,
      cv_original_name: safeOriginalName || `cv${extension}`,
      cv_content_type: cv.type,
      request_fingerprint: fingerprint,
    })

    if (insertError) throw insertError

    after(async () => {
      try {
        await sendSubmissionNotification({
          subject: `New ${input.jobTitle} application from ${input.name}`,
          heading: 'New GI Healthcare career application',
          lines: [
            { label: 'Role', value: input.jobTitle },
            { label: 'Name', value: input.name },
            { label: 'Email', value: input.email },
            { label: 'Phone', value: input.phone || 'Not provided' },
            { label: 'Cover letter', value: input.coverLetter },
          ],
        })
      } catch (notificationError) {
        console.error('Application notification failed', notificationError)
      }
    })

    return Response.json({ ok: true, id: applicationId }, { status: 201 })
  } catch (error) {
    if (uploadedPath) {
      try {
        await getSupabaseAdmin().storage.from('career-cvs').remove([uploadedPath])
      } catch (cleanupError) {
        console.error('Could not clean up failed CV upload', cleanupError)
      }
    }
    console.error('Career application failed', error)
    return Response.json({ error: publicError(error) }, { status: 400 })
  }
}
