import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/job-discovery";
export default function robots(): MetadataRoute.Robots {
  const disallow = ["/admin", "/api/", "/book/", "/apply", "/index.html"];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      { userAgent: "OAI-SearchBot", allow: "/", disallow },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
