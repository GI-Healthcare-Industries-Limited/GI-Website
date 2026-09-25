import type { Metadata } from "next";
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import { SiteHeader } from "@/app/contact/site-header";
import { getCareerOpenings } from "@/lib/career-openings";
import { formatClosingDate } from "@/lib/career-opening-types";
import { jobIsOpen, jobPath } from "@/lib/job-discovery";
import styles from "./careers.module.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Careers — autonomous cooking & robotics jobs in Edinburgh",
  description:
    "Explore current opportunities at GI Healthcare in Edinburgh. Help build autonomous cooking machines for everyday life, extreme environments and space exploration.",
  alternates: { canonical: "/careers" },
  openGraph: {
    title: "Careers at GI Healthcare",
    description: "Build autonomous cooking technology with us in Edinburgh.",
    url: "/careers",
    images: [{ url: "/icons/gi-icon-512.png", width: 512, height: 512, alt: "GI Healthcare careers" }],
  },
};
export default async function CareersPage() {
  const open = (await getCareerOpenings()).items.filter((job) =>
    jobIsOpen(job),
  );
  return (
    <>
      <SiteHeader activePath="/careers" contentId="careers-main" />
      <main id="careers-main" className={styles.page}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Careers at GI Healthcare</p>
          <h1>
            Build something
            <br />
            that matters.
          </h1>
          <p>Autonomous cooking. Real machines. A world of possibilities.</p>
          <a href="#open-roles" className={styles.primary}>
            Explore open roles <ArrowUpRightIcon size={20} aria-hidden />
          </a>
        </header>
        <section id="open-roles" className={styles.roles}>
          <div className={styles.sectionTitle}>
            <h2>Open opportunities</h2>
            <span>
              {open.length} {open.length === 1 ? "role" : "roles"}
            </span>
          </div>
          {open.length ? (
            open.map((job) => (
              <a className={styles.job} href={jobPath(job.id)} key={job.id}>
                <div>
                  <p className={styles.eyebrow}>{job.department}</p>
                  <h3>{job.job_title}</h3>
                  <p>
                    {job.location} · {job.employment_type}
                  </p>
                  <p className={styles.deadline}>
                    {job.closing_date
                      ? `${job.extended_closing_date ? "Deadline extended to " : "Apply by "}${formatClosingDate(job.closing_date)}`
                      : "No fixed application deadline"}
                  </p>
                </div>
                <ArrowUpRightIcon size={26} aria-hidden />
              </a>
            ))
          ) : (
            <p>
              There are no open roles at the moment. Please check back for
              future opportunities.
            </p>
          )}
        </section>
        <section className={styles.location}>
          <p className={styles.eyebrow}>Where are we?</p>
          <h2>
            The National Robotarium,
            <br />
            Edinburgh.
          </h2>
        <video
          autoPlay
          muted
          loop
          controls
            playsInline
            preload="metadata"
            aria-label="Inside the National Robotarium in Edinburgh"
          >
            <source src="/assets/assets/videos/bg_video.mp4" type="video/mp4" />
          </video>
          <p>
            Our Edinburgh R&amp;D base is where ideas become prototypes and
            prototypes become working systems.
          </p>
        </section>
        <footer className={styles.footer}>
          <a href="/research">Explore our research</a>
          <a href="/contact">Contact us</a>
          <a href="/privacy">Privacy notice</a>
        </footer>
      </main>
    </>
  );
}
