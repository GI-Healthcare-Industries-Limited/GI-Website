import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="shell centered-page">
      <section className="panel compact-panel">
        <p className="eyebrow">GI Healthcare</p>
        <h1>Page not found</h1>
        <p>The page you requested does not exist.</p>
        <Link className="button primary-button" href="/">Return to the website</Link>
      </section>
    </main>
  )
}
