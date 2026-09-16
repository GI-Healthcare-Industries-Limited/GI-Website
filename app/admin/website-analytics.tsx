'use client'

import { useCallback,useEffect,useState } from 'react'
import type {Session} from '@supabase/supabase-js'
import {ArrowsClockwiseIcon,ChartBarIcon,ClockIcon,CursorClickIcon,GlobeHemisphereWestIcon} from '@phosphor-icons/react'
import styles from './website-analytics.module.css'

type Group={label:string;views:number}
type Report={totals:{views:number;average_seconds:number;clicks:number};daily:{day:string;views:number}[];pages:{page:string;views:number;average_seconds:number;clicks:number}[];countries:Group[];devices:Group[];sources:Group[];checkedAt:string}
const labels:Record<string,string>={home:'Home',space:'Space',careers:'Careers',contact:'Contact us',apply:'Application form',privacy:'Privacy notice'}
const number=new Intl.NumberFormat('en-GB')
const duration=(value:number)=>value<60?`${value}s`:`${Math.floor(value/60)}m ${value%60}s`

export function WebsiteAnalytics({session}:{session:Session}){
  const [days,setDays]=useState(7),[data,setData]=useState<Report|null>(null),[busy,setBusy]=useState(true),[error,setError]=useState(''),[revision,setRevision]=useState(0)
  const refresh=useCallback(()=>setRevision(v=>v+1),[])
  useEffect(()=>{
    const controller=new AbortController();setBusy(true);setError('');setData(null)
    fetch(`/api/admin/analytics?days=${days}`,{headers:{Authorization:`Bearer ${session.access_token}`},signal:controller.signal}).then(async r=>{
      const result=await r.json();if(!r.ok)throw new Error(r.status===401?'Please sign in again to view analytics.':result.error||'Could not load analytics.');return result
    }).then(result=>{if(!controller.signal.aborted)setData(result)}).catch(e=>{if(!controller.signal.aborted)setError(e.message)}).finally(()=>{if(!controller.signal.aborted)setBusy(false)})
    return ()=>controller.abort()
  },[days,session.access_token,revision])
  const country=(code:string)=>{if(code==='ZZ')return 'Unknown';try{return new Intl.DisplayNames(['en'],{type:'region'}).of(code)||code}catch{return code}}
  const plot=Array.from({length:days},(_,i)=>{const d=new Date(data?.checkedAt||Date.now());d.setUTCDate(d.getUTCDate()-(days-1-i));const day=d.toISOString().slice(0,10);return {day,views:data?.daily.find(row=>row.day===day)?.views||0}})
  const max=Math.max(1,...plot.map(p=>p.views))
  function breakdown(title:string,rows:Group[],location=false){return <section className={styles.card}><h2>{title}</h2><div className={styles.rankings}>{rows.length?rows.map(row=><div key={row.label}><span>{location?country(row.label):row.label}</span><strong>{number.format(row.views)}</strong><progress max={data?.totals.views||1} value={row.views} aria-label={`${row.label} page views`} /></div>):<p>No data yet.</p>}</div></section>}
  return <div className={styles.analytics}>
    <div className={styles.toolbar}><span><GlobeHemisphereWestIcon aria-hidden size={18}/> gihealthcare.co.uk</span><div><label className="sr-only" htmlFor="analytics-period">Analytics period</label><select id="analytics-period" value={days} onChange={e=>setDays(Number(e.target.value))}><option value={7}>Last 7 days</option><option value={14}>Last 14 days</option><option value={30}>Last 30 days</option></select><button onClick={refresh} disabled={busy} aria-label="Refresh analytics"><ArrowsClockwiseIcon aria-hidden size={18}/></button></div></div>
    {error&&<p className={styles.notice} role="alert">{error} <button onClick={refresh}>Try again</button></p>}
    {busy&&<p className={styles.notice} role="status">Loading website activity…</p>}
    {data&&<>
      <div className={styles.metrics}>
        <section className={styles.card}><span><ChartBarIcon aria-hidden size={19}/>Page views</span><strong>{number.format(data.totals.views)}</strong><small>From visitors who accepted analytics</small></section>
        <section className={styles.card}><span><ClockIcon aria-hidden size={19}/>Average active time</span><strong>{duration(data.totals.average_seconds)}</strong><small>Per page view · an estimate</small></section>
        <section className={styles.card}><span><CursorClickIcon aria-hidden size={19}/>Navigation clicks</span><strong>{number.format(data.totals.clicks)}</strong><small>Recorded links and navigation controls</small></section>
      </div>
      <section className={`${styles.card} ${styles.traffic}`}><div className={styles.heading}><h2>Website activity</h2><span>Daily page views · UTC</span></div>
        {data.totals.views===0?<div className={styles.empty}><ChartBarIcon size={34} aria-hidden/><h3>A fresh start.</h3><p>Activity will appear after visitors choose to accept analytics. Earlier traffic is not available.</p></div>:<>
          <div className={styles.chart} role="img" aria-label={`Daily page views over ${days} days. Detailed figures available below.`}>{plot.map(p=><div key={p.day} title={`${p.day}: ${p.views} views`}><span style={{height:p.views?`${Math.max(2,p.views/max*100)}%`:'0%'}}/></div>)}</div>
          <div className={styles.axis}><span>{plot[0].day}</span><span>{plot.at(-1)?.day}</span></div>
          <details className={styles.dataDetails}><summary>View daily figures</summary><table><thead><tr><th>Date (UTC)</th><th>Page views</th></tr></thead><tbody>{plot.map(p=><tr key={p.day}><td>{p.day}</td><td>{p.views}</td></tr>)}</tbody></table></details>
        </>}
      </section>
      <section className={styles.card}><div className={styles.heading}><h2>Pages people explore</h2><span>Ranked by page views</span></div><div className={styles.tableScroll}><table><thead><tr><th>Page</th><th>Views</th><th>Active time</th><th>Clicks</th></tr></thead><tbody>{data.pages.map(p=><tr key={p.page}><td>{labels[p.page]||p.page}</td><td>{number.format(p.views)}</td><td>{duration(p.average_seconds)}</td><td>{number.format(p.clicks)}</td></tr>)}</tbody></table>{!data.pages.length&&<p className={styles.noRows}>No page activity in this period.</p>}</div></section>
      <div className={styles.breakdowns}>{breakdown('Visitor countries',data.countries,true)}{breakdown('Devices',data.devices)}{breakdown('Traffic sources',data.sources)}</div>
      <p className={styles.footnote}>Consent-based statistics, not a visitor directory. Repeat views count separately; these are not unique people. Locations are approximate and may reflect VPNs. Active time excludes hidden tabs and idle periods, is capped at 30 minutes per page, and may be undercounted when a browser closes. Click totals cover supported navigation controls, not form fields or every interaction. Records expire after 30 days.</p>
      <p className={styles.footnote}>Updated {new Date(data.checkedAt).toLocaleString('en-GB')} · Refresh to see newer activity.</p>
    </>}
  </div>
}
