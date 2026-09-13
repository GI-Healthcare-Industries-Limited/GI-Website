import 'server-only'

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

// Deliberately cannot accept a name, address, message, role, record ID or URL
// supplied by an applicant. Email is an alert, never a copy of the submission.
export async function sendSubmissionNotification(kind: 'application' | 'contact') {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  const recipient = process.env.CONTACT_NOTIFICATION_EMAIL || 'ash@gihealthcare.co.uk'
  const from = process.env.RESEND_FROM_EMAIL || 'GI Healthcare Website <website@gihealthcare.co.uk>'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.gihealthcare.co.uk'
  const subject = kind === 'application' ? 'New website application' : 'New website enquiry'

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      subject,
      html: `<h2>${subject}</h2><p>A new submission is available in your private inbox. Submissions are automatically deleted within three calendar months.</p><p><a href="${escapeHtml(`${siteUrl}/admin`)}">Open the GI Healthcare admin dashboard</a></p>`,
    }),
  })

  if (!response.ok) {
    throw new Error(`Resend notification failed with status ${response.status}`)
  }
}
