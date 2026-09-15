export const LINKEDIN_PROFILE_ERROR = 'Please enter your LinkedIn profile URL, for example https://www.linkedin.com/in/your-name.'

// Validate only the supplied URL; do not fetch LinkedIn or embed a profile.
// Drop tracking parameters and normalise regional hosts before storage.
export function normalizeLinkedInProfileUrl(value: string): string | null {
  if (value.length > 2048 || !/^https:\/\/[^\s\\]+$/iu.test(value)) return null
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null
    if (!/^(?:(?:www|[a-z]{2})\.)?linkedin\.com$/i.test(url.hostname)) return null
    const match = /^\/in\/([^/]+)\/?$/.exec(url.pathname)
    if (!match) return null
    const profile = decodeURIComponent(match[1])
    if (!/^[\p{L}\p{N}_-]+$/u.test(profile)) return null
    const normalized = `https://www.linkedin.com/in/${encodeURIComponent(profile)}/`
    return normalized.length <= 2048 ? normalized : null
  } catch { return null }
}
