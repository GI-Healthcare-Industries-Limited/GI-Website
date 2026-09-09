'use client'

import {
  ArrowSquareOutIcon,
  ArrowsClockwiseIcon,
  BriefcaseIcon,
  CaretDownIcon,
  CheckCircleIcon,
  ClockIcon,
  EnvelopeSimpleIcon,
  FolderOpenIcon,
  LinkSimpleIcon,
  LockKeyIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  SignOutIcon,
  TrashIcon,
  UserCircleIcon,
  UsersThreeIcon,
} from '@phosphor-icons/react'
import type { Session } from '@supabase/supabase-js'
import Image from 'next/image'
import Link from 'next/link'
import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'

import { applicationStatuses, contactStatuses } from '@/lib/submission-constants'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import { AdminLogin } from '@/app/admin/admin-login'
import logo from '@/assets/brand/gi-healthcare-logo.png'

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
  portfolio_url?: string | null
  project_summary?: string | null
  right_to_work?: boolean | null
  cover_letter?: string | null
  cv_path?: string | null
  cv_original_name?: string | null
}

const statusLabels: Record<string, string> = {
  new: 'New',
  in_progress: 'In progress',
  resolved: 'Resolved',
  reviewing: 'Reviewing',
  interview: 'Interview',
  rejected: 'Rejected',
  hired: 'Hired',
  archived: 'Archived',
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function formatDate(value: string) {
  return dateFormatter.format(new Date(value))
}

function getSubmissionPreview(item: Submission) {
  return item.message || item.project_summary || item.cover_letter || 'No written details supplied.'
}

function SubmissionStatus({ status }: { status: string }) {
  return <span className={`admin-status admin-status-${status}`}>{statusLabels[status] || status}</span>
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
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [changingPassword, setChangingPassword] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setCheckingSession(false)
      return
    }

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      setSession(data.session)
      if (sessionError) setError('Your sign-in link may have expired. Please request a new password reset link or sign in again.')
      setCheckingSession(false)
    }).catch(() => {
      setError('Could not check your session. Please try signing in again.')
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
      const params = new URLSearchParams({ kind })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const response = await authenticatedFetch(session, `/api/admin/submissions?${params}`)
      const payload = (await response.json()) as { items?: Submission[]; error?: string }
      if (response.status === 401) {
        await supabase?.auth.signOut()
        throw new Error('Your admin session has expired. Please sign in again.')
      }
      if (!response.ok) throw new Error(payload.error || 'Could not load submissions.')
      const nextItems = payload.items ?? []
      setItems(nextItems)
      setSelectedId((current) => nextItems.some((item) => item.id === current) ? current : nextItems[0]?.id ?? null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load submissions.')
    } finally {
      setLoading(false)
    }
  }, [kind, session, statusFilter, supabase])

  useEffect(() => {
    void loadSubmissions()
  }, [loadSubmissions])

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return items
    return items.filter((item) => [
      item.name,
      item.email,
      item.job_title,
      item.message,
      item.project_summary,
      item.cover_letter,
    ].some((value) => value?.toLowerCase().includes(query)))
  }, [items, searchQuery])

  const selectedItem = filteredItems.find((item) => item.id === selectedId) ?? filteredItems[0] ?? null

  function changeKind(nextKind: Kind) {
    setKind(nextKind)
    setStatusFilter('all')
    setSearchQuery('')
    setSelectedId(null)
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

  async function deleteSubmission(item: Submission) {
    if (!session) return

    const itemLabel = kind === 'contact' ? 'message' : 'application'
    if (!window.confirm(`Permanently delete this ${itemLabel} from ${item.name}? This cannot be undone.`)) return

    setDeletingId(item.id)
    setError(null)
    try {
      const response = await authenticatedFetch(session, '/api/admin/submissions', {
        method: 'DELETE',
        body: JSON.stringify({ kind, id: item.id }),
      })
      const payload = (await response.json()) as { error?: string }

      if (response.status === 401) {
        await supabase?.auth.signOut()
        throw new Error('Your admin session has expired. Please sign in again.')
      }
      if (!response.ok) throw new Error(payload.error || `Could not delete the ${itemLabel}.`)

      setItems((current) => {
        const remaining = current.filter((entry) => entry.id !== item.id)
        setSelectedId(remaining[0]?.id ?? null)
        return remaining
      })
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : `Could not delete the ${itemLabel}.`)
    } finally {
      setDeletingId(null)
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
      setError(payload.error || 'Could not open the legacy CV.')
      return
    }
    window.open(payload.url, '_blank', 'noopener,noreferrer')
  }

  if (checkingSession || !supabase || !session) {
    return (
      <AdminLogin checkingSession={checkingSession} sessionError={error} supabase={supabase} />
    )
  }

  const statuses = kind === 'contact' ? contactStatuses : applicationStatuses

  return (
    <main className="admin-console">
      <aside className="admin-sidebar">
        <Link className="admin-orbit-brand" href="/">
          <Image alt="GI Healthcare" height={58} src={logo} width={200} />
        </Link>

        <nav aria-label="Website inbox">
          <p>Inbox</p>
          <button aria-current={kind === 'contact' ? 'page' : undefined} onClick={() => changeKind('contact')} type="button">
            <EnvelopeSimpleIcon aria-hidden size={21} /> Messages
          </button>
          <button aria-current={kind === 'application' ? 'page' : undefined} onClick={() => changeKind('application')} type="button">
            <UsersThreeIcon aria-hidden size={21} /> Applications
          </button>
        </nav>

        <div className="admin-account">
          <span className="admin-account-avatar"><UserCircleIcon aria-hidden size={32} weight="fill" /></span>
          <span><strong>Ash</strong><small>Website admin</small></span>
          <button aria-label="Sign out" onClick={() => void supabase.auth.signOut()} type="button"><SignOutIcon aria-hidden size={20} /></button>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-main-header">
          <div>
            <p className="section-index">GI Healthcare website</p>
            <h1>{kind === 'contact' ? 'Messages' : 'Applications'}</h1>
            <p>{kind === 'contact' ? 'Conversations started through the contact page.' : 'Portfolio-first candidates ready for review.'}</p>
          </div>
          <button className="admin-refresh-button" disabled={loading} onClick={() => void loadSubmissions()} type="button">
            <ArrowsClockwiseIcon aria-hidden size={19} /> {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </header>

        {error && <p aria-live="polite" className="application-status error admin-error">{error}</p>}

        <div className="admin-filters">
          <label className="admin-search">
            <MagnifyingGlassIcon aria-hidden size={19} />
            <span className="sr-only">Search submissions</span>
            <input onChange={(event) => setSearchQuery(event.target.value)} placeholder={`Search ${kind === 'contact' ? 'messages' : 'applications'}`} type="search" value={searchQuery} />
          </label>
          <label className="admin-filter-select">
            <span className="sr-only">Filter by status</span>
            <select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
              <option value="all">All statuses</option>
              {statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
            </select>
            <CaretDownIcon aria-hidden size={16} />
          </label>
        </div>

        <div className="admin-inbox">
          <section aria-label={`${kind} list`} className="admin-submission-list">
            {loading && items.length === 0 ? (
              <p className="admin-empty">Loading…</p>
            ) : filteredItems.length === 0 ? (
              <p className="admin-empty">No {kind === 'contact' ? 'messages' : 'applications'} match this view.</p>
            ) : filteredItems.map((item) => (
              <button
                className={selectedItem?.id === item.id ? 'selected' : ''}
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                type="button"
              >
                <span className="admin-list-topline">
                  <strong>{item.name}</strong>
                  <time dateTime={item.created_at}>{formatDate(item.created_at)}</time>
                </span>
                <span className="admin-list-subject">{item.job_title || item.email}</span>
                <span className="admin-list-preview">{getSubmissionPreview(item)}</span>
                <SubmissionStatus status={item.status} />
              </button>
            ))}
          </section>

          <section aria-live="polite" className="admin-detail">
            {!selectedItem ? (
              <div className="admin-detail-empty">
                <FolderOpenIcon aria-hidden size={34} />
                <strong>Select an item to review it.</strong>
              </div>
            ) : (
              <>
                <header className="admin-detail-header">
                  <div>
                    <SubmissionStatus status={selectedItem.status} />
                    <h2>{selectedItem.name}</h2>
                    <p>{selectedItem.job_title || 'Website enquiry'}</p>
                  </div>
                  <div className="admin-detail-actions">
                    <label className="admin-status-select">
                      <span>Status</span>
                      <select disabled={deletingId === selectedItem.id} onChange={(event) => void updateStatus(selectedItem, event.target.value)} value={selectedItem.status}>
                        {statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
                      </select>
                    </label>
                    <button
                      className="admin-delete-button"
                      disabled={deletingId === selectedItem.id}
                      onClick={() => void deleteSubmission(selectedItem)}
                      type="button"
                    >
                      <TrashIcon aria-hidden size={18} />
                      {deletingId === selectedItem.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </header>

                <div className="admin-contact-grid">
                  <a href={`mailto:${selectedItem.email}`}><EnvelopeSimpleIcon aria-hidden size={19} /><span><small>Email</small>{selectedItem.email}</span></a>
                  {selectedItem.phone ? (
                    <a href={`tel:${selectedItem.phone}`}><PhoneIcon aria-hidden size={19} /><span><small>Phone</small>{selectedItem.phone}</span></a>
                  ) : (
                    <span><PhoneIcon aria-hidden size={19} /><span><small>Phone</small>Not provided</span></span>
                  )}
                  <span><ClockIcon aria-hidden size={19} /><span><small>Received</small>{formatDate(selectedItem.created_at)}</span></span>
                </div>

                {kind === 'application' && (
                  <div className="admin-application-facts">
                    <span><BriefcaseIcon aria-hidden size={20} /><span><small>Role</small>{selectedItem.job_title}</span></span>
                    <span><CheckCircleIcon aria-hidden size={20} weight="fill" /><span><small>UK right to work</small>{selectedItem.right_to_work ? 'Confirmed' : 'Legacy application — not recorded'}</span></span>
                  </div>
                )}

                <article className="admin-message-body">
                  <p className="section-index">{kind === 'contact' ? 'Message' : 'Project highlight'}</p>
                  <p>{getSubmissionPreview(selectedItem)}</p>
                </article>

                {kind === 'application' && (
                  <div className="admin-portfolio-actions">
                    {selectedItem.portfolio_url && (
                      <a href={selectedItem.portfolio_url} rel="noreferrer" target="_blank">
                        <LinkSimpleIcon aria-hidden size={20} /> Open portfolio <ArrowSquareOutIcon aria-hidden size={17} />
                      </a>
                    )}
                    {selectedItem.cv_path && (
                      <button onClick={() => void openCv(selectedItem)} type="button">
                        <FolderOpenIcon aria-hidden size={20} /> Open legacy {selectedItem.cv_original_name || 'CV'}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        </div>

        <details className="admin-account-settings">
          <summary><LockKeyIcon aria-hidden size={19} /> Change admin password</summary>
          <form onSubmit={changePassword}>
            <p>Use at least 12 characters and keep this password private.</p>
            <div className="admin-password-fields">
              <div className="application-field">
                <label htmlFor="new-admin-password">New password</label>
                <input autoComplete="new-password" id="new-admin-password" minLength={12} name="newPassword" required type="password" />
              </div>
              <div className="application-field">
                <label htmlFor="confirm-admin-password">Confirm new password</label>
                <input autoComplete="new-password" id="confirm-admin-password" minLength={12} name="confirmPassword" required type="password" />
              </div>
            </div>
            <button className="admin-sign-in-button" disabled={changingPassword} type="submit">
              {changingPassword ? 'Changing password…' : 'Change password'}
            </button>
            {passwordMessage && <p aria-live="polite" className="application-status success">{passwordMessage}</p>}
          </form>
        </details>
      </section>
    </main>
  )
}
