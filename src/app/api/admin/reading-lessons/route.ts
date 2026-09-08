import type { Prisma } from "@prisma/client";
import { requireAdminResponse } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { readingLessonPayloadSchema } from "@/lib/reading-lessons";

const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

export async function GET() {
  const access = await requireAdminResponse("ADMIN_CONTENT");
  if ("response" in access) return access.response;
  const page = await db.sitePage.findUnique({ where: { pageKey: "ai-reading-library" }, include: { sections: { where: { sectionType: "PRESET_ARTICLE", publishStatus: { not: "ARCHIVED" } }, orderBy: { sortOrder: "asc" } } } }).catch(() => null);
  return Response.json({ lessons: (page?.sections ?? []).map((section) => ({ id: section.id, sortOrder: section.sortOrder, publishStatus: section.publishStatus, ...(section.payload as object) })) });
}

export async function POST(request: Request) {
  const access = await requireAdminResponse("ADMIN_CONTENT");
  if ("response" in access) return access.response;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const parsed = readingLessonPayloadSchema.safeParse(body?.payload ?? body);
  if (!parsed.success) return Response.json({ error: "请完整填写课文名称、正文、年级和学期。" }, { status: 400 });
  const publishStatus = body?.publishStatus === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
  const sortOrder = Number.isInteger(body?.sortOrder) ? Number(body?.sortOrder) : 0;
  const lesson = await db.$transaction(async (tx) => {
    const page = await tx.sitePage.upsert({ where: { pageKey: "ai-reading-library" }, update: { publishStatus: "PUBLISHED", publishedAt: new Date() }, create: { pageKey: "ai-reading-library", title: "AI 阅读课文库", description: "运营后台发布的分段课文", publishStatus: "PUBLISHED", publishedAt: new Date() } });
    const created = await tx.pageSection.create({ data: { pageId: page.id, sectionType: "PRESET_ARTICLE", title: parsed.data.title, sortOrder, publishStatus, payload: json(parsed.data) } });
    await tx.contentRevision.create({ data: { sectionId: created.id, version: 1, payload: json(parsed.data), createdBy: access.account.id } });
    await tx.auditLog.create({ data: { actorId: access.account.id, action: "READING_LESSON_CREATED", targetType: "PAGE_SECTION", targetId: created.id, result: "SUCCEEDED", after: { title: parsed.data.title, grade: parsed.data.grade, semester: parsed.data.semester, publishStatus } } });
    return created;
  });
  return Response.json({ lesson: { id: lesson.id, ...parsed.data, publishStatus, sortOrder } }, { status: 201 });
}
