import type { MetadataRoute } from "next";

const origin = (process.env.NEXT_PUBLIC_SITE_URL || "https://lingpeak.com").replace(/\/$/, "");
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: ["/"], disallow: ["/admin", "/learn", "/my-works", "/api/"] }], sitemap: `${origin}/sitemap.xml` };
}
