'use client'
import { useState, type CSSProperties } from 'react'
import Image from 'next/image'
import { ArrowsHorizontalIcon } from '@phosphor-icons/react'
import earth from '@/assets/research/earth-field-concept.webp'
import habitat from '@/assets/research/lunar-habitat.webp'
import styles from './research.module.css'

export function EarthSpace() {
  const [balance, setBalance] = useState(50)
  return <section className={styles.future} aria-labelledby="future-title">
    <div className={styles.futureIntro}><p className={styles.eyebrow}>One purpose. Different frontiers.</p><h2 id="future-title">Earth first.<br />Space in focus.</h2><p>We focus on systems that endure extreme environments on Earth. The knowledge gained shapes our research for space exploration: fresh ingredients from space farms, cooked into home-style meals in stations and habitats.</p></div>
    <div className={styles.frontiers} style={{ '--earth-width': `${balance}%` } as CSSProperties}>
      <figure className={styles.earth}><Image src={earth} alt="Concept of a remote research camp in a mountainous terrestrial environment" fill sizes="(max-width: 760px) 100vw, 65vw" /><figcaption><span>On Earth</span><strong>Built around real constraints.</strong><small>Remote environment · Concept imagery</small></figcaption></figure>
      <figure className={styles.space}><Image src={habitat} alt="Lunar habitat concept with growing greens and our compact cooking machine on the worktop" fill sizes="(max-width: 760px) 100vw, 65vw" /><figcaption><span>In space</span><strong>Good food, further.</strong><small>Future habitat · Concept imagery</small></figcaption></figure>
      <div className={styles.comparisonHandle} style={{ left: `${balance}%` }} aria-hidden="true"><ArrowsHorizontalIcon size={22} /></div>
      <label className={styles.comparisonControl}><span className="sr-only">Balance Earth and space views</span><input type="range" min="25" max="75" value={balance} onChange={event => setBalance(Number(event.target.value))} aria-valuetext={`${balance}% Earth, ${100 - balance}% space`} /></label>
    </div>
    <div className={styles.futureBottom}><span>Explore the connection between two frontiers.</span><a href="/contact">Discuss our research <span aria-hidden="true">→</span></a></div>
  </section>
}
