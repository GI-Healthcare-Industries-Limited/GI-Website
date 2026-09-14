import type { Metadata } from 'next'

import { ApplyForm } from '@/app/apply/apply-form'
import { getCareerOpenings } from '@/lib/career-openings'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Apply',
  description: 'Apply for a role at GI Healthcare.',
}

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string; role?: string }>
}) {
  const { job, role } = await searchParams
  const openings = await getCareerOpenings().catch(() => {
    console.error('Application page availability failed')
    return null
  })
  return <ApplyForm requestedJob={typeof job === 'string' ? job : ''} requestedTitle={typeof role === 'string' ? role : ''} initialOpenings={openings} />
}
