import type { MetadataRoute } from "next";
import { getCareerOpenings } from "@/lib/career-openings";
import { jobIsOpen, jobPath, SITE_URL } from "@/lib/job-discovery";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fail rather than publishing a truncated sitemap when the database is unavailable.
  const { items } = await getCareerOpenings();
  return [
    ...["", "/research", "/careers", "/contact", "/privacy"].map((path) => ({
      url: `${SITE_URL}${path}`,
    })),
    ...items
      .filter((job) => jobIsOpen(job))
      .map((job) => ({
        url: `${SITE_URL}${jobPath(job.id)}`,
        lastModified: job.updated_at,
      })),
  ];
}
