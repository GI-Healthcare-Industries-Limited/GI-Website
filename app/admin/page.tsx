import type { Metadata } from 'next'

import { AdminDashboard } from '@/app/admin/admin-dashboard'

export const metadata: Metadata = {
  title: 'Website Admin',
  robots: { index: false, follow: false },
}

export default function AdminPage() {
  return <AdminDashboard />
}
