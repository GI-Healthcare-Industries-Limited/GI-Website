'use client'

import { ArrowRightIcon, CheckCircleIcon, CircleIcon } from '@phosphor-icons/react'
import { type FormEvent, useState } from 'react'

import { IMMIGRATION_OPTIONS, immigrationStatusLabel, rightToWorkSchema, type RightToWorkDeclaration } from '@/lib/right-to-work'
import styles from './apply-form.module.css'

type Props = {
  disabled: boolean
  completed: RightToWorkDeclaration | null
  onComplete: (value: RightToWorkDeclaration | null) => void
}

export function EligibilityCheck({ disabled, completed, onComplete }: Props) {
  const [rightToWork, setRightToWork] = useState('')
  const [route, setRoute] = useState('')
  const [status, setStatus] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const citizen = route === 'british_irish'
  const needsEvidence = rightToWork === 'yes' && route === 'permission' && status !== '' && status !== 'none'

  function continueApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (disabled) return
    const form = event.currentTarget
    const data = new FormData(form)
    const result = rightToWorkSchema.safeParse({
      rightToWork, immigrationStatus: citizen ? 'british_irish' : status,
      workPermission: data.get('workPermission') || '', studentConditions: data.get('studentConditions') || '',
    })
    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((issue) => [issue.path[0], issue.message])))
      const field = form.elements.namedItem(String(result.error.issues[0]?.path[0]))
      if (field instanceof HTMLElement) field.focus()
      return
    }
    setErrors({})
    onComplete(result.data)
  }

  return <form onSubmit={continueApplication} noValidate>
    <fieldset className={styles.section} disabled={disabled}>
      <legend><span>01</span> Before we begin</legend>
      {completed ? <div className={styles.completed}>
        <CheckCircleIcon size={22} aria-hidden weight="fill" />
        <div><strong>Ready for the next step</strong><p>{immigrationStatusLabel(completed.immigrationStatus)} · Employer check still required</p></div>
        <button type="button" onClick={() => onComplete(null)}>Change</button>
      </div> : <>
        <fieldset className={styles.subquestion}>
          <legend>Do you currently have the right to work in the UK?</legend>
          <div className={styles.choices}>
            {['yes', 'no'].map((choice) => <label key={choice} className={rightToWork === choice ? styles.selected : ''}>
              <input type="radio" name="rightToWork" value={choice} checked={rightToWork === choice} onChange={() => { setRightToWork(choice); setErrors({}) }} />
              {rightToWork === choice ? <CheckCircleIcon aria-hidden size={21} weight="fill" /> : <CircleIcon aria-hidden size={21} />}
              {choice === 'yes' ? 'Yes, I do' : 'No, I don’t'}
            </label>)}
          </div>
        </fieldset>
        <p className={styles.help}>We cannot provide visa sponsorship for these roles.</p>
        {rightToWork === 'no' && <p role="status" className={styles.ineligible}>You cannot continue with this online application without an existing right to work. If you believe you have permission or need help with evidence, <a href="mailto:info@gihealthcare.co.uk">contact our team for a manual review</a>.</p>}
        {rightToWork === 'yes' && <>
          <fieldset className={styles.subquestion}>
            <legend>How do you hold that right?</legend>
            <div className={styles.choices}>
              {[['british_irish', 'British or Irish citizen'], ['permission', 'UK visa or immigration permission']].map(([value, label]) => <label key={value} className={route === value ? styles.selected : ''}>
                <input type="radio" name="citizenshipRoute" value={value} checked={route === value} onChange={() => { setRoute(value); setErrors({}) }} />
                {route === value ? <CheckCircleIcon aria-hidden size={21} weight="fill" /> : <CircleIcon aria-hidden size={21} />}{label}
              </label>)}
            </div>
          </fieldset>
          {citizen && <p className={styles.help}>No share code or date of birth is needed here. We’ll arrange a document check before employment.</p>}
          {route === 'permission' && <fieldset className={styles.subquestion}>
            <legend>Which UK permission do you currently hold?</legend>
            <div className={`${styles.choices} ${styles.statusChoices}`}>
              {[...IMMIGRATION_OPTIONS, { value: 'none', label: 'None of these', detail: 'No permission for this role, or sponsorship needed' }].map((option) => <label key={option.value} className={status === option.value ? styles.selected : ''}>
                <input type="radio" name="immigrationStatus" value={option.value} checked={status === option.value} onChange={() => { setStatus(option.value); setErrors({}) }} />
                {status === option.value ? <CheckCircleIcon aria-hidden size={19} weight="fill" /> : <CircleIcon aria-hidden size={19} />}
                <span>{option.label}<small>{option.detail}</small></span>
              </label>)}
            </div>
            <p className={styles.help}>Choose “Other existing permission” if your permission is not listed and allows this role without our sponsorship. The team reviews the conditions of every application.</p>
          </fieldset>}
          {route === 'permission' && status === 'none' && <p role="status" className={styles.ineligible}>This online application cannot continue without permission for the role. If your situation is different or you’re unsure, <a href="mailto:info@gihealthcare.co.uk">contact our team for a manual review</a>.</p>}
          {needsEvidence && <div className={styles.evidence} key={status}>
            {status === 'student' && <div className={styles.studentNote}>
              <strong>Student permission has work limits</strong>
              <p>A Student visa does not automatically allow a full-time role. Term-time hours and restrictions on permanent full-time vacancies apply; limited exceptions exist, including certain Graduate-route applications. Our team must review your conditions and term dates.</p>
              <a href="https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-student#work-conditions-for-a-student" target="_blank" rel="noreferrer">Read the Student work rules on GOV.UK ↗</a>
              <label className={styles.consent}><input type="checkbox" name="studentConditions" value="yes" aria-describedby={errors.studentConditions ? 'student-error' : undefined} /><span>I have read these restrictions and understand that my permission needs a manual review.</span></label>
              {errors.studentConditions && <p id="student-error" role="alert" className={styles.error}>{errors.studentConditions}</p>}
            </div>}
            <label className={styles.consent}><input type="checkbox" name="workPermission" value="yes" aria-describedby={errors.workPermission ? 'permission-error' : undefined} /><span>My current permission allows me to do this role without sponsorship from GI Healthcare.</span></label>
            {errors.workPermission && <p id="permission-error" role="alert" className={styles.error}>{errors.workPermission}</p>}
            <p className={styles.help}>If you cannot confirm this, contact us before continuing. Selecting a visa does not verify your eligibility.</p>
            <p className={styles.help}>We’ll arrange a right-to-work check if we make a conditional offer, before employment begins. Please do not send a date of birth, share code or identity documents in this application or by email.</p>
            <details className={styles.manualHelp}><summary>Need help with your permission?</summary><p>Some people can prove their right to work with eligible documents or the Home Office Employer Checking Service. <a href="mailto:info@gihealthcare.co.uk">Ask for a manual review</a>. Not having a share code does not, by itself, mean you have no right to work.</p></details>
          </div>}
          {errors.immigrationStatus && <p role="alert" className={styles.error}>{errors.immigrationStatus}</p>}
          {(citizen || needsEvidence) && <button type="submit" className={styles.continue}>Continue to your details <ArrowRightIcon size={18} aria-hidden /></button>}
        </>}
      </>}
    </fieldset>
  </form>
}
