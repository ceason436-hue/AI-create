import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readingLessonPayloadSchema } from "@/lib/reading-lessons";
import { isTemporaryDeployment } from "@/lib/temporary-deployment";
import { TEMPORARY_READING_LESSON } from "@/lib/temporary-reading-lesson";

export async function GET() {
  if (isTemporaryDeployment()) return NextResponse.json({ presets: [TEMPORARY_READING_LESSON] });
  try {
    const page = await db.sitePage.findFirst({ where: { pageKey: "ai-reading-library", publishStatus: "PUBLISHED" }, select: { sections: { where: { sectionType: "PRESET_ARTICLE", publishStatus: "PUBLISHED" }, orderBy: { sortOrder: "asc" }, select: { id: true, title: true, payload: true } } } });
    const presets = (page?.sections ?? []).flatMap((section) => {
      const parsed = readingLessonPayloadSchema.safeParse(section.payload);
      if (parsed.success) return [{ id: section.id, ...parsed.data }];
      const payload = section.payload as { title?: unknown; article?: unknown; teacherGuide?: unknown };
      return typeof payload.title === "string" && typeof payload.article === "string" && payload.article.trim()
        ? [{ id: section.id, title: payload.title, article: payload.article, teacherGuide: typeof payload.teacherGuide === "string" ? payload.teacherGuide : "", coverImage: "", grade: 1, semester: "FIRST" as const, publisher: "", summary: "", analysis: undefined }]
        : [];
    });
    return NextResponse.json({ presets });
  } catch {
    return NextResponse.json({ presets: [] });
  }
}
