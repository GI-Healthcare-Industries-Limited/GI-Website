'use client'

import type { Session } from '@supabase/supabase-js'
import { type FormEvent, useCallback, useEffect, useState } from 'react'

import { applicationStatuses, contactStatuses } from '@/lib/submission-constants'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'

type Kind = 'contact' | 'application'
type Submission = {
  id: string
  created_at: string
  updated_at: string
  name: string
  email: string
  phone: string | null
  status: string
  message?: string
  job_title?: string
  cover_letter?: string
  cv_path?: string
  cv_original_name?: string
}

async function authenticatedFetch(session: Session, input: string, init?: RequestInit) {
  return fetch(input, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${session.access_token}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
    },
  })
}

export function AdminDashboard() {
  const supabase = getSupabaseBrowserClient()
  const [session, setSession] = useState<Session | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [kind, setKind] = useState<Kind>('contact')
  const [items, setItems] = useState<Submission[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setCheckingSession(false)
      return
    }

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCheckingSession(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setCheckingSession(false)
    })
    return () => listener.subscription.unsubscribe()
  }, [supabase])

  const loadSubmissions = useCallback(async () => {
    if (!session) return
    setLoading(true)
    setError(null)
    try {
      const response = await authenticatedFetch(session, `/api/admin/submissions?kind=${kind}`)
      const payload = (await response.json()) as { items?: Submission[]; error?: string }
      if (response.status === 401) {
        await supabase?.auth.signOut()
        throw new Error('Your admin session has expired. Please sign in again.')
      }
      if (!response.ok) throw new Error(payload.error || 'Could not load submissions.')
      setItems(payload.items ?? [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load submissions.')
    } finally {
      setLoading(false)
    }
  }, [kind, session, supabase])

  useEffect(() => {
    void loadSubmissions()
  }, [loadSubmissions])

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    setError(null)
    const formData = new FormData(event.currentTarget)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: String(formData.get('email') || ''),
      password: String(formData.get('password') || ''),
    })
    if (signInError) setError(signInError.message)
  }

  async function updateStatus(item: Submission, status: string) {
    if (!session) return
    const previousStatus = item.status
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, status } : entry))
    const response = await authenticatedFetch(session, '/api/admin/submissions', {
      method: 'PATCH',
      body: JSON.stringify({ kind, id: item.id, status }),
    })
    if (!response.ok) {
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: previousStatus } : entry))
      setError('Could not update the submission status.')
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return

    const form = event.currentTarget
    const formData = new FormData(form)
    const password = String(formData.get('newPassword') || '')
    const confirmation = String(formData.get('confirmPassword') || '')

    setError(null)
    setPasswordMessage(null)

    if (password.length < 12) {
      setError('Your new password must contain at least 12 characters.')
      return
    }
    if (password !== confirmation) {
      setError('The new passwords do not match.')
      return
    }

    setChangingPassword(true)
    const { error: passwordError } = await supabase.auth.updateUser({ password })
    setChangingPassword(false)

    if (passwordError) {
      setError(passwordError.message)
      return
    }

    form.reset()
    setPasswordMessage('Your admin password has been changed.')
  }

  async function openCv(item: Submission) {
    if (!session || !item.cv_path) return
    const response = await authenticatedFetch(session, `/api/admin/cv?path=${encodeURIComponent(item.cv_path)}`)
    const payload = (await response.json()) as { url?: string; error?: string }
    if (!response.ok || !payload.url) {
      setError(payload.error || 'Could not open the CV.')
      return
    }
    window.open(payload.url, '_blank', 'noopener,noreferrer')
  }

  if (checkingSession) {
    return <section className="panel empty-state">Checking your admin session…</section>
  }

  if (!supabase) {
    return (
      <section className="panel compact-panel">
        <p className="eyebrow">Configuration required</p>
        <h1>Admin is not connected yet</h1>
        <p>Add the Supabase public URL and publishable key to the Vercel project environment.</p>
      </section>
    )
  }

  if (!session) {
    return (
      <section className="login-wrap">
        <form className="panel compact-panel login-form" onSubmit={signIn}>
          <p className="eyebrow">Restricted access</p>
          <h1>Website admin</h1>
          <p>Sign in with your authorised GI Healthcare account.</p>
          <div className="field">
            <label htmlFor="admin-email">Email address</label>
            <input autoComplete="email" id="admin-email" name="email" required type="email" />
          </div>
          <div className="field">
            <label htmlFor="admin-password">Password</label>
            <input autoComplete="current-password" id="admin-password" name="password" required type="password" />
          </div>
          <button className="button primary-button" type="submit">Sign in</button>
          {error && <p aria-live="polite" className="status-message error">{error}</p>}
        </form>
      </section>
    )
  }

  const statuses = kind === 'contact' ? contactStatuses : applicationStatuses

  return (
    <>
      <section className="admin-header-copy">
        <p className="eyebrow">Restricted access</p>
        <h1>Website inbox</h1>
        <p className="intro-copy">Review contact messages and job applications received through gihealthcare.co.uk.</p>
      </section>

      <div className="admin-toolbar">
        <div aria-label="Submission type" className="tab-list" role="tablist">
          <button className={`tab-button ${kind === 'contact' ? 'active' : ''}`} onClick={() => setKind('contact')} role="tab" type="button">Messages</button>
          <button className={`tab-button ${kind === 'application' ? 'active' : ''}`} onClick={() => setKind('application')} role="tab" type="button">Applications</button>
        </div>
        <div className="toolbar-actions">
          <button className="button secondary-button" disabled={loading} onClick={() => void loadSubmissions()} type="button">{loading ? 'Refreshing…' : 'Refresh'}</button>
          <button className="button secondary-button" onClick={() => void supabase.auth.signOut()} type="button">Sign out</button>
        </div>
      </div>

      {error && <p aria-live="polite" className="status-message error">{error}</p>}

      <details className="panel password-panel">
        <summary>Change admin password</summary>
        <form className="password-form" onSubmit={changePassword}>
          <p>Use at least 12 characters and keep this password private.</p>
          <div className="field-grid">
            <div className="field">
              <label htmlFor="new-admin-password">New password</label>
              <input autoComplete="new-password" id="new-admin-password" minLength={12} name="newPassword" required type="password" />
            </div>
            <div className="field">
              <label htmlFor="confirm-admin-password">Confirm new password</label>
              <input autoComplete="new-password" id="confirm-admin-password" minLength={12} name="confirmPassword" required type="password" />
            </div>
          </div>
          <button className="button primary-button" disabled={changingPassword} type="submit">
            {changingPassword ? 'Changing password…' : 'Change password'}
          </button>
          {passwordMessage && <p aria-live="polite" className="status-message success">{passwordMessage}</p>}
        </form>
      </details>

      <section className="submission-list">
        {!loading && items.length === 0 && <div className="panel empty-state">No {kind === 'contact' ? 'messages' : 'applications'} yet.</div>}
        {items.map((item) => (
          <article className="panel submission-card" key={item.id}>
            <div className="submission-card-top">
              <div>
                <h2>{item.name}</h2>
                <div className="submission-meta">
                  {item.job_title && <span>{item.job_title}</span>}
                  <a href={`mailto:${item.email}`}>{item.email}</a>
                  {item.phone && <a href={`tel:${item.phone}`}>{item.phone}</a>}
                  <time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString('en-GB')}</time>
                </div>
              </div>
              <span className="badge">{item.status.replaceAll('_', ' ')}</span>
            </div>
            <p className="submission-body">{item.message || item.cover_letter}</p>
            <div className="submission-actions">
              <label className="field-label" htmlFor={`status-${item.id}`}>Status</label>
              <select
                className="status-select"
                id={`status-${item.id}`}
                onChange={(event) => void updateStatus(item, event.target.value)}
                value={item.status}
              >
                {statuses.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
              </select>
              {item.cv_path && (
                <button className="button secondary-button" onClick={() => void openCv(item)} type="button">
                  Open {item.cv_original_name || 'CV'}
                </button>
              )}
            </div>
          </article>
        ))}
      </section>
    </>
  )
}
