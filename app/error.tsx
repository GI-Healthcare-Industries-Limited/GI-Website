'use client'

import Link from 'next/link'

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="shell centered-page">
      <section className="panel compact-panel">
        <p className="eyebrow">GI Healthcare</p>
        <h1>Something went wrong</h1>
        <p>Please try again. For help, use our <Link href="/contact">contact form</Link>.</p>
        <button className="button primary-button" onClick={reset} type="button">Try again</button>
      </section>
    </main>
  )
}
