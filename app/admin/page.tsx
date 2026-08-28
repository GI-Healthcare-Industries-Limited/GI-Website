import type { Metadata } from 'next'

import { SiteHeader } from '@/app/_components/site-header'
import { AdminDashboard } from '@/app/admin/admin-dashboard'

export const metadata: Metadata = {
  title: 'Website Admin',
  robots: { index: false, follow: false },
}

export default function AdminPage() {
  return (
    <main className="shell admin-page">
      <SiteHeader />
      <AdminDashboard />
    </main>
  )
}
