import type { CareerOpening } from "./career-opening-types";
export const SITE_URL = "https://www.gihealthcare.co.uk";
export const ORGANIZATION = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "GI Healthcare",
  legalName: "GI Healthcare Industries Limited",
  url: SITE_URL,
  logo: `${SITE_URL}/icons/gi-icon-512.png`,
  description:
    "Developing autonomous cooking machines for everyday life, extreme environments and space exploration.",
};
// Immutable IDs keep shared links working after a title changes.
export function jobPath(id: string) {
  return `/careers/${id}`;
}
export function applicationPath(id: string) {
  return `/apply?job=${encodeURIComponent(id)}`;
}
export function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
export function safeJsonLd(value: unknown) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}
export function jobIsOpen(job: CareerOpening, now = Date.now()) {
  return (
    job.accepting_applications &&
    job.is_open &&
    (!job.closes_at || Date.parse(job.closes_at) > now)
  );
}
export function eligibilityCopy(job: CareerOpening) {
  const education =
    job.education_eligibility === "student"
      ? "Current students only."
      : job.education_eligibility === "graduate"
        ? "Graduates only."
        : "Current students and graduates can apply.";
  return `${education} You must have existing permission to do this role in the UK without sponsorship from GI Healthcare. Any work restrictions must be compatible with the role.`;
}
export function jobStructuredData(job: CareerOpening, now = Date.now()) {
  if (!jobIsOpen(job, now)) return null;
  const employmentType = {
    "Full-time": "FULL_TIME",
    "Part-time": "PART_TIME",
    "Fixed-term contract": "TEMPORARY",
    Internship: "INTERN",
  }[job.employment_type];
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.job_title,
    description:
      job.description
        .split(/\n+/)
        .filter(Boolean)
        .map((line) => `<p>${escapeHtml(line)}</p>`)
        .join("") + `<p>${escapeHtml(eligibilityCopy(job))}</p>`,
    identifier: {
      "@type": "PropertyValue",
      name: "GI Healthcare",
      value: job.id,
    },
    datePosted: job.created_at,
    ...(job.closes_at ? { validThrough: job.closes_at } : {}),
    employmentType,
    hiringOrganization: ORGANIZATION,
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location.replace(/,\s*(UK|United Kingdom)$/i, ""),
        addressCountry: "GB",
      },
    },
    url: `${SITE_URL}${jobPath(job.id)}`,
  };
}
