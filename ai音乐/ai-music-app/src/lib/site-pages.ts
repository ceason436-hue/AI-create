import { db } from "@/lib/db";
import { type PublishedSection } from "./site-page-payload";

export type { PublishedSection } from "./site-page-payload";

export async function getPublishedPageSections(pageKey: string): Promise<PublishedSection[]> {
  try {
    const page = await db.sitePage.findFirst({ where: { pageKey, publishStatus: "PUBLISHED" }, select: { sections: { where: { publishStatus: "PUBLISHED" }, orderBy: { sortOrder: "asc" }, select: { id: true, sectionType: true, title: true, payload: true, sortOrder: true } } } });
    return page?.sections ?? [];
  } catch { return []; }
}
