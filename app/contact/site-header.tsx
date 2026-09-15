import Image from 'next/image'
import logo from '@/assets/brand/gi-healthcare-logo.png'
import { SITE_NAVIGATION } from '@/lib/site-navigation'
import styles from './contact.module.css'

function NavigationLinks({ activePath }: { activePath: string }) {
  // Plain anchors intentionally cross from Next.js to the Flutter public site.
  return SITE_NAVIGATION.map(item => <a key={item.href} href={item.href} aria-current={item.href === activePath ? 'page' : undefined}>{item.label}</a>)
}

export function SiteHeader({ activePath = '/contact', contentId = 'contact-main' }: { activePath?: string; contentId?: string }) {
  return <header className={styles.siteHeader}>
    <a className={styles.skipLink} href={`#${contentId}`}>Skip to content</a>
    <div className={styles.headerInner}>
      <a href="/" aria-label="GI Healthcare home" className={styles.brand}><Image src={logo} alt="GI Healthcare" width={180} height={52} preload /></a>
      <nav className={styles.desktopNav} aria-label="Main navigation"><NavigationLinks activePath={activePath} /></nav>
      <details className={styles.mobileMenu}>
        <summary><span aria-hidden="true">☰</span> Menu</summary>
        <nav aria-label="Main navigation"><NavigationLinks activePath={activePath} /></nav>
      </details>
    </div>
  </header>
}
