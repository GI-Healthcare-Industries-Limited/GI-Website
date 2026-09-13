'use client'

import { ArrowRightIcon, ArrowUpRightIcon, CalendarBlankIcon, ChartLineUpIcon, CheckCircleIcon, CircleIcon, CpuIcon, LinkSimpleIcon, MapPinIcon, ShieldCheckIcon } from '@phosphor-icons/react'
import Image from 'next/image'
import Link from 'next/link'
import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react'

import cookingStudio from '@/assets/admin/cooking-studio.webp'
import logo from '@/assets/brand/gi-healthcare-logo.png'
import { formatClosingDate, type JobTitle, type OpeningsSnapshot } from '@/lib/career-opening-types'
import { JOB_TITLES } from '@/lib/submission-constants'
import type { RightToWorkDeclaration } from '@/lib/right-to-work'
import { EligibilityCheck } from './eligibility-check'
import styles from './apply-form.module.css'

type Props = { initialRole: JobTitle; initialOpenings: OpeningsSnapshot | null }

export function ApplyForm({ initialRole, initialOpenings }: Props) {
  const [selectedRole, setSelectedRole] = useState(initialRole)
  const [eligibility, setEligibility] = useState<RightToWorkDeclaration | null>(null)
  const [projectSummary, setProjectSummary] = useState('')
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
      setAvailabilityError(false)
    } catch {
      if (requestId === refreshRequest.current) setAvailabilityError(true)
    } finally {
      if (requestId === refreshRequest.current) setChecking(false)
    }
  }, [])

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

  const opening = openings?.items.find((item) => item.job_title === selectedRole)
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
    submittingRef.current = true
    setSubmitting(true)
    try {
      const response = await fetch('/api/applications', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: selectedRole, name: formData.get('name'), email: formData.get('email'),
          phone: formData.get('phone'), portfolioUrl: formData.get('portfolioUrl'),
          projectSummary: formData.get('projectSummary'), ...eligibility,
          consent: formData.get('consent'), company: formData.get('company'),
        }),
      })
      const payload = await response.json().catch(() => ({})) as { error?: string; code?: string; ok?: boolean }
      if (payload.code === 'APPLICATION_CLOSED') void refreshOpenings()
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'We could not confirm your application. Please try again.')
      setSubmitted(true)
      setEligibility(null)
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
              <p>Your application for {selectedRole} is with our team. We’ll review it and contact you if we’d like to take things further.</p>
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
                    {JOB_TITLES.map((title, index) => <label key={title} className={selectedRole === title ? styles.activeRole : ''}>
                      <input type="radio" name="jobTitle" value={title} checked={selectedRole === title} onChange={() => { setSelectedRole(title); setEligibility(null); setError(null) }} />
                      <span className={styles.roleCardTop}>{index === 0 ? <CpuIcon size={23} aria-hidden weight="light" /> : <ChartLineUpIcon size={23} aria-hidden weight="light" />}{selectedRole === title ? <CheckCircleIcon size={18} aria-hidden weight="fill" /> : <CircleIcon size={18} aria-hidden />}</span>
                      <strong>{title}</strong><small>{index === 0 ? 'Engineering' : 'Commercial & operations'}</small>
                    </label>)}
                  </div>
                </fieldset>
                <div className={styles.roleMeta}><span><MapPinIcon aria-hidden size={15} /> Edinburgh, UK</span><span>Full-time</span></div>
                {!unavailable && opening && <p className={`${styles.deadline} ${closed ? styles.closedLabel : ''}`}><CalendarBlankIcon aria-hidden size={16} />{opening.closing_date ? <span>{closed ? 'Closed' : 'Apply by'} {formatClosingDate(opening.closing_date)}{!closed && ' · 11:59 pm UK time'}</span> : 'Applications open · No closing date'}</p>}
              </div>
              {unavailable && <div role="status" className={styles.notice}><p>We’re unable to check application availability right now. Please try again shortly.</p><button disabled={checking} type="button" onClick={() => void refreshOpenings()}>{checking ? 'Checking…' : 'Check again'}</button></div>}
              {closed && <div role="status" className={styles.notice}><strong>Applications for this role are closed.</strong><p>You can select another role above to check its availability.</p></div>}
              <EligibilityCheck disabled={!canApply || submitting} completed={eligibility} onComplete={setEligibility} />
              <form onSubmit={submitApplication} aria-busy={submitting} hidden={!eligibility}>
                <fieldset className={styles.section} disabled={!canApply || !eligibility || submitting}>
                  <legend><span>02</span> Your details</legend>
                  <div className={styles.fields}>
                    <div className={styles.field}><label htmlFor="name">Full name</label><input ref={detailsRef} autoComplete="name" id="name" name="name" minLength={2} maxLength={120} required /></div>
                    <div className={styles.field}><label htmlFor="email">Email address</label><input autoComplete="email" id="email" name="email" maxLength={254} required type="email" /></div>
                    <div className={`${styles.field} ${styles.full}`}><label htmlFor="phone">Phone number <span>Optional</span></label><input autoComplete="tel" id="phone" name="phone" maxLength={50} type="tel" /></div>
                  </div>
                </fieldset>
                <fieldset className={styles.section} disabled={!canApply || !eligibility || submitting}>
                  <legend><span>03</span> Show us your work</legend>
                  <div className={styles.field}>
                    <label htmlFor="portfolioUrl">Portfolio or project link</label>
                    <div className={styles.linkInput}><LinkSimpleIcon aria-hidden size={18} /><input id="portfolioUrl" name="portfolioUrl" maxLength={2048} required type="url" placeholder="https://" aria-describedby="portfolio-help" /></div>
                    <p className={styles.help} id="portfolio-help">{selectedRole === 'Embedded Systems Engineer' ? 'A personal site, GitHub repository, engineering project or demo.' : 'A portfolio, case study, business project or example of your work.'} No CV needed.</p>
                  </div>
                  <div className={`${styles.field} ${styles.summary}`}>
                    <label htmlFor="projectSummary">A project you’re proud of</label>
                    <p className={styles.help} id="project-help">What was the challenge, what did you contribute, and what changed?</p>
                    <textarea id="projectSummary" name="projectSummary" minLength={80} maxLength={800} required value={projectSummary} onChange={(event) => setProjectSummary(event.target.value)} aria-describedby="project-help project-count" />
                    <div className={styles.counter} id="project-count"><span>80–800 characters</span><span>{projectSummary.length} / 800</span></div>
                  </div>
                  <label className={styles.consent}><input name="consent" required type="checkbox" value="yes" /><span>I agree to GI Healthcare using my details to review my application, check my right to work and contact me about this role.</span></label>
                </fieldset>
                <div className="hp-field" aria-hidden="true"><label htmlFor="company">Company</label><input autoComplete="off" id="company" name="company" tabIndex={-1} /></div>
                {error && <p role="alert" className={styles.error}>{error}</p>}
                <button className={styles.submit} disabled={submitting || !canApply || !eligibility} type="submit">{submitting ? 'Sending application…' : closed ? 'Applications closed' : 'Send application'}<ArrowRightIcon aria-hidden size={20} /></button>
                <p className={styles.privacy}><ShieldCheckIcon aria-hidden size={17} />Your details are only used to assess your application.</p>
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
