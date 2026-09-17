'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { ArrowRightIcon, ArrowsClockwiseIcon, CalendarBlankIcon, CaretLeftIcon, CaretRightIcon, ChartBarIcon, ClockIcon, CursorClickIcon, GlobeHemisphereWestIcon, XIcon } from '@phosphor-icons/react'
import { countryName, dailySeries, duration, formatNumber, pageLabels, regionName, type AnalyticsGroup, type AnalyticsPage, type AnalyticsReport, type PageView } from '@/lib/analytics-report'
import { ActivityChart, LocationMap } from './analytics-charts'
import styles from './website-analytics.module.css'

const timestamp = (date: string) => new Date(date).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' })
type Filters = { days: number; page: AnalyticsPage; offset: number; before?: string; revision: number }

function ViewDetails({ view, onClose }: { view: PageView; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    dialog.current?.showModal()
    return () => { if (previous?.isConnected) previous.focus() }
  }, [])
  const facts = [
    ['Page', pageLabels[view.page]], ['Received', `${timestamp(view.created_at)} · UK time`],
    ['Estimated city', view.city || 'Not available'], ['Region', regionName(view.country, view.region)], ['Country', countryName(view.country)],
    ['Device', view.device], ['Browser', view.browser], ['Operating system', view.os || 'Not collected'],
    ['Referral category', view.source], ['Active time', duration(view.seconds)], ['Navigation clicks', formatNumber(view.clicks)],
  ]
  return <dialog className={styles.detailDialog} ref={dialog} aria-labelledby="view-detail-title" onCancel={onClose} onClose={onClose}>
    <header><div><p>Individual page view</p><h2 id="view-detail-title">A closer look.</h2></div><button type="button" onClick={onClose} aria-label="Close page-view details"><XIcon size={22}/></button></header>
    <dl>{facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <p className={styles.detailNote}>This is one page view, not an identified person or their browsing history. Locations and device categories are estimates. Older records may not include all fields.</p>
  </dialog>
}

function Breakdown({ title, rows, total }: { title: string; rows: AnalyticsGroup[]; total: number }) {
  return <section><h3>{title}</h3>{rows.length ? rows.map(row => <div className={styles.breakdownRow} key={row.label}><span>{row.label}</span><strong>{formatNumber(row.views)}</strong><progress max={total || 1} value={row.views} aria-label={`${row.label}: ${row.views} page views`}/></div>) : <p>No data in this period.</p>}</section>
}

export function WebsiteAnalytics({ session }: { session: Session }) {
  const [filters, setFilters] = useState<Filters>({ days: 7, page: 'all', offset: 0, revision: 0 })
  const [data, setData] = useState<AnalyticsReport | null>(null), [busy, setBusy] = useState(true), [error, setError] = useState('')
  const [selected, setSelected] = useState<PageView | null>(null), [locationMode, setLocationMode] = useState<'city' | 'country'>('city')
  const breakdowns = useRef<HTMLDetailsElement>(null)
  const refresh = () => { setSelected(null); setFilters(f => ({ ...f, offset: 0, before: undefined, revision: f.revision + 1 })) }
  useEffect(() => {
    const controller = new AbortController(); setBusy(true); setError(''); setData(null); setSelected(null)
    const query = new URLSearchParams({ days: String(filters.days), page: filters.page, offset: String(filters.offset) })
    if (filters.before) query.set('before', filters.before)
    fetch(`/api/admin/analytics?${query}`, { headers: { Authorization: `Bearer ${session.access_token}` }, signal: controller.signal, cache: 'no-store' }).then(async response => {
      const report = await response.json()
      if (!response.ok) throw new Error(response.status === 401 ? 'Please sign in again to view analytics.' : report.error || 'Could not load analytics.')
      return report as AnalyticsReport
    }).then(report => { if (!controller.signal.aborted) setData(report) }).catch(e => { if (!controller.signal.aborted) setError(e.message) }).finally(() => { if (!controller.signal.aborted) setBusy(false) })
    return () => controller.abort()
  }, [filters, session.access_token])
  const points = useMemo(() => data ? dailySeries(data, filters.days) : [], [data, filters.days])
  const pageTitle = pageLabels[filters.page]
  const locations = data ? locationMode === 'country'
    ? data.countries.map(row => ({ label: countryName(row.label), secondary: '', views: row.views, key: row.label }))
    : data.cities.map(row => ({ label: row.city || 'City unavailable', secondary: countryName(row.country), views: row.views, key: `${row.country}/${row.region}/${row.city}` })) : []
  const otherLocations = data ? data.totals.views - locations.reduce((sum, row) => sum + row.views, 0) : 0
  function choosePage(page: AnalyticsPage) { setFilters(f => ({ ...f, page, offset: 0, before: undefined })) }
  function moreDetails() { if (breakdowns.current) { breakdowns.current.open = true; breakdowns.current.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }) } }

  return <div className={styles.analytics}>
    <div className={styles.toolbar}><span><GlobeHemisphereWestIcon size={18} aria-hidden/>gihealthcare.co.uk</span><div><label className={styles.period}><CalendarBlankIcon size={18} aria-hidden/><span className="sr-only">Analytics period</span><select id="analytics-period" value={filters.days} onChange={e => setFilters(f => ({ ...f, days: Number(e.target.value), offset: 0, before: undefined }))}><option value={7}>Last 7 days</option><option value={14}>Last 14 days</option><option value={30}>Last 30 days</option></select></label><button className={styles.iconButton} type="button" onClick={refresh} disabled={busy} aria-label="Refresh analytics"><ArrowsClockwiseIcon size={18} aria-hidden/></button></div></div>
    <nav className={styles.pageTabs} aria-label="Filter analytics by page">{Object.entries(pageLabels).map(([page, label]) => <button type="button" key={page} aria-pressed={filters.page === page} onClick={() => choosePage(page as AnalyticsPage)}>{label}</button>)}</nav>
    {busy && <div className={styles.loading} role="status">Loading page activity…</div>}
    {error && <div className={styles.notice} role="alert"><p>{error}</p><button type="button" onClick={refresh}>Try again</button></div>}
    {data && <>
      <div className={styles.overview}><div className={styles.pageHeading}><h2>{pageTitle}</h2><p>{filters.page === 'all' ? 'A view across your website.' : 'Understand how this page is performing.'}</p></div><dl className={styles.metrics}>
        <div><ChartBarIcon size={25} aria-hidden/><dd>{formatNumber(data.totals.views)}</dd><dt>Page views</dt></div>
        <div><ClockIcon size={25} aria-hidden/><dd>{duration(data.totals.average_seconds)}</dd><dt>Avg. active time</dt></div>
        <div><CursorClickIcon size={25} aria-hidden/><dd>{formatNumber(data.totals.clicks)}</dd><dt>Navigation clicks</dt></div>
      </dl></div>
      <div className={styles.visuals}>
        <section className={styles.panel}><h3>Page activity</h3><p className={styles.subtitle}>Daily page views{filters.page === 'all' ? '' : ` for ${pageTitle}`} · UTC</p>
          {data.totals.views ? <ActivityChart points={points}/> : <div className={styles.empty}><ChartBarIcon size={28} aria-hidden/><h4>No page views yet.</h4><p>Visits appear after people accept analytics. Try another page or date range.</p></div>}
          <details className={styles.dailyFigures}><summary>View daily figures</summary><table><thead><tr><th>Date (UTC)</th><th>Page views</th></tr></thead><tbody>{points.map(row => <tr key={row.day}><td>{row.day}</td><td>{formatNumber(row.views)}</td></tr>)}</tbody></table></details>
        </section>
        <section className={styles.panel}><h3>Where views came from</h3><p className={styles.subtitle}>Approximate locations</p><div className={styles.locations}>
          <div className={styles.map}><LocationMap countries={data.countries}/><p>Map circles group views by country.</p></div>
          <div className={styles.locationRanking}><div className={styles.locationToggle} aria-label="Location breakdown"><button type="button" aria-pressed={locationMode === 'city'} onClick={() => setLocationMode('city')}>Cities</button><button type="button" aria-pressed={locationMode === 'country'} onClick={() => setLocationMode('country')}>Countries</button></div><div className={styles.locationRows}>
            {locations.length ? locations.map(row => <div key={row.key}><span>{row.label}{row.secondary && <small>{row.secondary}</small>}</span><strong>{formatNumber(row.views)}</strong></div>) : <p>No location data yet.</p>}
            {otherLocations > 0 && <div><span>Other locations</span><strong>{formatNumber(otherLocations)}</strong></div>}
          </div></div></div>
        </section>
      </div>
      <section className={`${styles.panel} ${styles.visits}`} aria-labelledby="page-views-heading"><div className={styles.sectionHeading}><div><h3 id="page-views-heading">Individual page views</h3><p className={styles.subtitle}>Latest page views{filters.page === 'all' ? '' : ` for ${pageTitle}`}. Select a row to view full details.</p></div><button className={styles.textButton} type="button" onClick={moreDetails}>Devices &amp; browsers <ArrowRightIcon size={17} aria-hidden/></button></div>
        <div className={styles.tableScroll} role="region" aria-label="Individual page views table" tabIndex={0}><table><thead><tr><th scope="col">Time <small>(UK)</small></th>{filters.page === 'all' && <th scope="col">Page</th>}<th scope="col">Estimated city</th><th scope="col">Device / browser</th><th scope="col">Active time</th><th scope="col">Clicks</th><th scope="col"><span className="sr-only">Details</span></th></tr></thead><tbody>{data.records.map(view => <tr key={view.id} onClick={event => { event.currentTarget.querySelector('button')?.focus(); setSelected(view) }}>
          <td><button type="button" className={styles.rowLink} onClick={() => setSelected(view)} aria-label={`View ${pageLabels[view.page]} page view from ${timestamp(view.created_at)}`}>{timestamp(view.created_at)}</button></td>
          {filters.page === 'all' && <td>{pageLabels[view.page]}</td>}<td>{view.city || 'Not available'}<small>{countryName(view.country)}</small></td><td>{view.device} <span aria-hidden>·</span> {view.browser}</td><td>{duration(view.seconds)}</td><td>{view.clicks}</td><td><CaretRightIcon size={16} aria-hidden/></td>
        </tr>)}</tbody></table></div>
        {!data.records.length && <p className={styles.noRows}>No page views in this selection.</p>}
        <div className={styles.pagination}><span>{data.records.length ? `Showing ${data.offset + 1}–${Math.min(data.offset + data.records.length, data.totals.views)} of ${formatNumber(data.totals.views)}` : data.totals.views ? 'No rows on this page. Refresh for the latest records.' : '0 page views'}</span><div><button type="button" aria-label="Previous page views" disabled={data.offset === 0} onClick={() => setFilters(f => ({ ...f, offset: Math.max(0, data.offset - data.pageSize), before: data.snapshotAt }))}><CaretLeftIcon size={17} aria-hidden/></button><span>Page {Math.floor(data.offset / data.pageSize) + 1}</span><button type="button" aria-label="Next page views" disabled={data.offset + data.pageSize >= data.totals.views || data.offset + data.pageSize > 100000} onClick={() => setFilters(f => ({ ...f, offset: data.offset + data.pageSize, before: data.snapshotAt }))}><CaretRightIcon size={17} aria-hidden/></button></div></div>
      </section>
      <details className={styles.breakdownDetails} ref={breakdowns}><summary>Devices, browsers &amp; traffic sources</summary><div className={styles.breakdowns}><Breakdown title="Devices" rows={data.devices} total={data.totals.views}/><Breakdown title="Browsers" rows={data.browsers} total={data.totals.views}/><Breakdown title="Operating systems" rows={data.systems} total={data.totals.views}/><Breakdown title="Traffic sources" rows={data.sources} total={data.totals.views}/></div></details>
      <footer className={styles.footnote}><p>Consenting page views only · Repeat views count separately · Locations are estimates, not exact positions.</p><p>City and operating-system details are available only for new version-2 consent. No names, raw IPs, form answers or recordings. Active time excludes hidden tabs and idle periods, is capped at 30 minutes and may be undercounted. Clicks cover supported navigation controls, not every interaction. Records expire after 30 days.</p><p>Updated {timestamp(data.checkedAt)} UK time. Refresh for newer visits. Map: <a href="/analytics/NOTICE.txt" target="_blank" rel="noreferrer">Natural Earth</a>.</p></footer>
    </>}
    {selected && <ViewDetails view={selected} onClose={() => setSelected(null)}/>}
  </div>
}
