import 'server-only'

type NotificationDetails = {
  subject: string
  heading: string
  lines: Array<{ label: string; value: string }>
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export async function sendSubmissionNotification(details: NotificationDetails) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  const recipient = process.env.CONTACT_NOTIFICATION_EMAIL || 'ash@gihealthcare.co.uk'
  const from = process.env.RESEND_FROM_EMAIL || 'GI Healthcare Website <website@gihealthcare.co.uk>'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.gihealthcare.co.uk'
  const rows = details.lines
    .map(({ label, value }) => `<tr><th align="left" style="padding:6px 12px 6px 0">${escapeHtml(label)}</th><td style="padding:6px 0;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`)
    .join('')

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      subject: details.subject,
      html: `<h2>${escapeHtml(details.heading)}</h2><table>${rows}</table><p><a href="${escapeHtml(`${siteUrl}/admin`)}">Open the GI Healthcare admin dashboard</a></p>`,
    }),
  })

  if (!response.ok) {
    throw new Error(`Resend notification failed with status ${response.status}`)
  }
}
