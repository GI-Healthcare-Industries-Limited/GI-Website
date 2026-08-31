import type { Metadata } from 'next'

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
    : 'Embedded Systems Engineer'

  return <ApplyForm initialRole={initialRole} />
}
