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
  recoveringPassword: boolean
  onPasswordUpdated: () => void
  sessionError?: string | null
}

export function AdminLogin({ supabase, checkingSession, recoveringPassword, onPasswordUpdated, sessionError }: Props) {
  const [resetRequested, setResetRequested] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const submitting = useRef(false)
  const mode = recoveringPassword ? 'update' : resetRequested ? 'reset' : 'signin'
  const disabled = busy || checkingSession || !supabase

  function changeMode(reset: boolean) {
    setResetRequested(reset)
    setShowPassword(false)
    setError(null)
    setNotice(null)
    formRef.current?.reset()
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || disabled || submitting.current) return
    const form = event.currentTarget
    const data = new FormData(form)
    setError(null)
    setNotice(null)
    if (mode === 'update' && data.get('password') !== data.get('confirmation')) {
      setError('The new passwords do not match.')
      return
    }
    submitting.current = true
    setBusy(true)
    try {
      if (mode === 'reset') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(String(data.get('email') || '').trim(), {
          redirectTo: `${window.location.origin}/admin`,
        })
        if (resetError) throw resetError
        setNotice('If this address has an account, you’ll receive a password reset link. Please check your inbox and spam folder.')
      } else if (mode === 'update') {
        const password = String(data.get('password') || '')
        if (password.length < 12) throw new Error('Use at least 12 characters for your new password.')
        const { error: updateError } = await supabase.auth.updateUser({ password })
        if (updateError) throw updateError
        form.reset()
        onPasswordUpdated()
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: String(data.get('email') || '').trim(),
          password: String(data.get('password') || ''),
        })
        if (signInError) throw signInError
      }
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
          <h1 className="sr-only">{mode === 'update' ? 'Set a new password' : mode === 'reset' ? 'Reset your password' : 'Sign in to GI Healthcare'}</h1>
          <form aria-busy={busy || checkingSession} className={styles.form} onSubmit={submit} ref={formRef}>
            {mode !== 'signin' && (
              <p className={styles.help}>{mode === 'reset' ? 'Enter your account email to receive a reset link.' : 'Choose a new password with at least 12 characters.'}</p>
            )}
            {mode !== 'update' && (
              <div className={styles.field}>
                <label className="sr-only" htmlFor="admin-email">Email address</label>
                <input autoCapitalize="none" autoComplete="username" autoCorrect="off" disabled={disabled} id="admin-email" name="email" required spellCheck={false} type="email" />
              </div>
            )}
            {mode !== 'reset' && (
              <div className={styles.field}>
                <label className="sr-only" htmlFor="admin-password">{mode === 'update' ? 'New password' : 'Password'}</label>
                <input autoComplete={mode === 'update' ? 'new-password' : 'current-password'} className={styles.password} disabled={disabled} id="admin-password" minLength={mode === 'update' ? 12 : undefined} name="password" required type={showPassword ? 'text' : 'password'} />
                <button aria-controls="admin-password" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} className={styles.visibility} disabled={disabled} onClick={() => setShowPassword((current) => !current)} type="button">
                  {showPassword ? <EyeSlashIcon aria-hidden size={23} /> : <EyeIcon aria-hidden size={23} />}
                </button>
              </div>
            )}
            {mode === 'update' && (
              <div className={styles.field}>
                <label className="sr-only" htmlFor="admin-confirmation">Confirm new password</label>
                <input autoComplete="new-password" disabled={disabled} id="admin-confirmation" minLength={12} name="confirmation" required type="password" />
              </div>
            )}
            {mode === 'signin' && <button className={styles.forgot} disabled={disabled} onClick={() => changeMode(true)} type="button">Forgot password?</button>}
            <button className={styles.submit} disabled={disabled} type="submit">
              {busy ? (mode === 'reset' ? 'Sending…' : mode === 'update' ? 'Saving…' : 'Signing in…') : mode === 'reset' ? 'Send reset link' : mode === 'update' ? 'Save password' : 'Sign in'}
            </button>
            {message && <p className={styles.error} role="alert">{message}</p>}
            {notice && <p className={styles.notice} role="status">{notice}</p>}
            {mode === 'reset' && <button className={styles.backToSignIn} disabled={busy} onClick={() => changeMode(false)} type="button">Back to sign in</button>}
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
