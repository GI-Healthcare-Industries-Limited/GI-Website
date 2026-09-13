'use client'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let browserClient: SupabaseClient | undefined

export function clearStoredAdminSession() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url || typeof window === 'undefined') return
  const key = `sb-${new URL(url).hostname.split('.')[0]}-auth-token`
  try { window.sessionStorage.removeItem(key) } catch { /* Storage unavailable. */ }
  try { window.localStorage.removeItem(key) } catch { /* Storage unavailable. */ }
}

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !publishableKey || typeof window === 'undefined') return null

  // Retire this app's previous persistent token without touching unrelated keys.
  const storageKey = `sb-${new URL(url).hostname.split('.')[0]}-auth-token`
  try { window.localStorage.removeItem(storageKey) } catch { /* Storage may be disabled. */ }
  let storage: Storage | undefined
  try { storage = window.sessionStorage } catch { /* Use memory only if browser storage is unavailable. */ }
  browserClient = createClient(url, publishableKey, {
    auth: { storage, storageKey, persistSession: Boolean(storage) },
  })
  return browserClient
}
