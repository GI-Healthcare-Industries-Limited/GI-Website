'use client'

import { BriefcaseIcon, PlusIcon } from '@phosphor-icons/react'
import type { Session } from '@supabase/supabase-js'
import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { EDUCATION_ELIGIBILITY, EDUCATION_ELIGIBILITY_LABELS, EMPLOYMENT_TYPES, formatClosingDate, type CareerOpening, type OpeningsSnapshot } from '@/lib/career-opening-types'
import styles from './job-postings.module.css'
import { QuestionEditor } from './question-editor'

async function savePosting(session: Session, method: string, body: unknown) {
  const response = await fetch('/api/admin/openings', {
    method, headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const result = await response.json() as { error?: string }
  if (!response.ok) throw new Error(response.status === 401 ? 'Please sign in again to manage job postings.' : result.error || 'Could not save this posting. Please try again.')
}

function JobEditor({ opening, session, onSaved, onCancel }: {
  opening?: CareerOpening; session: Session; onSaved: () => void; onCancel: () => void
}) {
  const [closingDate, setClosingDate] = useState(opening?.closing_date || '')
  const [questions, setQuestions] = useState(opening?.section_three_questions ?? null)
  const [startDate, setStartDate] = useState(opening?.start_date || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const saving = useRef(false)
  const titleRef = useRef<HTMLInputElement>(null)
  useEffect(() => { titleRef.current?.focus() }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving.current) return
    const data = new FormData(event.currentTarget)
    saving.current = true
    setBusy(true)
    setError('')
    try {
      await savePosting(session, opening ? 'PATCH' : 'POST', {
        ...(opening ? { id: opening.id, expectedUpdatedAt: opening.updated_at } : {}),
        jobTitle: data.get('jobTitle'), location: data.get('location'), department: data.get('department'),
        employmentType: data.get('employmentType'), description: data.get('description'),
        acceptingApplications: data.get('acceptingApplications') === 'yes',
        educationEligibility: data.get('educationEligibility'),
        sectionThreeQuestions: questions,
        closingDate: closingDate || null, startDate: startDate || null,
      })
      onSaved()
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not save the job posting.') }
    finally { saving.current = false; setBusy(false) }
  }

  return <form className={styles.editor} onSubmit={submit} aria-label={opening ? 'Edit job posting' : 'Add job posting'} aria-busy={busy}>
    <h3>{opening ? 'Edit posting' : 'A new opportunity'}</h3>
    <p className={styles.help}>These details appear on the careers page and application form when you save.</p>
    <fieldset disabled={busy} className={styles.fields}>
      <label className={styles.wide}>Job title<input ref={titleRef} name="jobTitle" required minLength={2} maxLength={120} defaultValue={opening?.job_title} /></label>
      <label>Location<input name="location" required minLength={2} maxLength={120} defaultValue={opening?.location || 'Edinburgh, UK'} /></label>
      <label>Department<input name="department" required minLength={2} maxLength={120} defaultValue={opening?.department} /></label>
      <label>Employment type<select name="employmentType" defaultValue={opening?.employment_type || 'Full-time'}>{EMPLOYMENT_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
      <label>Applicant eligibility<select name="educationEligibility" defaultValue={opening?.education_eligibility || 'all'}>{EDUCATION_ELIGIBILITY.map(value => <option value={value} key={value}>{EDUCATION_ELIGIBILITY_LABELS[value]}</option>)}</select><span className={styles.help}>Applies to new submissions only. Existing applications and UK work-permission checks are unchanged.</span></label>
      <label className={styles.wide}>Role description<textarea name="description" required minLength={10} maxLength={2000} rows={5} defaultValue={opening?.description} /><span className={styles.help}>A short, plain-text overview. Up to 2,000 characters.</span></label>
      <div><label htmlFor="job-closing-date">Application closing date</label><div className={styles.dateRow}><input id="job-closing-date" aria-describedby="job-closing-help" name="closingDate" type="date" min="2020-01-01" max="2099-12-31" value={closingDate} onInput={(event) => setClosingDate(event.currentTarget.value)} onChange={(event) => setClosingDate(event.target.value)} /><button aria-label="Clear closing date" type="button" disabled={!closingDate} onClick={() => setClosingDate('')}>Clear</button></div><p id="job-closing-help" className={styles.help}>Includes the full UK calendar day. Leave blank for no deadline.</p></div>
      <div><label htmlFor="job-start-date">Proposed start date</label><div className={styles.dateRow}><input id="job-start-date" aria-describedby="job-start-help" name="startDate" type="date" min="2020-01-01" max="2099-12-31" value={startDate} onInput={(event) => setStartDate(event.currentTarget.value)} onChange={(event) => setStartDate(event.target.value)} /><button aria-label="Clear start date" type="button" disabled={!startDate} onClick={() => setStartDate('')}>Clear</button></div><p id="job-start-help" className={styles.help}>Leave blank for “To be agreed”.</p></div>
      <label className={`${styles.toggle} ${styles.wide}`}><input type="checkbox" name="acceptingApplications" value="yes" defaultChecked={opening?.accepting_applications ?? true} /><span>Accept applications<span className={styles.help}>Switch off to close this role immediately. A past closing date also closes it.</span></span></label>
      <QuestionEditor value={questions} onChange={setQuestions} />
    </fieldset>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <div className={styles.actions}><button disabled={busy} className={styles.primary} type="submit">{busy ? 'Saving…' : opening ? 'Save changes' : 'Publish job'}</button><button disabled={busy} type="button" onClick={onCancel}>Cancel</button></div>
  </form>
}

export function JobPostings({ session }: { session: Session }) {
  const [openings, setOpenings] = useState<CareerOpening[] | null>(null)
  const [editing, setEditing] = useState<CareerOpening | 'new' | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const requestNumber = useRef(0)
  const deleting = useRef(false)
  const addRef = useRef<HTMLButtonElement>(null)
  const load = useCallback(async () => {
    const requestId = ++requestNumber.current
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/openings', { headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store' })
      const data = await response.json() as OpeningsSnapshot & { error?: string }
      if (!response.ok) throw new Error(data.error || 'Could not load job postings.')
      if (requestId === requestNumber.current) setOpenings(data.items)
    } catch (failure) {
      if (requestId === requestNumber.current) setError(failure instanceof Error ? failure.message : 'Could not load job postings.')
    } finally { if (requestId === requestNumber.current) setLoading(false) }
  }, [session.access_token])
  useEffect(() => { void load(); return () => { requestNumber.current++ } }, [load])

  function finishEditing() { setEditing(null); requestAnimationFrame(() => addRef.current?.focus()) }
  async function remove(opening: CareerOpening) {
    if (deleting.current) return
    deleting.current = true
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await savePosting(session, 'DELETE', { id: opening.id, expectedUpdatedAt: opening.updated_at })
      setOpenings((items) => items?.filter((item) => item.id !== opening.id) ?? null)
      setRemoving(null)
      setMessage('Job posting removed. Existing applications have been kept.')
      addRef.current?.focus()
      await load()
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not remove this posting.') }
    finally { deleting.current = false; setBusy(false) }
  }

  return <section className={styles.settings} aria-labelledby="job-postings-title">
    <header className={styles.heading}><BriefcaseIcon aria-hidden size={23} /><div><h2 id="job-postings-title">Job postings</h2><p>Shape your next hire. Manage the roles shown on your careers page.</p></div><button ref={addRef} className={styles.primary} type="button" disabled={Boolean(editing) || busy || loading || Boolean(error)} onClick={() => { setEditing('new'); setRemoving(null); setMessage('') }}><PlusIcon aria-hidden size={16} />Add job</button></header>
    {error && <p role="alert" className={styles.error}>{error} {!editing && <button disabled={loading || busy} type="button" onClick={() => { setRemoving(null); void load() }}>Refresh list</button>}</p>}
    {message && <p role="status" className={styles.saved}>{message}</p>}
    {editing ? <JobEditor key={editing === 'new' ? 'new' : editing.id} opening={editing === 'new' ? undefined : editing} session={session} onCancel={finishEditing} onSaved={() => { setMessage(editing === 'new' ? 'Job published.' : 'Job posting saved.'); finishEditing(); void load() }} /> : <>
      {loading && <p role="status" className={styles.help}>Loading job postings…</p>}
      {openings?.length === 0 && <div className={styles.empty}><h3>Your next chapter starts here.</h3><p>No job postings yet. Add a role when you’re ready to hire.</p></div>}
      <div className={styles.grid}>{openings?.map((opening) => <article key={opening.id} className={styles.card}>
        <div className={styles.cardHeading}><h3>{opening.job_title}</h3><span className={opening.is_open ? styles.open : styles.closed}>{opening.is_open ? 'Open' : 'Closed'}</span></div>
        <p className={styles.meta}>{opening.department} · {opening.location} · {opening.employment_type}</p>
        <p className={styles.meta}>Eligible applicants: {EDUCATION_ELIGIBILITY_LABELS[opening.education_eligibility]}</p>
        <p className={styles.dates}>Closes: {opening.closing_date ? formatClosingDate(opening.closing_date) : 'No deadline'}<br />Starts: {opening.start_date ? formatClosingDate(opening.start_date) : 'To be agreed'}</p>
        {removing === opening.id ? <div className={styles.confirm} role="group" aria-label={`Confirm removal of ${opening.job_title}`}><strong>Remove this posting?</strong><p>It will disappear from the careers page and stop accepting applications. Applications already received will stay in your inbox until their usual deletion date.</p><div className={styles.actions}><button className={styles.danger} type="button" disabled={busy} onClick={() => void remove(opening)}>{busy ? 'Removing…' : 'Remove job'}</button><button disabled={busy} type="button" onClick={() => setRemoving(null)}>Cancel removal</button></div></div> : <div className={styles.actions}><button disabled={busy || loading || Boolean(error)} type="button" onClick={() => { setEditing(opening); setRemoving(null); setMessage('') }} aria-label={`Edit ${opening.job_title}`}>Edit posting</button><button disabled={busy || loading || Boolean(error)} type="button" className={styles.remove} onClick={() => { setRemoving(opening.id); setMessage('') }} aria-label={`Remove ${opening.job_title}`}>Remove</button></div>}
      </article>)}</div>
    </>}
  </section>
}
