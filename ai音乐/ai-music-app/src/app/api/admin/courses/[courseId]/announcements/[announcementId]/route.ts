import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { requireAdminResponse } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { internalError } from "@/lib/http";

const schema = z.object({ title: z.string().trim().min(1).max(180).optional(), content: z.string().trim().min(1).max(20_000).optional(), publishStatus: z.enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]).optional(), publishAt: z.string().datetime().nullable().optional(), sortOrder: z.number().int().min(0).max(9999).optional() });

export async function PATCH(request: Request, { params }: { params: Promise<{ courseId: string; announcementId: string }> }) {
  const access = await requireAdminResponse();
  if ("response" in access) return access.response;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "课程公告信息无效。" }, { status: 400 });
  const { courseId, announcementId } = await params;
  try {
    const announcement = await db.$transaction(async (tx) => {
      const before = await tx.courseAnnouncement.findFirst({ where: { id: announcementId, courseId } });
      if (!before) throw new Error("NOT_FOUND");
      const publishAt = parsed.data.publishAt === undefined ? undefined : parsed.data.publishAt ? new Date(parsed.data.publishAt) : null;
      const becomingPublished = parsed.data.publishStatus === "PUBLISHED" && before.publishStatus !== "PUBLISHED" && (!publishAt || publishAt <= new Date());
      const updated = await tx.courseAnnouncement.update({ where: { id: announcementId }, data: { ...parsed.data, publishAt, publishedAt: becomingPublished ? new Date() : undefined, updatedBy: access.account.id } });
      await tx.auditLog.create({ data: { actorId: access.account.id, action: "COURSE_ANNOUNCEMENT_UPDATED", targetType: "COURSE_ANNOUNCEMENT", targetId: updated.id, result: "SUCCEEDED", before: { publishStatus: before.publishStatus, publishAt: before.publishAt?.toISOString() ?? null }, after: { ...parsed.data, courseId } as Prisma.InputJsonValue } });
      return updated;
    });
    return Response.json({ announcement });
  } catch (error) { if (error instanceof Error && error.message === "NOT_FOUND") return Response.json({ error: "公告不存在。" }, { status: 404 }); return internalError(); }
}
