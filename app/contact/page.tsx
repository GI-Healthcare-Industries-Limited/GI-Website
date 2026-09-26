import type { Metadata } from 'next'
import Image from 'next/image'
import { SiteFooter } from '@/app/_components/site-footer'
import fieldKitchen from '@/assets/contact/field-kitchen.webp'
import { ContactForm } from './contact-form'
import { SiteHeader } from './site-header'
import styles from './contact.module.css'

export const metadata: Metadata = { title: 'Contact', description: 'Get in touch with GI Healthcare.' }

export default function ContactPage() {
  return <div className={styles.page}>
    <SiteHeader />
    <main id="contact-main" tabIndex={-1}>
      <section className={styles.hero} aria-labelledby="contact-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Contact us</p>
          <h1 id="contact-title">Let’s talk.</h1>
          <p className={styles.intro}>Our technology. Your ideas.<br />A conversation is a good place to start.</p>
          <a className={styles.heroLink} href="#get-in-touch">Get in touch <span aria-hidden="true">↘</span></a>
        </div>
        <figure className={styles.visual}>
          <Image src={fieldKitchen} alt="Illustrative concept of an autonomous cooking machine in a field kitchen overlooking Scottish hills" fill preload sizes="(max-width: 760px) 100vw, (max-width: 1320px) 62vw, 770px" />
        </figure>
      </section>
      <section className={styles.contactSection} id="get-in-touch" aria-labelledby="conversation-title">
        <div className={styles.contactInner}>
          <aside className={styles.context}>
            <p className={styles.eyebrow}>Start a conversation</p>
            <h2 id="conversation-title">What’s on<br />your mind?</h2>
            <p>A question about our machines, a potential partnership, or something we haven’t thought of yet. We’d like to hear it.</p>
            <div className={styles.locations}>
              <h3>Where we work</h3>
              <address><strong>Head office</strong>1F23 Student Ventures<br />Bristol, BS16 1QY</address>
              <address><strong>Research & development</strong>The National Robotarium<br />Edinburgh, EH14 4AS</address>
            </div>
          </aside>
          <ContactForm />
        </div>
      </section>
    </main>
    <SiteFooter />
  </div>
}
