import type { ApplicationEducation } from '@/lib/application-education'

export function SubmissionEducation({ education }: { education?: ApplicationEducation | null }) {
  return <article className="admin-message-body">
    <p className="section-index">Education</p>
    {!education ? <p>Not collected on the earlier form.</p> : education.status === 'student' ? <>
      <p><strong>Current student</strong></p>
      <p>Degree: {education.degree}<br />Year of study: {education.studyYear}</p>
    </> : <>
      <p><strong>Graduate</strong></p>
      <p>Year of graduation: {education.graduationYear}</p>
    </>}
  </article>
}
