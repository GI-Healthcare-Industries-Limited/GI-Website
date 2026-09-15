'use client'

import { ArrowRightIcon, CheckCircleIcon } from '@phosphor-icons/react'
import Link from 'next/link'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { PRIVACY_NOTICE_VERSION } from '@/lib/privacy'
import styles from './contact.module.css'

export function ContactForm() {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const sendingRef = useRef(false)
  const result = useRef<HTMLDivElement>(null)
  useEffect(() => { if (sent) result.current?.focus() }, [sent])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sendingRef.current) return
    const data = new FormData(event.currentTarget)
    sendingRef.current = true
    setSending(true); setError('')
    try {
      const response = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.get('name'), email: data.get('email'), phone: data.get('phone'), message: data.get('message'), company: data.get('company'), privacyNoticeVersion: PRIVACY_NOTICE_VERSION }),
      })
      const payload = await response.json().catch(() => ({})) as { ok?: boolean; error?: string }
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Your message could not be sent. Please try again.')
      setSent(true)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Your message could not be sent. Please try again.')
    } finally { sendingRef.current = false; setSending(false) }
  }

  return <section className={styles.formPanel} aria-label="Contact GI Healthcare">
        {sent ? <div ref={result} tabIndex={-1} className={styles.success}>
          <CheckCircleIcon aria-hidden size={42} weight="light" />
          <h2>Message received.</h2><p>Thank you for getting in touch. We’ll reply to the email address you provided.</p>
          <a className={styles.submit} href="/">Explore GI Healthcare <ArrowRightIcon aria-hidden size={19} /></a>
        </div> : <>
          <h2 className={styles.formTitle}>Send us a message</h2>
          <form onSubmit={submit} aria-busy={sending}>
            <fieldset disabled={sending}>
              <legend className="sr-only">Your message</legend>
              <div className={styles.twoColumns}>
                <div className={styles.field}><label htmlFor="contact-name">Your name</label><input id="contact-name" name="name" autoComplete="name" required minLength={2} maxLength={120} /></div>
                <div className={styles.field}><label htmlFor="contact-email">Email address</label><input id="contact-email" name="email" autoComplete="email" type="email" required maxLength={254} /></div>
              </div>
              <div className={styles.field}><label htmlFor="contact-phone">Phone number <span>Optional</span></label><input id="contact-phone" name="phone" autoComplete="tel" type="tel" maxLength={50} /></div>
              <div className={styles.field}><label htmlFor="contact-message">What’s on your mind?</label><textarea id="contact-message" name="message" rows={5} required minLength={10} maxLength={2000} /></div>
              <div className="hp-field" aria-hidden="true"><label htmlFor="contact-company">Company</label><input id="contact-company" name="company" tabIndex={-1} autoComplete="off" /></div>
            </fieldset>
            <p className={styles.privacy}>Used to respond to your enquiry. Deleted within three months. <Link href="/privacy" target="_blank" rel="noreferrer">Privacy notice</Link>.</p>
            {error && <p role="alert" className={styles.error}>{error}</p>}
            <button className={styles.submit} type="submit" disabled={sending}>{sending ? 'Sending…' : 'Send message'}<ArrowRightIcon aria-hidden size={19} /></button>
          </form>
        </>}
  </section>
}
