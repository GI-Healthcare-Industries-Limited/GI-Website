import { ClockIcon, EnvelopeSimpleIcon, LinkedinLogoIcon, PhoneIcon, TrashIcon } from '@phosphor-icons/react'
import { normalizeLinkedInProfileUrl } from '@/lib/linkedin'
import styles from './submission-contact.module.css'

// Explicit term/value pairs keep labels and long contact details independent.
// No truncation: every character stays readable, including at mobile widths.
export function SubmissionContact({ email, phone, linkedInUrl, kind = 'contact', received, expires }: {
  email: string; phone: string | null; linkedInUrl?: string | null; kind?: 'contact' | 'application'; received: string; expires: string
}) {
  const profile = linkedInUrl ? normalizeLinkedInProfileUrl(linkedInUrl) : null
  return <dl className={styles.contact} aria-label="Submission contact details">
    <div><dt><EnvelopeSimpleIcon aria-hidden size={16} /> Email address</dt><dd><a href={`mailto:${email}`}>{email}</a></dd></div>
    {kind === 'application' && <div><dt><LinkedinLogoIcon aria-hidden size={16} /> LinkedIn profile</dt><dd>{profile ? <a href={profile} target="_blank" rel="noopener noreferrer">{profile}</a> : 'Not collected on the earlier form'}</dd></div>}
    {(kind === 'contact' || phone) && <div><dt><PhoneIcon aria-hidden size={16} /> {kind === 'application' ? 'Phone number (earlier application)' : 'Phone number'}</dt><dd>{phone ? <a href={`tel:${phone}`}>{phone}</a> : 'Not provided'}</dd></div>}
    <div><dt><ClockIcon aria-hidden size={16} /> Received</dt><dd>{received}</dd></div>
    <div><dt><TrashIcon aria-hidden size={16} /> Automatically deleted by</dt><dd>{expires}</dd></div>
  </dl>
}
