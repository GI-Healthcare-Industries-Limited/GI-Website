'use client'

import {
  ArrowRightIcon,
  ArrowSquareOutIcon,
  BriefcaseIcon,
  BuildingsIcon,
  CaretDownIcon,
  CheckCircleIcon,
  CircleIcon,
  LinkSimpleIcon,
  MapPinIcon,
  ShieldCheckIcon,
} from '@phosphor-icons/react'
import Image from 'next/image'
import Link from 'next/link'
import { type FormEvent, useRef, useState } from 'react'

import { JOB_TITLES } from '@/lib/submission-constants'

type ApplyFormProps = {
  initialRole: (typeof JOB_TITLES)[number]
}

type Eligibility = '' | 'yes' | 'no'

const roleDetails: Record<(typeof JOB_TITLES)[number], { discipline: string }> = {
  'Embedded Systems Engineer': { discipline: 'Engineering' },
  'Business Development and Operations Manager': { discipline: 'Commercial & Operations' },
}

const applicationSteps = [
  { number: '01', title: 'Eligibility', copy: 'Confirm your right to work in the UK.' },
  { number: '02', title: 'Your details', copy: 'Tell us who you are and how we can reach you.' },
  { number: '03', title: 'Your work', copy: 'Share a link to your work and a project you are proud of.' },
]

export function ApplyForm({ initialRole }: ApplyFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [selectedRole, setSelectedRole] = useState(initialRole)
  const [eligibility, setEligibility] = useState<Eligibility>('')
  const [projectSummary, setProjectSummary] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)

  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setResult(null)

    if (eligibility !== 'yes') {
      setResult({
        kind: 'error',
        message: 'You must confirm that you already have the right to work in the UK.',
      })
      return
    }

    setSubmitting(true)

    try {
      const formData = new FormData(event.currentTarget)
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: selectedRole,
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          portfolioUrl: formData.get('portfolioUrl'),
          projectSummary: formData.get('projectSummary'),
          rightToWork: eligibility,
          consent: formData.get('consent'),
          company: formData.get('company'),
        }),
      })
      const payload = (await response.json().catch(() => ({}))) as { error?: string }

      if (!response.ok) throw new Error(payload.error || 'We could not send your application.')

      formRef.current?.reset()
      setEligibility('')
      setProjectSummary('')
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
    <main className="application-layout">
      <aside className="application-rail">
        <Link className="rail-brand" href="/">
          <span className="rail-brand-mark">
            <Image
              alt=""
              height={48}
              priority
              src="/assets/assets/images/butterfly.webp"
              width={48}
            />
          </span>
          <span>GI Healthcare</span>
        </Link>

        <div className="rail-role">
          <p className="rail-eyebrow">Careers at GI Healthcare</p>
          <h1>{selectedRole}</h1>
          <div className="rail-role-meta">
            <span><MapPinIcon aria-hidden size={21} weight="bold" />Edinburgh, United Kingdom</span>
            <span><BriefcaseIcon aria-hidden size={21} weight="bold" />Full-time</span>
            <span><BuildingsIcon aria-hidden size={21} weight="bold" />{roleDetails[selectedRole].discipline}</span>
          </div>
        </div>

        <ol className="application-progress">
          {applicationSteps.map((step, index) => (
            <li className={index === 0 ? 'active' : ''} key={step.number}>
              <span className="progress-number">{step.number}</span>
              <span className="progress-copy">
                <strong>{step.title}</strong>
                <span>{step.copy}</span>
              </span>
            </li>
          ))}
        </ol>

        <p className="rail-contact">
          Questions? Contact us at<br />
          <a href="mailto:info@gihealthcare.co.uk">info@gihealthcare.co.uk</a>
        </p>
      </aside>

      <section className="application-workspace">
        <header className="application-toolbar">
          <div className="role-picker-field">
            <label htmlFor="jobTitle">Role</label>
            <span className="select-with-icon">
              <BriefcaseIcon aria-hidden size={21} />
              <select
                id="jobTitle"
                name="jobTitle"
                onChange={(event) => setSelectedRole(event.target.value as (typeof JOB_TITLES)[number])}
                value={selectedRole}
              >
                {JOB_TITLES.map((jobTitle) => <option key={jobTitle}>{jobTitle}</option>)}
              </select>
              <CaretDownIcon aria-hidden className="select-caret" size={17} />
            </span>
          </div>
          <Link className="careers-back-link" href="/">
            Back to careers site <ArrowSquareOutIcon aria-hidden size={18} />
          </Link>
        </header>

        <form className="guided-application-form" ref={formRef} onSubmit={submitApplication}>
          <section className="application-section eligibility-section">
            <p className="section-index">01 Eligibility</p>
            <h2>Do you currently have the right to work in the UK?</h2>
            <fieldset className="eligibility-options">
              <legend className="sr-only">Right to work in the UK</legend>
              <label className={eligibility === 'yes' ? 'selected' : ''}>
                <input
                  checked={eligibility === 'yes'}
                  name="rightToWork"
                  onChange={() => {
                    setEligibility('yes')
                    setResult(null)
                  }}
                  required
                  type="radio"
                  value="yes"
                />
                {eligibility === 'yes'
                  ? <CheckCircleIcon aria-hidden className="eligibility-choice-icon" size={26} weight="fill" />
                  : <CircleIcon aria-hidden className="eligibility-choice-icon" size={26} />}
                <span>Yes</span>
              </label>
              <label className={eligibility === 'no' ? 'selected negative' : ''}>
                <input
                  checked={eligibility === 'no'}
                  name="rightToWork"
                  onChange={() => {
                    setEligibility('no')
                    setResult(null)
                  }}
                  required
                  type="radio"
                  value="no"
                />
                {eligibility === 'no'
                  ? <CheckCircleIcon aria-hidden className="eligibility-choice-icon" size={26} weight="fill" />
                  : <CircleIcon aria-hidden className="eligibility-choice-icon" size={26} />}
                <span>No</span>
              </label>
            </fieldset>
            <p className="eligibility-note">GI Healthcare is unable to provide visa sponsorship for this role.</p>

            {eligibility === 'no' && (
              <div aria-live="polite" className="eligibility-blocked" role="status">
                <CheckCircleIcon aria-hidden size={24} weight="fill" />
                <div>
                  <strong>This role is not available without an existing right to work in the UK.</strong>
                  <p>We cannot progress this application because GI Healthcare is not able to sponsor a visa for this position.</p>
                </div>
              </div>
            )}
          </section>

          {eligibility === 'yes' && (
            <>
              <section className="application-section">
                <p className="section-index">02 Your details</p>
                <div className="application-field-grid">
                  <div className="application-field">
                    <label htmlFor="name">Full name</label>
                    <input autoComplete="name" id="name" maxLength={120} name="name" placeholder="e.g. Alex Morgan" required />
                  </div>
                  <div className="application-field">
                    <label htmlFor="email">Email address</label>
                    <input autoComplete="email" id="email" maxLength={254} name="email" placeholder="e.g. alex.morgan@example.com" required type="email" />
                  </div>
                  <div className="application-field full-width">
                    <label htmlFor="phone">Phone number <span>(optional)</span></label>
                    <input autoComplete="tel" id="phone" maxLength={50} name="phone" placeholder="e.g. +44 7123 456789" type="tel" />
                  </div>
                </div>
              </section>

              <section className="application-section">
                <p className="section-index">03 Your work</p>
                <div className="application-field full-width">
                  <label htmlFor="portfolioUrl">Portfolio or project link</label>
                  <span className="input-with-icon">
                    <LinkSimpleIcon aria-hidden size={20} />
                    <input
                      id="portfolioUrl"
                      maxLength={2048}
                      name="portfolioUrl"
                      placeholder="https://yourwebsite.com, https://github.com/you, or another relevant URL"
                      required
                      type="url"
                    />
                  </span>
                  <p className="application-help">Share a personal website, GitHub, project page, case study, demo, or other work that shows your skills.</p>
                </div>
                <div className="application-field full-width summary-field">
                  <label htmlFor="projectSummary">Tell us about one project you&apos;re proud of.</label>
                  <textarea
                    id="projectSummary"
                    maxLength={800}
                    minLength={80}
                    name="projectSummary"
                    onChange={(event) => setProjectSummary(event.target.value)}
                    placeholder="What was the problem, what did you build, what was your approach, and what impact did it have?"
                    required
                    value={projectSummary}
                  />
                  <span className="character-count">{projectSummary.length} / 800</span>
                </div>
              </section>

              <div className="hp-field" aria-hidden="true">
                <label htmlFor="company">Company</label>
                <input autoComplete="off" id="company" name="company" tabIndex={-1} />
              </div>

              <footer className="application-submit-row">
                <div className="application-privacy">
                  <ShieldCheckIcon aria-hidden size={34} />
                  <div>
                    <strong>Your information is safe with us.</strong>
                    <span>We only use your details to assess this application.</span>
                    <label>
                      <input name="consent" required type="checkbox" value="yes" />
                      I consent to GI Healthcare using these details to assess and contact me about this role.
                    </label>
                  </div>
                </div>
                <button className="application-submit-button" disabled={submitting} type="submit">
                  {submitting ? 'Submitting…' : 'Submit application'}
                  <ArrowRightIcon aria-hidden size={23} weight="bold" />
                </button>
              </footer>
            </>
          )}

          {result && (
            <p aria-live="polite" className={`application-status ${result.kind}`} role="status">
              {result.message}
            </p>
          )}
        </form>
      </section>
    </main>
  )
}
