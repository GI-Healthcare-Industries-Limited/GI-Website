import { z } from 'zod'

export const ANALYTICS_CONSENT_VERSION = 'gi-analytics-v1'
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
  return {
    device: /iPad|Tablet/i.test(userAgent) ? 'Tablet' : /Mobile|Android/i.test(userAgent) ? 'Mobile' : 'Desktop',
    browser: /Edg\//.test(userAgent) ? 'Edge' : /Firefox\//.test(userAgent) ? 'Firefox' : /Chrome\//.test(userAgent) ? 'Chrome' : /Safari\//.test(userAgent) ? 'Safari' : 'Other',
  }
}
