'use client'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeftIcon, ArrowRightIcon, PauseIcon, PlayIcon } from '@phosphor-icons/react'
import { useReducedMotion } from './use-motion'
import styles from './research.module.css'

// Source artwork is preserved. Restricted marks await supplied approved assets.
const supporters = [
  { name: 'Ministry of Defence', file: 'mod.webp', url: 'https://www.gov.uk/government/organisations/ministry-of-defence' },
  { name: 'Dstl', file: 'dstl.png', url: 'https://www.gov.uk/government/organisations/defence-science-and-technology-laboratory' },
  { name: 'Innovate UK', file: 'innovate-uk.png', url: 'https://www.ukri.org/councils/innovate-uk/' },
  { name: 'Science and Technology Facilities Council', file: 'stfc.png', url: 'https://www.ukri.org/councils/stfc/' },
  { name: 'Intellectual Property Office', file: '', url: 'https://www.gov.uk/government/organisations/intellectual-property-office' },
  { name: 'Microsoft for Startups', file: 'microsoft-startups.png', url: 'https://www.microsoft.com/startups' },
  { name: 'NVIDIA Inception', file: '', url: 'https://www.nvidia.com/en-us/startups/' },
  { name: 'Barclays Eagle Labs', file: 'barclays.svg', url: 'https://labs.uk.barclays/' },
  { name: 'UK Space Agency Accelerator', file: 'uk-space-accelerator.png', url: 'https://www.ukspaceaccelerator.co.uk/', dark: true },
  { name: 'University of Bristol', file: 'bristol.svg', url: 'https://www.bristol.ac.uk/' },
  { name: 'Heriot-Watt University', file: 'hwu.webp', url: 'https://www.hw.ac.uk/' },
  { name: 'UWE Bristol', file: 'uwe.svg', url: 'https://www.uwe.ac.uk/' },
  { name: 'University of Glasgow', file: 'glasgow.svg', url: 'https://www.gla.ac.uk/', dark: true },
  { name: 'Nexus Creative', file: 'nexus.svg', url: 'https://nexuscreativehq.com', dark: true },
]

export function Supporters() {
  const track = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const reduced = useReducedMotion()
  useEffect(() => {
    const node = track.current
    if (!node || paused || hovered || focused || reduced) return
    let frame = 0
    let previous = 0
    let x = node.scrollLeft
    let visible = false
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; previous = 0 })
    observer.observe(node)
    const tick = (time: number) => {
      if (visible && !document.hidden) {
        if (previous) { x += Math.min(time - previous, 50) * .022; if (x >= node.scrollWidth / 2) x -= node.scrollWidth / 2; node.scrollLeft = x }
        previous = time
      } else previous = 0
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(frame); observer.disconnect() }
  }, [paused, hovered, focused, reduced])
  const scroll = (direction: number) => { setPaused(true); track.current?.scrollBy({ left: direction * 300, behavior: reduced ? 'instant' : 'smooth' }) }
  return <section className={styles.supporters} aria-labelledby="supporters-title">
    <div className={styles.supportersHeading}><h2 className={styles.eyebrow} id="supporters-title">Supported by</h2><p>People, programmes and organisations supporting our journey.</p></div>
    <div ref={track} className={styles.supporterTrack} tabIndex={0} role="region" aria-label="Supporters. Scroll horizontally to explore." onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false) }} onWheel={() => setPaused(true)} onTouchStart={() => setPaused(true)}>
      {[0, 1].map(copy => <div className={styles.supporterSet} key={copy} aria-hidden={copy === 1 ? true : undefined} inert={copy === 1 ? true : undefined}>{supporters.map(supporter => <a key={supporter.name} href={supporter.url} target="_blank" rel="noopener noreferrer" className={supporter.dark ? styles.darkLogo : undefined} tabIndex={copy === 1 ? -1 : undefined}>{supporter.file ? <img src={`/research/supporters/${supporter.file}`} alt={supporter.name} width="180" height="70" loading="lazy" draggable="false" /> : <span className={styles.supporterName}>{supporter.name}</span>}</a>)}</div>)}
    </div>
    <div className={styles.supporterControls}><span>Scroll to explore</span><button type="button" onClick={() => scroll(-1)} aria-label="Previous supporters"><ArrowLeftIcon size={18} /></button><button type="button" disabled={reduced} onClick={() => setPaused(value => !value)} aria-label={paused || reduced ? 'Play supporter scrolling' : 'Pause supporter scrolling'}>{paused || reduced ? <PlayIcon size={18} /> : <PauseIcon size={18} />}</button><button type="button" onClick={() => scroll(1)} aria-label="Next supporters"><ArrowRightIcon size={18} /></button></div>
  </section>
}
