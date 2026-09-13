'use client'

import { CalendarBlankIcon, CheckIcon } from '@phosphor-icons/react'
import type { Session } from '@supabase/supabase-js'
import { useCallback, useEffect, useRef, useState } from 'react'

import { formatClosingDate, type CareerOpening, type OpeningsSnapshot } from '@/lib/career-opening-types'
import styles from './application-deadlines.module.css'

function DeadlineEditor({ opening, session }: { opening: CareerOpening; session: Session }) {
  const [savedDate, setSavedDate] = useState(opening.closing_date || '')
  const [date, setDate] = useState(opening.closing_date || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const saving = useRef(false)
  const inputId = `deadline-${opening.job_title === 'Embedded Systems Engineer' ? 'engineering' : 'operations'}`
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  const isClosed = savedDate && savedDate < today

  async function save(nextDate: string) {
    if (saving.current) return
    saving.current = true
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const response = await fetch('/api/admin/openings', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle: opening.job_title, closingDate: nextDate || null }),
      })
      const data = await response.json() as { error?: string }
      if (!response.ok) throw new Error(response.status === 401 ? 'Please sign in again to change closing dates.' : data.error || 'Could not save the closing date.')
      setSavedDate(nextDate)
      setDate(nextDate)
      setMessage(nextDate ? 'Closing date saved.' : 'Deadline cleared. Applications are open.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save the closing date.')
    } finally {
      saving.current = false
      setBusy(false)
    }
  }

  return (
    <form className={styles.card} onSubmit={(event) => { event.preventDefault(); void save(date) }}>
      <div className={styles.cardHeading}><h3>{opening.job_title}</h3><span className={isClosed ? styles.closed : styles.open}>{isClosed ? 'Closed' : 'Open'}</span></div>
      <p className={styles.current}>{savedDate ? `${isClosed ? 'Closed' : 'Closes'} ${formatClosingDate(savedDate)} · 11:59 pm UK time` : 'Accepting applications with no closing date.'}</p>
      <label htmlFor={inputId}>Closing date</label>
      <div className={styles.controls}>
        <input id={inputId} aria-describedby={`${inputId}-help`} type="date" min="2020-01-01" max="2099-12-31" disabled={busy} value={date} onInput={(event) => { setDate(event.currentTarget.value); setMessage(null) }} onChange={(event) => { setDate(event.target.value); setMessage(null) }} />
        <button disabled={busy || date === savedDate} type="submit">{busy ? 'Saving…' : 'Save date'}</button>
        <button className={styles.clear} disabled={busy || !savedDate} onClick={() => void save('')} type="button">Clear date</button>
      </div>
      <p className={styles.help} id={`${inputId}-help`}>Clear the date to reopen, or choose a later date to extend applications.</p>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      {message && <p role="status" className={styles.saved}><CheckIcon aria-hidden size={16} />{message}</p>}
    </form>
  )
}

export function ApplicationDeadlines({ session }: { session: Session }) {
  const [openings, setOpenings] = useState<CareerOpening[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const load = useCallback(async () => {
    setError(null)
    try {
      const response = await fetch('/api/admin/openings', { headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store' })
      const data = await response.json() as OpeningsSnapshot & { error?: string }
      if (!response.ok) throw new Error(data.error || 'Could not load closing dates.')
      setOpenings(data.items)
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Could not load closing dates.') }
  }, [session.access_token])
  useEffect(() => { void load() }, [load])

  return (
    <section className={styles.settings} aria-labelledby="application-deadlines-title">
      <header><CalendarBlankIcon aria-hidden size={22} /><div><h2 id="application-deadlines-title">Application closing dates</h2><p>Each role accepts applications through the end of its closing date, in UK time.</p></div></header>
      {error ? <p role="alert" className={styles.error}>{error} <button onClick={() => void load()} type="button">Try again</button></p> : !openings ? <p role="status">Loading closing dates…</p> : <div className={styles.grid}>{openings.map((opening) => <DeadlineEditor key={`${opening.job_title}-${opening.closing_date}`} opening={opening} session={session} />)}</div>}
    </section>
  )
}
