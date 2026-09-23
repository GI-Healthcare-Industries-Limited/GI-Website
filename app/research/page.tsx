import type { Metadata } from 'next'
import Image from 'next/image'
import { ArrowRightIcon } from '@phosphor-icons/react/dist/ssr'
import hero from '@/assets/research/research-hero.webp'
import habitat from '@/assets/research/lunar-habitat.webp'
import { SiteHeader } from '@/app/contact/site-header'
import styles from './research.module.css'

export const metadata: Metadata = {
  title: 'Research',
  description: 'Autonomous cooking research guided by space design principles: compact and lightweight, resource efficient, and built for longevity.',
  alternates: { canonical: 'https://www.gihealthcare.co.uk/research' },
}

const principles = [
  { title: 'Compact & lightweight', description: 'Designed for easier transport and deployment.' },
  { title: 'Use limited resources', description: 'Reduce demand for water and electricity, and minimise food waste.' },
  { title: 'Last longer', description: 'Modularity and redundancy for dependable operation with less maintenance.' },
]

export default function ResearchPage() {
  return <div className={styles.page}>
    <SiteHeader activePath="/research" contentId="research-main" />
    <main id="research-main" tabIndex={-1}>
      <section className={styles.hero} aria-labelledby="research-title">
        <Image className={styles.heroImage} src={hero} alt="Concept illustration of our stainless-steel autonomous cooking machine in a sunlit studio" fill preload sizes="100vw" />
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Research</p>
          <h1 id="research-title">Less to carry.<br />More to sustain.</h1>
          <p className={styles.intro}>Autonomous cooking, guided by<br className={styles.desktopBreak} /> space design principles.</p>
          <a className={styles.textLink} href="#principles">Learn about our research <ArrowRightIcon size={23} aria-hidden /></a>
        </div>
        <div className={styles.annotations} aria-hidden="true">
          <span>Compact &amp;<br />lightweight</span>
          <span>Resource<br />efficient</span>
          <span>Modular<br />by design</span>
        </div>
        <span className={styles.caption}>Concept illustration</span>
      </section>
      <section className={styles.principles} id="principles" aria-label="Our research principles">
        <div className={styles.principlesInner}>
          {principles.map((principle, index) => <article className={styles.principle} key={principle.title}>
            <span className={styles.number} aria-hidden="true">0{index + 1}</span>
            <div><h2>{principle.title}</h2><p>{principle.description}</p></div>
          </article>)}
        </div>
      </section>
      <section className={styles.future} aria-labelledby="future-title">
        <div className={styles.futureCopy}>
          <h2 id="future-title">Earth first.<br />Space in focus.</h2>
          <p>We focus on systems that endure extreme environments on Earth. The knowledge gained shapes our research for space exploration: fresh ingredients from space farms, cooked into home-style meals in stations and habitats.</p>
          <a className={styles.textLink} href="/contact">Discuss our research <ArrowRightIcon size={23} aria-hidden /></a>
        </div>
        <figure className={styles.habitat}>
          <Image src={habitat} alt="Concept of a lunar habitat with growing greens and a compact cooking machine on the worktop, overlooking the Moon and Earth" sizes="(max-width: 760px) 100vw, 56vw" />
          <figcaption>Future habitat · Concept imagery</figcaption>
        </figure>
      </section>
    </main>
  </div>
}
