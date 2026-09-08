'use client'

import { ArrowSquareOutIcon, EyeIcon, EyeSlashIcon } from '@phosphor-icons/react'
import type { SupabaseClient } from '@supabase/supabase-js'
import Image from 'next/image'
import Link from 'next/link'
import { type FormEvent, useRef, useState } from 'react'

import cookingStudio from '@/assets/admin/cooking-studio.webp'
import logo from '@/assets/brand/gi-healthcare-logo.png'
import styles from './admin-login.module.css'

type Props = {
  supabase: SupabaseClient | null
  checkingSession: boolean
  sessionError?: string | null
}

export function AdminLogin({ supabase, checkingSession, sessionError }: Props) {
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submitting = useRef(false)
  const disabled = busy || checkingSession || !supabase

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || disabled || submitting.current) return
    const data = new FormData(event.currentTarget)
    setError(null)
    submitting.current = true
    setBusy(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: String(data.get('email') || '').trim(),
        password: String(data.get('password') || ''),
      })
      if (signInError) throw signInError
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Unable to connect. Please try again.')
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  const message = error || sessionError || (!checkingSession && !supabase ? 'Sign-in is temporarily unavailable. Please try again later.' : null)

  return (
    <main className={styles.layout}>
      <section aria-label="Admin sign in" className={styles.panel}>
        <Link aria-label="GI Healthcare home" className={styles.brand} href="/">
          <Image alt="GI Healthcare" src={logo} width={230} height={67} preload />
        </Link>
        <div className={styles.controls}>
          <h1 className="sr-only">Sign in to GI Healthcare</h1>
          <form aria-busy={busy || checkingSession} className={styles.form} onSubmit={submit}>
            <div className={styles.field}>
              <label className="sr-only" htmlFor="admin-email">Email address</label>
              <input autoCapitalize="none" autoComplete="username" autoCorrect="off" disabled={disabled} id="admin-email" name="email" required spellCheck={false} type="email" />
            </div>
            <div className={styles.field}>
              <label className="sr-only" htmlFor="admin-password">Password</label>
              <input autoComplete="current-password" className={styles.password} disabled={disabled} id="admin-password" name="password" required type={showPassword ? 'text' : 'password'} />
              <button aria-controls="admin-password" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} className={styles.visibility} disabled={disabled} onClick={() => setShowPassword((current) => !current)} type="button">
                {showPassword ? <EyeSlashIcon aria-hidden size={23} /> : <EyeIcon aria-hidden size={23} />}
              </button>
            </div>
            <button className={styles.submit} disabled={disabled} type="submit">
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
            {message && <p className={styles.error} role="alert">{message}</p>}
            {checkingSession && <span className="sr-only" role="status">Checking your session…</span>}
          </form>
          <div className={styles.returnRow}>
            <Link className={styles.returnLink} href="/"><ArrowSquareOutIcon aria-hidden size={23} />Back to website</Link>
          </div>
        </div>
      </section>
      <figure className={styles.visual}>
        <Image alt="Autonomous cooking machine in a sunlit studio with wood, ribbed glass and greenery" className={styles.photo} fill preload sizes="(max-width: 700px) 1px, 55vw" src={cookingStudio} />
        <figcaption>Autonomous cooking.<br />For extreme environments.</figcaption>
      </figure>
    </main>
  )
}
