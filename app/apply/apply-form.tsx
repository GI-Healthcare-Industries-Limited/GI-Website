'use client'

import { ArrowRightIcon, ArrowUpRightIcon, BriefcaseIcon, CalendarBlankIcon, CheckCircleIcon, CircleIcon, MapPinIcon, ShieldCheckIcon } from '@phosphor-icons/react'
import Image from 'next/image'
import Link from 'next/link'
import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react'

import cookingStudio from '@/assets/admin/cooking-studio.webp'
import logo from '@/assets/brand/gi-healthcare-logo.png'
import { formatClosingDate, type OpeningsSnapshot } from '@/lib/career-opening-types'
import { APPLICATION_DATA_SHARING_STATEMENT, APPLICATION_DATA_SHARING_VERSION, APPLICATION_PRIVACY_NOTICE_VERSION } from '@/lib/privacy'
import { APPLICATION_QUESTIONS_VERSION } from '@/lib/application-questions'
import type { RightToWorkDeclaration } from '@/lib/right-to-work'
import { EligibilityCheck } from './eligibility-check'
import { ApplicationQuestions } from './application-questions'
import styles from './apply-form.module.css'

type Props = { requestedJob: string; requestedTitle: string; initialOpenings: OpeningsSnapshot | null }

export function ApplyForm({ requestedJob, requestedTitle, initialOpenings }: Props) {
  const [selectedId, setSelectedId] = useState(requestedJob || (requestedTitle ? initialOpenings?.items.find((item) => item.job_title === requestedTitle)?.id : initialOpenings?.items[0]?.id) || '')
  const [submittedTitle, setSubmittedTitle] = useState('')
  const [eligibility, setEligibility] = useState<RightToWorkDeclaration | null>(null)
  const [dataSharingAcknowledged, setDataSharingAcknowledged] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openings, setOpenings] = useState(initialOpenings)
  const [availabilityError, setAvailabilityError] = useState(!initialOpenings)
  const [checking, setChecking] = useState(false)
  const [now, setNow] = useState(initialOpenings ? Date.parse(initialOpenings.checkedAt) : 0)
  const submittingRef = useRef(false)
  const clockOffset = useRef(0)
  const refreshRequest = useRef(0)
  const resultRef = useRef<HTMLDivElement>(null)
  const detailsRef = useRef<HTMLInputElement>(null)
  const dataSharingRef = useRef<HTMLInputElement>(null)

  const refreshOpenings = useCallback(async () => {
    const requestId = ++refreshRequest.current
    setChecking(true)
    try {
      const response = await fetch('/api/careers/openings', { cache: 'no-store' })
      if (!response.ok) throw new Error('Availability unavailable')
      const data = await response.json() as OpeningsSnapshot
      if (requestId !== refreshRequest.current) return
      clockOffset.current = Date.parse(data.checkedAt) - Date.now()
      setNow(Date.parse(data.checkedAt))
      setOpenings(data)
      setSelectedId((previous) => previous || (requestedJob || (requestedTitle ? data.items.find((item) => item.job_title === requestedTitle)?.id : data.items[0]?.id) || ''))
      setAvailabilityError(false)
    } catch {
      if (requestId === refreshRequest.current) setAvailabilityError(true)
    } finally {
      if (requestId === refreshRequest.current) setChecking(false)
    }
  }, [requestedJob, requestedTitle])

  useEffect(() => {
    void refreshOpenings()
    const refresh = () => { if (document.visibilityState === 'visible') void refreshOpenings() }
    const interval = window.setInterval(refresh, 60_000)
    const clock = window.setInterval(() => setNow(Date.now() + clockOffset.current), 1000)
    window.addEventListener('focus', refresh)
    return () => {
      window.clearInterval(interval)
      window.clearInterval(clock)
      window.removeEventListener('focus', refresh)
      refreshRequest.current++
    }
  }, [refreshOpenings])

  useEffect(() => { if (submitted) resultRef.current?.focus() }, [submitted])
  useEffect(() => { if (eligibility) detailsRef.current?.focus() }, [eligibility])

  const opening = openings?.items.find((item) => item.id === selectedId)
  const closed = Boolean(opening && (!opening.is_open || (opening.closes_at && now >= Date.parse(opening.closes_at))))
  const unavailable = availabilityError || !opening
  const canApply = !closed && !unavailable

  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return
    setError(null)
    if (!canApply || !eligibility) {
      setError(closed ? 'Applications for this role have closed.' : unavailable
        ? 'Please check availability before submitting.' : 'Please confirm your right to work in the UK.')
      return
    }
    const formData = new FormData(event.currentTarget)
    if (String(formData.get('awardsDetail') || '').trim().length < 60) {
      setError('Please complete the short follow-up about your awards or activity before submitting.')
      const followUp = document.getElementById('awardsDetail') || document.getElementById('awards-detail-reveal')
      followUp?.focus()
      return
    }
    if (formData.get('authorshipAcknowledged') !== 'yes') {
      setError('Please confirm the answers are your own writing and experience.')
      event.currentTarget.querySelector<HTMLInputElement>('[name="authorshipAcknowledged"]')?.focus()
      return
    }
    if (formData.get('dataSharingAcknowledged') !== 'yes') {
      setError('Please tick the box to confirm you are happy to share your data with GI Healthcare.')
      dataSharingRef.current?.focus()
      return
    }
    submittingRef.current = true
    setSubmitting(true)
    try {
      const response = await fetch('/api/applications', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openingId: opening!.id, jobTitle: opening!.job_title, name: formData.get('name'), email: formData.get('email'),
          phone: formData.get('phone'), portfolioUrl: formData.get('portfolioUrl'),
          projectSummary: formData.get('projectSummary'), ...eligibility,
          awardsStatus: formData.get('awardsStatus'), competitionAwards: formData.get('competitionAwards'),
          awardsDetail: formData.get('awardsDetail'), biggestFailure: formData.get('biggestFailure'), growthArea: formData.get('growthArea'),
          authorshipAcknowledged: formData.get('authorshipAcknowledged') === 'yes', applicationQuestionsVersion: APPLICATION_QUESTIONS_VERSION,
          privacyNoticeVersion: APPLICATION_PRIVACY_NOTICE_VERSION, company: formData.get('company'),
          dataSharingAcknowledged: formData.get('dataSharingAcknowledged') === 'yes',
          dataSharingStatementVersion: APPLICATION_DATA_SHARING_VERSION,
        }),
      })
      const payload = await response.json().catch(() => ({})) as { error?: string; code?: string; ok?: boolean }
      if (payload.code === 'APPLICATION_CLOSED') void refreshOpenings()
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'We could not confirm your application. Please try again.')
      setSubmittedTitle(opening!.job_title)
      setSubmitted(true)
      setEligibility(null)
      setDataSharingAcknowledged(false)
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'We could not send your application. Please try again.')
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  return (
    <main className={styles.layout}>
      <section className={styles.panel} aria-label="Job application">
        <header className={styles.header}>
          <Link href="/" aria-label="GI Healthcare home" className={styles.brand}><Image src={logo} alt="GI Healthcare" width={200} height={58} preload /></Link>
          <Link href="/" className={styles.back}>Back to website <ArrowUpRightIcon aria-hidden size={17} /></Link>
        </header>
        <div className={styles.content}>
          {submitted ? (
            <div className={styles.success} ref={resultRef} tabIndex={-1}>
              <CheckCircleIcon aria-hidden size={44} weight="light" />
              <p className={styles.eyebrow}>Application received</p>
              <h1>Thank you for<br />sharing your work.</h1>
              <p>Your application for {submittedTitle} is with our team. We’ll review it and contact you if we’d like to take things further.</p>
              <Link href="/" className={styles.submit}>Back to website <ArrowRightIcon aria-hidden size={20} /></Link>
            </div>
          ) : (
            <>
              <div className={styles.intro}>
                <p className={styles.eyebrow}>Careers at GI Healthcare</p>
                <h1>A little about you.<br /><span>A lot of possibility.</span></h1>
                <p>Help us build autonomous cooking for extreme environments. Start by sharing a little of what you do.</p>
              </div>
              <div className={styles.role}>
                <fieldset className={styles.roleOptions} disabled={submitting}>
                  <legend>I’m applying for</legend>
                  <div className={styles.roleCards}>
                    {openings?.items.map((item) => <label key={item.id} className={selectedId === item.id ? styles.activeRole : ''}>
                      <input type="radio" name="jobTitle" value={item.id} checked={selectedId === item.id} onChange={() => { setSelectedId(item.id); setEligibility(null); setDataSharingAcknowledged(false); setError(null) }} />
                      <span className={styles.roleCardTop}><BriefcaseIcon size={23} aria-hidden weight="light" />{selectedId === item.id ? <CheckCircleIcon size={18} aria-hidden weight="fill" /> : <CircleIcon size={18} aria-hidden />}</span>
                      <strong>{item.job_title}</strong><small>{item.department}{!item.is_open && ' · Closed'}</small>
                    </label>)}
                  </div>
                </fieldset>
                {opening && <><div className={styles.roleMeta}><span><MapPinIcon aria-hidden size={15} />{opening.location}</span><span>{opening.employment_type}</span></div><p className={styles.description}>{opening.description}</p></>}
                {!unavailable && opening && <p className={styles.deadline}><CalendarBlankIcon aria-hidden size={16} /><span>Proposed start: {opening.start_date ? formatClosingDate(opening.start_date) : 'To be agreed'}</span></p>}
                {!unavailable && opening && <p className={`${styles.deadline} ${closed ? styles.closedLabel : ''}`}><CalendarBlankIcon aria-hidden size={16} />{closed ? 'Applications closed' : opening.closing_date ? <span>Apply by {formatClosingDate(opening.closing_date)} · 11:59 pm UK time</span> : 'Applications open · No closing date'}</p>}
              </div>
              {unavailable && <div role="status" className={styles.notice}><p>{availabilityError ? 'We’re unable to check application availability right now. Please try again shortly.' : openings?.items.length ? 'This job is no longer available. Please choose another posting above.' : 'There are no job postings at the moment. Please check back later.'}</p><button disabled={checking} type="button" onClick={() => void refreshOpenings()}>{checking ? 'Checking…' : 'Check again'}</button></div>}
              {closed && <div role="status" className={styles.notice}><strong>Applications for this role are closed.</strong><p>You can select another role above to check its availability.</p></div>}
              <p className={styles.help}>GI Healthcare Industries Limited uses your details to assess this application and contact you. Applications are automatically deleted within three calendar months of submission. Read our <Link href="/privacy" target="_blank" rel="noreferrer">privacy notice</Link> for how we use your information, service providers and your rights.</p>
              {canApply && <EligibilityCheck key={selectedId} disabled={submitting} completed={eligibility} onComplete={setEligibility} />}
              <form onSubmit={submitApplication} aria-busy={submitting} hidden={!eligibility}>
                <fieldset className={styles.section} disabled={!canApply || !eligibility || submitting}>
                  <legend><span>02</span> Your details</legend>
                  <div className={styles.fields}>
                    <div className={styles.field}><label htmlFor="name">Full name</label><input ref={detailsRef} autoComplete="name" id="name" name="name" minLength={2} maxLength={120} required /></div>
                    <div className={styles.field}><label htmlFor="email">Email address</label><input autoComplete="email" id="email" name="email" maxLength={254} required type="email" /></div>
                    <div className={`${styles.field} ${styles.full}`}><label htmlFor="phone">Phone number <span>Optional</span></label><input autoComplete="tel" id="phone" name="phone" maxLength={50} type="tel" /></div>
                  </div>
                </fieldset>
                <ApplicationQuestions disabled={!canApply || !eligibility || submitting} />
                <div className="hp-field" aria-hidden="true"><label htmlFor="company">Company</label><input autoComplete="off" id="company" name="company" tabIndex={-1} /></div>
                <label className={styles.consent} htmlFor="dataSharingAcknowledged">
                  <input ref={dataSharingRef} id="dataSharingAcknowledged" name="dataSharingAcknowledged" type="checkbox" value="yes" required checked={dataSharingAcknowledged} onChange={(event) => { setDataSharingAcknowledged(event.target.checked); setError(null) }} disabled={submitting || !canApply || !eligibility} aria-describedby="data-sharing-help" />
                  <span>{APPLICATION_DATA_SHARING_STATEMENT}</span>
                </label>
                <p className={styles.help} id="data-sharing-help">For assessing your application and contacting you, as explained in our <Link href="/privacy" target="_blank" rel="noreferrer">privacy notice</Link>.</p>
                {error && <p role="alert" className={styles.error}>{error}</p>}
                <button className={styles.submit} disabled={submitting || !canApply || !eligibility} type="submit">{submitting ? 'Sending application…' : closed ? 'Applications closed' : 'Send application'}<ArrowRightIcon aria-hidden size={20} /></button>
                <p className={styles.privacy}><ShieldCheckIcon aria-hidden size={17} /><span>No marketing or talent-pool enrolment. <Link href="/privacy" target="_blank" rel="noreferrer">Privacy & your rights</Link></span></p>
              </form>
              <footer className={styles.footer}>Have a question? <a href="mailto:info@gihealthcare.co.uk">Let’s talk <ArrowUpRightIcon aria-hidden size={14} /></a></footer>
            </>
          )}
        </div>
      </section>
      <figure className={styles.visual}>
        <div className={styles.photoFrame}><Image alt="GI Healthcare autonomous cooking machine in a sunlit studio with wood, ribbed glass and greenery" className={styles.photo} fill preload sizes="(max-width: 760px) 100vw, 44vw" src={cookingStudio} /></div>
      </figure>
    </main>
  )
}
