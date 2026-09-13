'use client'

import type { Session } from '@supabase/supabase-js'
import { useRef, useState } from 'react'

import { immigrationStatusLabel } from '@/lib/right-to-work'
import styles from './right-to-work-evidence.module.css'

type Evidence = {
  immigration_status: string | null
  right_to_work_share_code: string | null
  right_to_work_date_of_birth: string | null
  work_permission_declared: boolean | null
  student_conditions_acknowledged: boolean | null
}

export function RightToWorkEvidence({ id, session }: { id: string; session: Session }) {
  const [evidence, setEvidence] = useState<Evidence | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [visible, setVisible] = useState(false)
  const busy = useRef(false)

  async function revealEvidence() {
    if (busy.current) return
    busy.current = true
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/admin/right-to-work?id=${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store',
      })
      const data = await response.json() as { evidence?: Evidence; error?: string }
      if (!response.ok || !data.evidence) throw new Error(data.error || 'Could not load evidence.')
      setEvidence(data.evidence)
      setVisible(true)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not load evidence.')
    } finally {
      setLoading(false)
      busy.current = false
    }
  }

  return <section className={styles.section} aria-label="Private right-to-work evidence">
    <div className={styles.header}><div><h3>Right-to-work evidence</h3><p>Private · Manual employer check required</p></div>
      <button type="button" disabled={loading} onClick={() => visible ? (setVisible(false), setEvidence(null)) : void revealEvidence()}>{loading ? 'Loading…' : visible ? 'Hide details' : 'View evidence'}</button>
    </div>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {visible && evidence && <div className={styles.body}>
      {!evidence.immigration_status ? <p>This legacy application did not collect these details. Arrange a right-to-work check separately.</p> : <>
        <dl><div><dt>Applicant’s declaration</dt><dd>{immigrationStatusLabel(evidence.immigration_status)}</dd></div>
          {evidence.immigration_status !== 'british_irish' && <>
            <div><dt>Right-to-work share code</dt><dd className={styles.code}>{evidence.right_to_work_share_code}</dd></div>
            <div><dt>Date of birth · For this check only</dt><dd>{evidence.right_to_work_date_of_birth ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${evidence.right_to_work_date_of_birth}T12:00:00Z`)) : 'Not recorded'}</dd></div>
            <div><dt>Full-time work without our sponsorship</dt><dd>{evidence.work_permission_declared ? 'Declared by applicant — not verified' : 'Not recorded'}</dd></div>
          </>}
        </dl>
        {evidence.immigration_status === 'student' && <p className={styles.warning}>Student permission requires a specific review of work limits, term dates and any applicable exception for a permanent full-time role. The applicant {evidence.student_conditions_acknowledged ? 'acknowledged' : 'has not acknowledged'} these restrictions. Do not treat the declaration as verification.</p>}
        <p>{evidence.immigration_status === 'british_irish' ? 'Arrange an acceptable British or Irish document check before employment. A share code is not required.' : 'Check the code with the applicant’s date of birth on GOV.UK, confirm their identity and permitted work, and retain the required check record. Codes expire 90 days after issue; request a new one if needed.'}</p>
        <a href={evidence.immigration_status === 'british_irish' ? 'https://www.gov.uk/check-job-applicant-right-to-work' : 'https://www.gov.uk/view-right-to-work'} rel="noreferrer" target="_blank">Open the official employer checking service ↗</a>
        <p className={styles.note}>No automated Home Office verification has taken place. Use these details only for the right-to-work check, not to rank candidates. Deleting this application also deletes this evidence.</p>
      </>}
    </div>}
  </section>
}
