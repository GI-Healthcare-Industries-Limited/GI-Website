import Image from 'next/image'
import { ArrowRightIcon } from '@phosphor-icons/react/dist/ssr'
import logo from '@/assets/brand/gi-healthcare-logo.png'
import { SITE_NAVIGATION } from '@/lib/site-navigation'
import styles from './site-footer.module.css'

export function SiteFooter() {
  return <footer className={styles.footer}>
    <div className={styles.top}>
      <a href="/" aria-label="GI Healthcare home"><Image src={logo} alt="GI Healthcare" width={180} height={52} /></a>
      <nav aria-label="Footer navigation">{SITE_NAVIGATION.map(item => <a key={item.href} href={item.href}>{item.label}</a>)}</nav>
      <div className={styles.invitation}><p>Let’s build a healthier,<br />more sustainable future.</p><a href="/contact">Contact us <ArrowRightIcon size={17} aria-hidden /></a></div>
    </div>
    <div className={styles.bottom}><small>© {new Date().getFullYear()} GI Healthcare Industries Limited</small><div><a href="/privacy">Privacy notice</a><a href="/privacy#cookie-choices" data-gi-privacy-open>Cookie choices</a><a href="https://www.linkedin.com/company/gihil/" target="_blank" rel="noopener noreferrer">LinkedIn</a></div></div>
  </footer>
}
