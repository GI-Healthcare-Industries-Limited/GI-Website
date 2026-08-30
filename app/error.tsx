'use client'

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="shell centered-page">
      <section className="panel compact-panel">
        <p className="eyebrow">GI Healthcare</p>
        <h1>Something went wrong</h1>
        <p>Please try again. If the problem continues, contact info@gihealthcare.co.uk.</p>
        <button className="button primary-button" onClick={reset} type="button">Try again</button>
      </section>
    </main>
  )
}
