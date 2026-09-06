import { db } from "@/lib/db";
import { type PublishedSection } from "./site-page-payload";

export type { PublishedSection } from "./site-page-payload";

export type PublicPageLoadResult = {
  state: "published" | "missing" | "draft" | "unavailable";
  sections: PublishedSection[];
};

export async function loadPublishedPageSections(pageKey: string): Promise<PublicPageLoadResult> {
  try {
    const page = await db.sitePage.findUnique({
      where: { pageKey },
      select: {
        publishStatus: true,
        sections: {
          where: { publishStatus: "PUBLISHED" },
          orderBy: { sortOrder: "asc" },
          select: { id: true, sectionType: true, title: true, payload: true, sortOrder: true },
        },
      },
    });
    if (!page) return { state: "missing", sections: [] };
    if (page.publishStatus !== "PUBLISHED") return { state: "draft", sections: [] };
    return { state: "published", sections: page.sections };
  } catch {
    return { state: "unavailable", sections: [] };
  }
}

export async function getPublishedPageSections(pageKey: string): Promise<PublishedSection[]> {
  return (await loadPublishedPageSections(pageKey)).sections;
}
