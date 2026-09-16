import { after } from 'next/server'
import { questionSetSchema, validateRoleAnswers, type QuestionSnapshot } from '@/lib/role-questions'

import { sendSubmissionNotification } from '@/lib/notify'
import { getCareerOpenings } from '@/lib/career-openings'
import { isEducationEligible } from '@/lib/career-opening-types'
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
    if (!isEducationEligible(opening.education_eligibility, input.education.status)) {
      return Response.json({ error: 'Your student or graduate status does not match this role’s current eligibility. Check the role details or contact us to request a human review.', code: 'EDUCATION_NOT_ELIGIBLE' }, { status: 409 })
    }

    let questionSnapshot: QuestionSnapshot | null = null
    if ('questionSet' in input) {
      if (!opening.section_three_questions) return Response.json({error:'This role has returned to its default questions. Please reload the form.',code:'QUESTIONS_CHANGED'},{status:409})
      const questions=questionSetSchema.parse(opening.section_three_questions)
      if (JSON.stringify(input.questionSet)!==JSON.stringify(questions)) return Response.json({error:'The role’s questions have changed. Please review the updated questions in Section 3 before submitting.',code:'QUESTIONS_CHANGED'},{status:409})
      try {
        const answers=Object.fromEntries(Object.entries(input.roleAnswers).map(([id,a])=>[id,{...a,entries:a.entries.filter(Boolean)}]))
        questionSnapshot={questions,answers:validateRoleAnswers(questions,answers)}
      } catch (error) { return Response.json({error:error instanceof Error?error.message:'Please check Section 3.'},{status:400}) }
    } else if (opening.section_three_questions != null) {
      return Response.json({error:'This role has updated questions. Please reload the application form.',code:'QUESTIONS_CHANGED'},{status:409})
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
      question_snapshot: questionSnapshot,
      portfolio_url: 'portfolioUrl' in input ? input.portfolioUrl || null : null,
      project_summary: 'projectSummary' in input ? input.projectSummary : null,
      work_links: 'workLinks' in input ? input.workLinks : [],
      awards_status: 'awardsStatus' in input ? input.awardsStatus : null,
      award_entries: 'awardEntries' in input ? input.awardEntries : null,
      biggest_failure: 'biggestFailure' in input ? input.biggestFailure : null,
      growth_area: 'growthArea' in input ? input.growthArea : null,
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
    if (insertError?.message === 'EDUCATION_NOT_ELIGIBLE') {
      return Response.json({ error: 'This role’s eligibility has changed. Check the role details or contact us to request a human review.', code: 'EDUCATION_NOT_ELIGIBLE' }, { status: 409 })
    }
    if (insertError?.message === 'QUESTIONS_CHANGED') return Response.json({error:'The role’s questions have changed. Please review Section 3 before submitting.',code:'QUESTIONS_CHANGED'},{status:409})
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
