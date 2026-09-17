// Version of the notice presented by both public forms. This records provision
// of information, not consent, agreement to processing, or proof it was read.
export const PRIVACY_NOTICE_VERSION = '2026-09-14'
// Website-wide notice, including optional analytics; historical form versions stay immutable.
export const WEBSITE_PRIVACY_NOTICE_VERSION = '2026-09-17-website-v2'
// Recruitment-specific addendum. Contact clients keep the base notice version.
export const APPLICATION_PRIVACY_NOTICE_VERSION = '2026-09-16-applications-v7'

// Separate from the notice version and the processing bases in that notice.
// Keep each statement version immutable so recorded confirmations are traceable.
export const APPLICATION_DATA_SHARING_VERSION = 'recruitment-data-sharing-v2'
export const APPLICATION_DATA_SHARING_STATEMENT = 'I agree to GI Healthcare using my information to assess my application and contact me, as described in the privacy notice.'

export function isWithinRetention(expiresAt: string, now = Date.now()) {
  const expiry = Date.parse(expiresAt)
  return Number.isFinite(expiry) && expiry > now
}
