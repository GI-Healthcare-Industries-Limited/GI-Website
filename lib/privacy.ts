// Version of the notice presented by both public forms. This records provision
// of information, not consent, agreement to processing, or proof it was read.
export const PRIVACY_NOTICE_VERSION = '2026-09-14'

export function isWithinRetention(expiresAt: string, now = Date.now()) {
  const expiry = Date.parse(expiresAt)
  return Number.isFinite(expiry) && expiry > now
}
