import type { Metadata } from 'next'
import Link from 'next/link'

import { SiteHeader } from '@/app/contact/site-header'
import { APPLICATION_PRIVACY_NOTICE_VERSION, PRIVACY_NOTICE_VERSION } from '@/lib/privacy'
import styles from './privacy.module.css'

export const metadata: Metadata = { title: 'Privacy notice' }

export default function PrivacyPage() {
  return <><SiteHeader activePath="/privacy" contentId="privacy-main" /><main id="privacy-main" tabIndex={-1} className={styles.page}>
    <article>
      <p className={styles.eyebrow}>Your information</p>
      <h1>Privacy, in plain language.</h1>
      <p className={styles.intro}>For people applying for a role or contacting GI Healthcare through this website.</p>
      <p>Effective <time dateTime={PRIVACY_NOTICE_VERSION}>14 September 2026</time> · Notice version {PRIVACY_NOTICE_VERSION}</p>

      <section><h2>Who is responsible?</h2><p>GI Healthcare Industries Limited is the data controller. Our owner administers the recruitment and enquiry inbox. For privacy questions, corrections, a copy of your information, a manual application review or a complaint, use our <Link href="/contact">contact form</Link>. Please do not include identity documents or sensitive information in your first message.</p></section>

      <section><h2>What we collect and why</h2>
        <p><strong>Applications:</strong> your chosen role, name, email, LinkedIn profile link, optional portfolio or project link, short work examples, competitions or awards (or that you have none yet), a failure, and a flaw your friends might point out. We also ask for a declaration of existing UK work permission. If relevant, this includes your permission category and acknowledgement of work restrictions. We use these to consider your application, understand whether the role is compatible with your declared permission and contact you. Our basis is taking steps at your request before a possible employment contract (UK GDPR Article 6(1)(b)).</p>
        <p>We also ask whether you are a current student or a graduate. Current students provide their degree and year of study; graduates provide their graduation year. The owner can restrict each role to students, graduates, or both. The application form shows this requirement and prevents online submission if your selected status does not match. You can <Link href="/contact">contact the owner for a human review</Link> to explain your circumstances, correct an answer or contest the outcome. Unsubmitted answers are not saved. We do not calculate or screen by age. Education answers are deleted with the rest of your application; changing a role’s eligibility does not reclassify applications already received.</p>
        <p>We do not ask for a CV, date of birth, share code or identity document at this stage. If we make a conditional offer, we will arrange an appropriate right-to-work check before employment, under our legal obligations (Article 6(1)(c)). That is a separate process with its own information and record-keeping requirements.</p>
        <p><strong>Enquiries:</strong> your name, email, optional phone number and message. We use them to respond and follow up on your enquiry. Our basis is our legitimate interest in communicating with people who contact our business (Article 6(1)(f)).</p>
        <p><strong>Security and administration:</strong> submission time, status, notice version and a pseudonymous anti-abuse identifier derived from your IP address. We use these to operate the inbox, prevent spam and protect the service, based on legitimate interests (Article 6(1)(f)). Our application database removes this identifier after two days. Hosting providers also process technical connection and security data, such as IP addresses and request metadata, under their separate service-log lifecycles.</p>
        <p>Information comes from you and any relevant work you choose to link. Please share only material you have permission to disclose: no confidential defence material, health information, identity documents or unnecessary information about other people.</p>
      </section>

      <section><h2>Role-specific questions</h2><p>The “A little more about you” section may contain job-relevant questions selected by the owner for that role, including written answers, work links, awards or multiple-choice answers. Required and optional fields are marked on the form. We retain the questions shown alongside your submitted answers so later changes to a posting do not change your application. They are used only to assess your application and are deleted with it after three calendar months. Please do not include sensitive personal information or identity documents in these answers.</p></section>
      <section><h2>Your choices and the eligibility questions</h2>
        <p>A LinkedIn profile link is required for the online application; we no longer ask applicants for a phone number. Portfolio links and links within written examples remain optional. Phone numbers on the contact form are optional. Other requested application fields are needed to consider an online application; name, email and message are needed to respond to an enquiry. You can state that you have no awards yet. You can contact us for help or an accessible alternative, including if you do not have a LinkedIn profile. Submitting is not marketing consent and does not enrol you in a future-jobs talent pool.</p>
        <p>The online form stops if you declare that you cannot do the role without our sponsorship. These are simple rules based on your answers, not a Home Office check. No online submission is saved when you stop at that stage. If an answer is wrong, your circumstances need explanation or you disagree, <Link href="/contact">ask the owner for a human review</Link>, explain your circumstances and contest the outcome. You do not need a share code to ask. A human reviews submitted applications; a visa category or citizenship is not a measure of merit.</p>
      </section>

      <section id="recruitment-answers"><h2>Your application answers</h2>
        <p>Recruitment addendum version {APPLICATION_PRIVACY_NOTICE_VERSION}, effective 16 September 2026. We record your education answers, LinkedIn profile link, short answers and award cards, together with the time and version of your application data-use agreement. The owner may open your LinkedIn link to review your professional background; the portal does not automatically fetch, embed or copy your profile. Earlier applications may retain a phone number until their original deletion date. We do not record your typing, clipboard, or browsing activity. A human reviews applications; there is no automated personality assessment.</p>
        <p>Please share only information you are comfortable providing. Do not include health details, personal trauma, private information about friends, or confidential material. Earlier applications may contain the additional example and declaration requested by the earlier form. All answers and declarations are deleted with the application under the same three-calendar-month rule below.</p>
      </section>

      <section><h2>Three months, not indefinitely</h2>
        <p>Applications and contact enquiries are automatically deleted from the live portal within <strong>three calendar months from submission</strong>, calculated in UTC. Deletion may occur a few minutes early. Changing status, archiving, closing a role or setting its start date does not extend this period. There is no hidden talent-pool archive. The owner can delete a submission sooner.</p>
        <p>If recruitment or a conversation needs to continue beyond this period, we must explain any separate, necessary record and its retention to you. Required employment and right-to-work check records are not kept in this recruitment inbox. Provider security logs and restricted disaster-recovery copies have separate lifecycles; they are not an active recruitment archive. We must reapply deletion before returning any restored database to service. Contact us for details of applicable provider retention arrangements.</p>
      </section>

      <section><h2>Who handles your information?</h2>
        <p>The company owner is the authorised inbox reviewer. We do not sell submissions or share them for advertising. We use service providers to run the site: Vercel for hosting, Supabase for the database and administrator authentication, and Cloudflare for domain/network services. Where enabled, our notification-email service, Resend, receives a generic alert to the owner, not your name, email, message, portfolio, permission category or application contents. If you email us directly or we reply by email, our business email provider also processes that correspondence.</p>
        <p>Standard website fonts are served with the site. The Flutter-based main website may request a Google Fonts fallback to display characters not covered by those fonts; Google then receives connection information such as your IP address, not your form contents. These providers and their authorised subprocessors are involved even when only the owner opens your application. We may also disclose information where legally required. The service is not intended for classified defence information.</p>
      </section>

      <section><h2>Location and international processing</h2>
        <p>The primary application database and the website’s server-side application functions are configured in London. This does not mean that every network request, support activity, security log or backup stays in the UK: providers operate international infrastructure.</p>
        <p>International access and transfers require assessment of the particular provider and applicable safeguards, such as UK adequacy regulations or contractual transfer safeguards with any required risk assessment. The providers’ published terms describe their arrangements: <a href="https://vercel.com/legal/dpa" target="_blank" rel="noreferrer">Vercel’s data-processing terms</a> and <a href="https://supabase.com/docs/guides/security/gdpr-compliance" target="_blank" rel="noreferrer">Supabase’s privacy and DPA information</a>. Contact us for details or a copy of safeguards applicable to your data. We do not represent this public website as a certified UK-only defence system.</p>
      </section>

      <section><h2>Your rights and complaints</h2>
        <p>Depending on the circumstances, you can request access, correction, erasure, restriction or a portable copy of your data, and object to processing based on legitimate interests. These rights have legal conditions and exceptions. You can reach us through our <Link href="/contact">contact form</Link>; no account is required. This does not limit your right to make a request by other means. We will ask only for proportionate information if needed to establish your identity.</p>
        <p>We aim to respond without undue delay, normally within one calendar month for a rights request. If a permitted extension applies, we will explain it. We acknowledge data-protection complaints within 30 days, investigate without undue delay and keep you informed of the outcome. You can also complain to the UK Information Commissioner’s Office at <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noreferrer">ico.org.uk/make-a-complaint</a>.</p>
      </section>

      <section><h2>Browser storage and security</h2>
        <p>These forms do not add advertising or behavioural analytics trackers. The website may cache public assets for performance. The admin area uses browser session storage for essential authentication, which is cleared when the tab session ends, and locks after inactivity. Submission contents are not put into browser storage. Please do not use a shared device for the admin portal. External portfolio links and sites have their own privacy practices.</p>
        <p>We use encrypted connections, restricted server-side access, input checks and automatic expiry. No website or free hosting plan guarantees uninterrupted availability. If a submission cannot be saved, the form reports an error rather than claiming success.</p>
      </section>
    </article>
    <footer><Link href="/apply">Careers</Link><Link href="/contact">Contact us</Link></footer>
  </main></>
}
