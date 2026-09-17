import { z } from 'zod'

export const ANALYTICS_CONSENT_VERSION = 'gi-analytics-v2'
export const analyticsPages = ['home', 'space', 'careers', 'contact', 'apply', 'privacy'] as const
export const analyticsEventSchema = z.object({
  id: z.uuid(), page: z.enum(analyticsPages), seconds: z.number().int().min(0).max(1800),
  clicks: z.number().int().min(0).max(100),
  source: z.enum(['Direct', 'Search', 'Social', 'Other']),
  consentAt: z.number().int().positive(), version: z.literal(ANALYTICS_CONSENT_VERSION),
}).strict()

export function analyticsConsent(cookie: string | null, consentAt: number, now = Date.now()) {
  try {
    const value = cookie?.split(';').map(v=>v.trim()).find(v=>v.startsWith('gi_privacy='))?.slice(11)
    const c = JSON.parse(decodeURIComponent(value || ''))
    return c.v === ANALYTICS_CONSENT_VERSION && c.analytics === true && c.at === consentAt && c.at <= now && now - c.at < 180 * 86400000
  } catch { return false }
}

export function coarseClient(userAgent: string) {
  const ua = userAgent.slice(0, 1000)
  return {
    device: /iPad|Tablet/i.test(ua) || /Android/i.test(ua) && !/Mobile/i.test(ua) ? 'Tablet' : /Mobile|Android|iPhone/i.test(ua) ? 'Mobile' : 'Desktop',
    browser: /Edg(e|A|iOS)?\//.test(ua) ? 'Edge' : /Firefox\/|FxiOS\//.test(ua) ? 'Firefox' : /OPR\/|Opera|SamsungBrowser\//.test(ua) ? 'Other' : /Chrome\/|CriOS\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Other',
    os: /iPad|iPhone|iPod/i.test(ua) ? 'iOS' : /Android/i.test(ua) ? 'Android' : /CrOS/i.test(ua) ? 'ChromeOS' : /Windows/i.test(ua) ? 'Windows' : /Macintosh|Mac OS X/i.test(ua) ? 'macOS' : /Linux/i.test(ua) ? 'Linux' : 'Other',
  }
}

const regions = new Intl.DisplayNames(['en'], { type: 'region' })
export function coarseLocation(headers: Headers) {
  const code = headers.get('x-vercel-ip-country') || 'ZZ'
  const country = /^[A-Z]{2}$/.test(code) && regions.of(code) !== code ? code : 'ZZ'
  if (country === 'ZZ') return { country, region: null, city: null }
  const regionCode = headers.get('x-vercel-ip-country-region') || ''
  const region = /^[A-Z0-9]{1,3}$/.test(regionCode) ? regionCode : null
  let city: string | null = null
  try {
    const raw = headers.get('x-vercel-ip-city') || ''
    const decoded = raw.length <= 360 ? decodeURIComponent(raw).normalize('NFC').trim() : ''
    // City names only, not HTML, control characters, URLs or arbitrary metadata.
    if (decoded.length <= 120 && /^[\p{L}\p{M}][\p{L}\p{M}\p{N} .’'()\-]*$/u.test(decoded)) city = decoded
  } catch { /* Malformed or unavailable geolocation remains unknown. */ }
  return { country, region, city }
}

export const analyticsReportQuerySchema = z.object({
  days: z.enum(['7', '14', '30']).default('7'),
  page: z.enum(['all', ...analyticsPages]).default('all'),
  offset: z.coerce.number().int().min(0).max(100000).default(0),
  before: z.iso.datetime({ offset: true }).optional(),
}).strict()
