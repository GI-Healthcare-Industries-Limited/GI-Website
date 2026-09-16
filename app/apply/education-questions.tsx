'use client'

import { CheckCircleIcon, CircleIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import Link from 'next/link'
import { EDUCATION_ELIGIBILITY_LABELS, isEducationEligible, type EducationEligibility } from '@/lib/career-opening-types'
import styles from './apply-form.module.css'

export function EducationQuestions({ status, onChange, policy }: { status: string; onChange: (status: string) => void; policy: EducationEligibility }) {
  const allowed = isEducationEligible(policy, status)
  const [degree, setDegree] = useState('')
  const [studyYear, setStudyYear] = useState('')
  const [graduationYear, setGraduationYear] = useState('')
  return <fieldset className={`${styles.educationGroup} ${styles.full}`}>
    <legend>Are you a current student or a graduate?</legend>
    <div className={styles.choices}>
      {[['student', 'Current student'], ['graduate', 'Graduate']].map(([value, label]) => <label key={value} className={status === value ? styles.selected : ''}>
        <input name="educationStatus" type="radio" value={value} required checked={status === value} onChange={() => onChange(value)} />
        {status === value ? <CheckCircleIcon aria-hidden size={19} weight="fill" /> : <CircleIcon aria-hidden size={19} />}
        {label}
      </label>)}
    </div>
    {status && !allowed && <p role="status" className={styles.notice}>This role is open to {policy === 'student' ? 'current students only' : 'graduates only'}. You cannot submit with this selection. <Link href="/contact">Contact us for a human review</Link>, or choose another role.</p>}
    {!status && <p className={styles.help}>Eligible applicants: {EDUCATION_ELIGIBILITY_LABELS[policy]}.</p>}
    {allowed && status === 'student' && <div className={styles.educationFields}>
      <div className={styles.field}><label htmlFor="degree">Degree</label><input id="degree" name="degree" required maxLength={120} placeholder="e.g. BSc Computer Science" value={degree} onChange={event => setDegree(event.target.value)} /></div>
      <div className={styles.field}><label htmlFor="studyYear">Year of study</label><input id="studyYear" name="studyYear" required maxLength={40} placeholder="e.g. Year 2" value={studyYear} onChange={event => setStudyYear(event.target.value)} /></div>
    </div>}
    {allowed && status === 'graduate' && <div className={styles.educationFields}>
      <div className={styles.field}><label htmlFor="graduationYear">Year of graduation</label><input id="graduationYear" name="graduationYear" required type="number" inputMode="numeric" min={1900} max={new Date().getUTCFullYear()} step={1} placeholder="e.g. 2025" value={graduationYear} onChange={event => setGraduationYear(event.target.value)} /></div>
    </div>}
  </fieldset>
}
