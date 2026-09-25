import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
} from "@phosphor-icons/react/dist/ssr";
import { SiteHeader } from "@/app/contact/site-header";
import { getCareerOpenings } from "@/lib/career-openings";
import { formatClosingDate } from "@/lib/career-opening-types";
import {
  applicationPath,
  eligibilityCopy,
  jobIsOpen,
  jobPath,
  jobStructuredData,
  safeJsonLd,
} from "@/lib/job-discovery";
import styles from "../careers.module.css";
export const dynamic = "force-dynamic";
const findJob = cache(async (id: string) => {
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const job = (await getCareerOpenings()).items.find((item) => item.id === id);
  if (!job) notFound();
  return job;
});
type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const job = await findJob((await params).id);
  return {
    title: `${job.job_title} — ${job.location}`,
    description: job.description.slice(0, 180),
    alternates: { canonical: jobPath(job.id) },
    robots: { index: jobIsOpen(job), follow: true },
    openGraph: {
      title: `${job.job_title} | GI Healthcare`,
      description: job.description.slice(0, 180),
      url: jobPath(job.id),
      images: [{ url: "/icons/gi-icon-512.png", width: 512, height: 512, alt: "GI Healthcare careers" }],
    },
  };
}
export default async function JobPage({ params }: Props) {
  const job = await findJob((await params).id),
    isOpen = jobIsOpen(job),
    structured = jobStructuredData(job);
  return (
    <>
      <SiteHeader activePath="/careers" contentId="job-main" />
      <main className={styles.page} id="job-main">
        {structured && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: safeJsonLd(structured) }}
          />
        )}
        <a className={styles.back} href="/careers">
          <ArrowLeftIcon size={18} aria-hidden /> All opportunities
        </a>
        <header className={styles.jobHero}>
          <p className={styles.eyebrow}>{job.department}</p>
          <h1>{job.job_title}</h1>
          <p>
            {job.location} · {job.employment_type}
          </p>
        </header>
        <div className={styles.detailGrid}>
          <article className={styles.description}>
            <h2>The opportunity</h2>
            <div className={styles.prose}>{job.description}</div>
            <h2>Who can apply</h2>
            <p>{eligibilityCopy(job)}</p>
            <h2>About GI Healthcare</h2>
            <p>
              We are developing autonomous cooking machines for everyday life
              and extreme environments, guided by space design principles.
              Explore <a href="/research">our research</a> to learn more.
            </p>
            <p>
              Apply directly through our website. Your information is handled as
              described in our <a href="/privacy">privacy notice</a>.
            </p>
          </article>
          <aside className={styles.applyCard}>
            <span className={styles.status}>
              {isOpen ? "Applications open" : "Applications closed"}
            </span>
            <dl>
              <dt>
                {job.extended_closing_date
                  ? "Deadline extended to"
                  : "Application deadline"}
              </dt>
              <dd>
                {job.closing_date
                  ? formatClosingDate(job.closing_date)
                  : "No fixed deadline"}
                {job.closing_date && <small>11:59 pm, UK time</small>}
              </dd>
              {job.extended_closing_date && job.original_closing_date && (
                <>
                  <dt>Original deadline</dt>
                  <dd>{formatClosingDate(job.original_closing_date)}</dd>
                </>
              )}
              <dt>Proposed start</dt>
              <dd>
                {job.start_date
                  ? formatClosingDate(job.start_date)
                  : "To be agreed"}
              </dd>
              <dt>Posted</dt>
              <dd>{formatClosingDate(job.created_at.slice(0, 10))}</dd>
            </dl>
            {isOpen ? (
              <a href={applicationPath(job.id)} className={styles.primary}>
                Apply for this role <ArrowUpRightIcon size={20} aria-hidden />
              </a>
            ) : (
              <a href="/careers" className={styles.primary}>
                See current opportunities
              </a>
            )}
            <p>
              Questions? <a href="/contact">Contact us</a>
            </p>
          </aside>
        </div>
      </main>
    </>
  );
}
