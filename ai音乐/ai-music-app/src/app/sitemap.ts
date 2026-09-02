import type { MetadataRoute } from "next";

const origin = (process.env.NEXT_PUBLIC_SITE_URL || "https://lingpeak.com").replace(/\/$/, "");
const pages = ["/", "/courses", "/school-cooperation", "/activities", "/achievements", "/about", "/consult", "/tools", "/legal/privacy", "/legal/terms", "/legal/ai-safety"];

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map((path) => ({ url: `${origin}${path}`, lastModified: new Date(), changeFrequency: path === "/" ? "weekly" : "monthly", priority: path === "/" ? 1 : path === "/courses" || path === "/tools" ? 0.9 : 0.7 }));
}
