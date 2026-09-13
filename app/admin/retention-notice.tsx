'use client'

import type { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

export function RetentionNotice({ session }: { session: Session }) {
  const [status, setStatus] = useState<{ healthy: boolean; lastSuccessAt?: string } | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    const refresh = async () => {
      try {
        const response = await fetch('/api/admin/retention', { headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store', signal: controller.signal })
        const data = await response.json()
        if (!controller.signal.aborted) setStatus(response.ok ? data : { healthy: false })
      } catch { if (!controller.signal.aborted) setStatus({ healthy: false }) }
    }
    void refresh()
    const interval = window.setInterval(refresh, 60_000)
    return () => { controller.abort(); window.clearInterval(interval) }
  }, [session.access_token])
  return <aside className="admin-retention-copy" role="status">
    <strong>Automatic deletion · Three calendar months</strong>
    <p>Applies to messages and applications, including archived and hired. Status changes do not extend retention. Avoid downloads or email copies; those are not automatically removed by this portal.</p>
    <p>{status === null ? 'Checking the deletion scheduler…' : status.healthy
      ? `Deletion job running. Last success: ${new Date(status.lastSuccessAt!).toLocaleString('en-GB')}.`
      : 'Attention: automatic deletion is delayed or could not be verified. Check Supabase → Cron before relying on the scheduler.'}</p>
  </aside>
}
