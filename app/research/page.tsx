import type { Metadata } from 'next'
import { ArrowDownIcon, ArrowRightIcon } from '@phosphor-icons/react/dist/ssr'
import { SiteHeader } from '@/app/contact/site-header'
import { SiteFooter } from '@/app/_components/site-footer'
import { ProductViewer } from './product-viewer'
import { Principles } from './principles'
import { EarthSpace } from './earth-space'
import { Supporters } from './supporters'
import { ResearchNotes } from './research-notes'
import styles from './research.module.css'

export const metadata: Metadata = {
  title: 'Research — autonomous cooking for Earth and beyond',
  description: 'Explore GI Healthcare’s autonomous cooking research: compact and lightweight systems, careful resource use, and modular design for longevity in extreme environments and future space habitats.',
  alternates: { canonical: 'https://www.gihealthcare.co.uk/research' },
}

export default function ResearchPage() {
  return <div className={styles.page}>
    <SiteHeader activePath="/research" contentId="research-main" />
    <main id="research-main" tabIndex={-1}>
      <section className={styles.hero} aria-labelledby="research-title">
        <div className={styles.heroCopy}><p className={styles.eyebrow}>Research</p><h1 id="research-title">Small footprint.<br />Expansive thinking.</h1><p className={styles.intro}>Autonomous cooking, guided by<br />space design principles.</p><div className={styles.heroActions}><a className={styles.primaryLink} href="#principles">Explore our research <ArrowRightIcon size={20} aria-hidden /></a><a className={styles.textLink} href="/contact">Discuss our research <ArrowRightIcon size={20} aria-hidden /></a></div><a href="#principles" className={styles.scrollCue}><ArrowDownIcon size={22} aria-hidden />Scroll to explore</a></div>
        <ProductViewer />
      </section>
      <Principles />
      <EarthSpace />
      <Supporters />
      <ResearchNotes />
    </main>
    <SiteFooter />
  </div>
}
