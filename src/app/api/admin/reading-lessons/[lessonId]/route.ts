import type { Prisma } from "@prisma/client";
import { requireAdminResponse } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { readingLessonPayloadSchema } from "@/lib/reading-lessons";

const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

export async function PATCH(request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const access = await requireAdminResponse("ADMIN_CONTENT");
  if ("response" in access) return access.response;
  const { lessonId } = await params;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const parsed = readingLessonPayloadSchema.safeParse(body?.payload ?? body);
  if (!parsed.success) return Response.json({ error: "课文数据不完整，无法保存。" }, { status: 400 });
  const publishStatus = body?.publishStatus === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
  const current = await db.pageSection.findUnique({ where: { id: lessonId }, include: { revisions: { orderBy: { version: "desc" }, take: 1 } } });
  if (!current || current.sectionType !== "PRESET_ARTICLE") return Response.json({ error: "课文不存在。" }, { status: 404 });
  const updated = await db.$transaction(async (tx) => {
    const version = (current.revisions[0]?.version ?? 0) + 1;
    const section = await tx.pageSection.update({ where: { id: lessonId }, data: { title: parsed.data.title, sortOrder: Number.isInteger(body?.sortOrder) ? Number(body?.sortOrder) : current.sortOrder, publishStatus, payload: json(parsed.data) } });
    await tx.contentRevision.create({ data: { sectionId: lessonId, version, payload: json(parsed.data), createdBy: access.account.id } });
    await tx.auditLog.create({ data: { actorId: access.account.id, action: "READING_LESSON_UPDATED", targetType: "PAGE_SECTION", targetId: lessonId, result: "SUCCEEDED", after: { title: parsed.data.title, version, publishStatus } } });
    return section;
  });
  return Response.json({ lesson: { id: updated.id, ...parsed.data, publishStatus, sortOrder: updated.sortOrder } });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const access = await requireAdminResponse("ADMIN_CONTENT");
  if ("response" in access) return access.response;
  const { lessonId } = await params;
  const updated = await db.pageSection.updateMany({ where: { id: lessonId, sectionType: "PRESET_ARTICLE" }, data: { publishStatus: "ARCHIVED" } });
  if (!updated.count) return Response.json({ error: "课文不存在。" }, { status: 404 });
  await db.auditLog.create({ data: { actorId: access.account.id, action: "READING_LESSON_ARCHIVED", targetType: "PAGE_SECTION", targetId: lessonId, result: "SUCCEEDED" } });
  return Response.json({ ok: true });
}
