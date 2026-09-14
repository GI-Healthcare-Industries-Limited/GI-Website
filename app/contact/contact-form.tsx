'use client'

import { ArrowRightIcon, ArrowUpRightIcon, CheckCircleIcon } from '@phosphor-icons/react'
import Image from 'next/image'
import Link from 'next/link'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import cookingStudio from '@/assets/admin/cooking-studio.webp'
import logo from '@/assets/brand/gi-healthcare-logo.png'
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

  return <main className={styles.page}>
    <section className={styles.panel} aria-label="Contact GI Healthcare">
      <header className={styles.header}>
        <Link href="/" aria-label="GI Healthcare home"><Image src={logo} alt="GI Healthcare" width={180} height={52} preload /></Link>
        <Link href="/">Back to website <ArrowUpRightIcon aria-hidden size={15} /></Link>
      </header>
      <div className={styles.content}>
        {sent ? <div ref={result} tabIndex={-1} className={styles.success}>
          <CheckCircleIcon aria-hidden size={42} weight="light" />
          <h1>Message received.</h1><p>Thank you for getting in touch. We’ll reply to the email address you provided.</p>
          <Link className={styles.submit} href="/">Back to website <ArrowRightIcon aria-hidden size={19} /></Link>
        </div> : <>
          <p className={styles.eyebrow}>Get in touch</p>
          <h1>Let’s talk.</h1>
          <p className={styles.intro}>A question, an idea, a possibility.<br />We’d love to hear it.</p>
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
        <footer className={styles.footer}>
          <a href="tel:+441313928881">+44 131 392 8881</a>
          <a href="https://www.linkedin.com/company/gihil/" target="_blank" rel="noreferrer">LinkedIn <ArrowUpRightIcon aria-hidden size={13} /></a>
          <Link href="/apply">Careers <ArrowUpRightIcon aria-hidden size={13} /></Link>
        </footer>
        <details className={styles.locations}><summary>Our locations</summary><div><p><strong>Head office</strong>1F23 Student Ventures, Bristol, BS16 1QY</p><p><strong>Research & development</strong>The National Robotarium, Edinburgh, EH14 4AS</p></div></details>
      </div>
    </section>
    <figure className={styles.visual}><Image src={cookingStudio} alt="GI Healthcare autonomous cooking machine in a sunlit studio" fill preload sizes="(max-width: 760px) 100vw, 44vw" /></figure>
  </main>
}
