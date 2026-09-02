import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const origin = (process.env.NEXT_PUBLIC_SITE_URL || "https://lingpeak.com").replace(/\/$/, "");
const pages = ["/", "/courses", "/school-cooperation", "/activities", "/achievements", "/about", "/consult", "/tools", "/legal/privacy", "/legal/terms", "/legal/ai-safety"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [courses, activities, achievements] = await Promise.all([
    db.course.findMany({ where: { publishStatus: "PUBLISHED" }, select: { slug: true, updatedAt: true } }).catch(() => []),
    db.activity.findMany({ where: { publishStatus: "PUBLISHED" }, select: { slug: true, updatedAt: true } }).catch(() => []),
    db.achievement.findMany({ where: { publishStatus: "PUBLISHED" }, select: { slug: true, updatedAt: true } }).catch(() => []),
  ]);
  const staticEntries: MetadataRoute.Sitemap = pages.map((path) => ({ url: `${origin}${path}`, lastModified: new Date(), changeFrequency: path === "/" ? "weekly" : "monthly", priority: path === "/" ? 1 : path === "/courses" || path === "/tools" ? 0.9 : 0.7 }));
  return [
    ...staticEntries,
    ...courses.map((course) => ({ url: `${origin}/courses/${encodeURIComponent(course.slug)}`, lastModified: course.updatedAt, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...activities.map((activity) => ({ url: `${origin}/activities/${encodeURIComponent(activity.slug)}`, lastModified: activity.updatedAt, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...achievements.map((achievement) => ({ url: `${origin}/achievements/${encodeURIComponent(achievement.slug)}`, lastModified: achievement.updatedAt, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
