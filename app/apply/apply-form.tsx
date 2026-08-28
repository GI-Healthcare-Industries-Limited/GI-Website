'use client'

import { type FormEvent, useRef, useState } from 'react'

import { JOB_TITLES, MAXIMUM_CV_SIZE_BYTES } from '@/lib/submission-constants'

type ApplyFormProps = {
  initialRole: (typeof JOB_TITLES)[number]
}

export function ApplyForm({ initialRole }: ApplyFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)

  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setResult(null)

    try {
      const formData = new FormData(event.currentTarget)
      const cv = formData.get('cv')
      if (cv instanceof File && cv.size > MAXIMUM_CV_SIZE_BYTES) {
        throw new Error('Your CV must be 4 MB or smaller.')
      }

      const response = await fetch('/api/applications', {
        method: 'POST',
        body: formData,
      })
      const payload = (await response.json().catch(() => ({}))) as { error?: string }

      if (!response.ok) throw new Error(payload.error || 'We could not send your application.')

      formRef.current?.reset()
      setResult({
        kind: 'success',
        message: 'Thank you. Your application has been received by GI Healthcare.',
      })
    } catch (error) {
      setResult({
        kind: 'error',
        message: error instanceof Error ? error.message : 'We could not send your application.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="panel form-panel">
      <form ref={formRef} onSubmit={submitApplication}>
        <div className="field">
          <label htmlFor="jobTitle">Role</label>
          <select defaultValue={initialRole} id="jobTitle" name="jobTitle" required>
            {JOB_TITLES.map((jobTitle) => <option key={jobTitle}>{jobTitle}</option>)}
          </select>
        </div>

        <div className="field-grid">
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input autoComplete="name" id="name" maxLength={120} name="name" required />
          </div>
          <div className="field">
            <label htmlFor="email">Email address</label>
            <input autoComplete="email" id="email" maxLength={254} name="email" required type="email" />
          </div>
          <div className="field full-width">
            <label htmlFor="phone">Phone number <span className="field-help">(optional)</span></label>
            <input autoComplete="tel" id="phone" maxLength={50} name="phone" type="tel" />
          </div>
        </div>

        <div className="field">
          <label htmlFor="coverLetter">Cover letter</label>
          <textarea id="coverLetter" maxLength={7000} minLength={30} name="coverLetter" required />
        </div>

        <div className="field">
          <label htmlFor="cv">CV</label>
          <input
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            id="cv"
            name="cv"
            required
            type="file"
          />
          <p className="field-help">PDF, DOC or DOCX. Maximum file size: 4 MB.</p>
        </div>

        <div className="hp-field" aria-hidden="true">
          <label htmlFor="company">Company</label>
          <input autoComplete="off" id="company" name="company" tabIndex={-1} />
        </div>

        <label className="checkbox-row">
          <input name="consent" required type="checkbox" value="yes" />
          <span>I consent to GI Healthcare using these details to assess and contact me about this application.</span>
        </label>

        <button className="button primary-button" disabled={submitting} type="submit">
          {submitting ? 'Sending application…' : 'Send application'}
        </button>

        {result && (
          <p aria-live="polite" className={`status-message ${result.kind}`} role="status">
            {result.message}
          </p>
        )}
      </form>
    </section>
  )
}
