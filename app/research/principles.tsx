'use client'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ArrowDownIcon, ArrowUpIcon, PauseIcon, PlayIcon, LightningIcon, DropIcon, LeafIcon } from '@phosphor-icons/react'
import machine from '@/assets/research/machine-poster.webp'
import modularity from '@/assets/research/modularity-concept.webp'
import { useReducedMotion } from './use-motion'
import styles from './research.module.css'

const principles = [
  { label: 'Compact & lightweight', title: 'Less to carry. More possibilities.', text: 'A compact, lightweight system designed around the constraints of transport, installation and life in confined spaces.', detail: 'Our research brings cooking capability into a smaller footprint — from remote sites to future habitats.' },
  { label: 'Use limited resources', title: 'Make more of less.', text: 'Our research focuses on using less energy and water, while reducing food waste.', detail: 'Resource-conscious cooking means considering the whole process, from ingredients and portions to thermal management and cleaning.' },
  { label: 'Last longer', title: 'Maintain the module. Keep the system.', text: 'We explore modular architecture and redundancy to extend operating life in places where repairs are difficult.', detail: 'Replace individual components rather than an entire system. Design around faults, access and long-term serviceability.' },
]
const resources = [{ Icon: LightningIcon, label: 'Energy' }, { Icon: DropIcon, label: 'Water' }, { Icon: LeafIcon, label: 'Food waste' }]

export function Principles() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [visible, setVisible] = useState(false)
  const [tabVisible, setTabVisible] = useState(true)
  const reduced = useReducedMotion()
  const section = useRef<HTMLElement>(null)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const playing = !paused && !hovered && !focused && !reduced && visible && tabVisible
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .25 })
    if (section.current) observer.observe(section.current)
    const change = () => setTabVisible(!document.hidden)
    document.addEventListener('visibilitychange', change)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', change) }
  }, [])
  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => setActive(value => (value + 1) % 3), 8000)
    return () => window.clearInterval(timer)
  }, [playing, active])
  function select(index: number) { setActive((index + 3) % 3); setPaused(true) }
  const current = principles[active]
  return <section ref={section} className={styles.principles} id="principles" aria-labelledby="principles-title" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false) }}>
    <div className={styles.sectionInner}>
      <h2 id="principles-title" className={styles.eyebrow}>Designed around three principles</h2>
      <div className={styles.principleLayout}>
        <div className={styles.principleTabs} role="tablist" aria-label="Research principles" aria-orientation="vertical">
          {principles.map((principle, index) => <button ref={element => { tabs.current[index] = element }} type="button" role="tab" key={principle.label} id={`principle-tab-${index}`} aria-selected={active === index} aria-controls="principle-panel" tabIndex={active === index ? 0 : -1} onClick={() => select(index)} onKeyDown={event => {
            const next = ['ArrowDown', 'ArrowRight'].includes(event.key) ? (index + 1) % 3 : ['ArrowUp', 'ArrowLeft'].includes(event.key) ? (index + 2) % 3 : event.key === 'Home' ? 0 : event.key === 'End' ? 2 : null
            if (next !== null) { event.preventDefault(); select(next); tabs.current[next]?.focus() }
          }}><span>0{index + 1}</span>{principle.label}</button>)}
        </div>
        <div id="principle-panel" role="tabpanel" aria-labelledby={`principle-tab-${active}`} className={styles.principlePanel} tabIndex={0}>
          <figure className={styles.principleVisual} key={`visual-${active}`}>
            <div className={styles.principleImage}>
              <Image src={active === 2 ? modularity : machine} alt={active === 2 ? 'Illustrative modularity concept with a service hatch and removable component' : 'Visual recreation of our stainless-steel autonomous cooking machine'} fill sizes="(max-width: 760px) 90vw, 42vw" loading="eager" />
              {active === 0 && <div className={styles.dimensions} aria-hidden="true"><span className={styles.heightDimension}>H</span><span className={styles.widthDimension}>W</span><span className={styles.depthDimension}>D</span></div>}
            </div>
            {active === 1 && <div className={styles.resourceIcons}>{resources.map(({ Icon, label }) => <span key={label}><Icon size={25} weight="light" aria-hidden />{label}</span>)}</div>}
            <figcaption>{active === 0 ? 'Illustrative proportions · Dimensions to be confirmed' : active === 1 ? 'Research priorities, not certified performance claims' : 'Illustrative modularity concept'}</figcaption>
          </figure>
          <div className={styles.principleCopy} key={`copy-${active}`}><span className={styles.miniLabel}>Principle 0{active + 1}</span><h3>{current.title}</h3><p>{current.text}</p><p className={styles.principleDetail}>{current.detail}</p></div>
        </div>
      </div>
      <div className={styles.slideControls}><span>0{active + 1}<span className={styles.muted}> / 03</span></span><div className={styles.progress} aria-hidden="true" key={`${active}-${playing}`}><span data-playing={playing} style={{ width: playing ? undefined : `${(active + 1) * 100 / 3}%` }} /></div><div><button type="button" aria-label={paused || reduced ? 'Play principles slideshow' : 'Pause principles slideshow'} disabled={reduced} onClick={() => setPaused(value => !value)}>{paused || reduced ? <PlayIcon size={18} /> : <PauseIcon size={18} />}</button><button type="button" aria-label="Previous principle" onClick={() => select(active - 1)}><ArrowUpIcon size={18} /></button><button type="button" aria-label="Next principle" onClick={() => select(active + 1)}><ArrowDownIcon size={18} /></button></div></div>
    </div>
  </section>
}
