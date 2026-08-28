import type { Metadata } from 'next'

import { SiteHeader } from '@/app/_components/site-header'
import { ApplyForm } from '@/app/apply/apply-form'
import { JOB_TITLES } from '@/lib/submission-constants'

export const metadata: Metadata = {
  title: 'Apply',
  description: 'Apply for a role at GI Healthcare.',
}

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>
}) {
  const { role } = await searchParams
  const initialRole = JOB_TITLES.includes(role as (typeof JOB_TITLES)[number])
    ? (role as (typeof JOB_TITLES)[number])
    : 'General Application'

  return (
    <main className="shell">
      <SiteHeader />
      <div className="page-grid">
        <section className="intro">
          <p className="eyebrow">Careers at GI Healthcare</p>
          <h1>Build what comes next.</h1>
          <p className="intro-copy">
            Tell us about yourself and attach your CV. Your application stays on this website,
            is stored securely, and can only be reviewed by authorised GI Healthcare staff.
          </p>
        </section>
        <ApplyForm initialRole={initialRole} />
      </div>
    </main>
  )
}
