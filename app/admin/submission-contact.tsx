import { ClockIcon, EnvelopeSimpleIcon, PhoneIcon, TrashIcon } from '@phosphor-icons/react'
import styles from './submission-contact.module.css'

// Explicit term/value pairs keep labels and long contact details independent.
// No truncation: every character stays readable, including at mobile widths.
export function SubmissionContact({ email, phone, received, expires }: {
  email: string; phone: string | null; received: string; expires: string
}) {
  return <dl className={styles.contact} aria-label="Submission contact details">
    <div><dt><EnvelopeSimpleIcon aria-hidden size={16} /> Email address</dt><dd><a href={`mailto:${email}`}>{email}</a></dd></div>
    <div><dt><PhoneIcon aria-hidden size={16} /> Phone number</dt><dd>{phone ? <a href={`tel:${phone}`}>{phone}</a> : 'Not provided'}</dd></div>
    <div><dt><ClockIcon aria-hidden size={16} /> Received</dt><dd>{received}</dd></div>
    <div><dt><TrashIcon aria-hidden size={16} /> Automatically deleted by</dt><dd>{expires}</dd></div>
  </dl>
}
