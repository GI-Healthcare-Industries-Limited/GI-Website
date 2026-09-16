import { after } from 'next/server'

import { sendSubmissionNotification } from '@/lib/notify'
import { getCareerOpenings } from '@/lib/career-openings'
import {
  applicationSchema,
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
  if (contentLength > 45_000) {
    return Response.json({ error: 'Your application is too large.' }, { status: 413 })
  }

  try {
    const input = applicationSchema.parse(await readSubmissionJson(request, 45_000))

    if (input.company) return Response.json({ ok: true }, { status: 201 })

    const openings = await getCareerOpenings()
    const opening = openings.items.find((item) => input.openingId ? item.id === input.openingId : item.job_title === input.jobTitle)
    if (!opening?.is_open) {
      return Response.json({ error: 'Applications for this role have closed.', code: 'APPLICATION_CLOSED' }, { status: 409 })
    }

    const fingerprint = getRequestFingerprint(request)
    if (await isRateLimited('career_applications', fingerprint, 24 * 60, 3)) {
      return Response.json(
        { error: 'Too many applications have been sent from this connection. Please try again tomorrow.' },
        { status: 429 },
      )
    }

    const receivedAt = new Date().toISOString()
    const { data, error: insertError } = await getSupabaseAdmin().from('career_applications').insert({
      opening_id: opening.id,
      job_title: opening.job_title,
      name: input.name,
      email: input.email.toLowerCase(),
      linkedin_url: input.linkedInUrl,
      education: input.education,
      portfolio_url: input.portfolioUrl || null,
      project_summary: input.projectSummary,
      work_links: input.workLinks,
      awards_status: input.awardsStatus,
      award_entries: input.awardEntries,
      biggest_failure: input.biggestFailure,
      growth_area: input.growthArea,
      application_questions_version: input.applicationQuestionsVersion,
      right_to_work: true,
      immigration_status: input.immigrationStatus,
      privacy_notice_version: input.privacyNoticeVersion,
      privacy_notice_provided_at: receivedAt,
      data_sharing_acknowledged_at: receivedAt,
      data_sharing_statement_version: input.dataSharingStatementVersion,
      work_permission_declared: input.workPermission === 'yes' ? true : null,
      student_conditions_acknowledged: input.studentConditions === 'yes' ? true : null,
      request_fingerprint: fingerprint,
    }).select('id').single()

    if (insertError?.message === 'APPLICATION_CLOSED' || insertError?.message === 'APPLICATION_OPENING_UNAVAILABLE') {
      return Response.json({ error: 'Applications for this role have closed.', code: 'APPLICATION_CLOSED' }, { status: 409 })
    }
    if (insertError) throw insertError

    after(async () => {
      try {
        await sendSubmissionNotification('application')
      } catch {
        console.error('Application notification failed; no applicant details logged')
      }
    })

    return Response.json({ ok: true, id: data.id }, { status: 201 })
  } catch (error) {
    // Database constraint errors can include the entire failing row, including
    // DOB and share code. Never log the raw error or submitted payload.
    console.error('Career application failed; no applicant details logged')
    return submissionErrorResponse(error)
  }
}
