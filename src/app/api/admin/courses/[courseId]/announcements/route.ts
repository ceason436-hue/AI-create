import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { requireAdminResponse } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { internalError } from "@/lib/http";

const publishStatus = z.enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]);
const schema = z.object({ title: z.string().trim().min(1).max(180), content: z.string().trim().min(1).max(20_000), publishStatus: publishStatus.default("DRAFT"), publishAt: z.string().datetime().nullable().optional(), sortOrder: z.number().int().min(0).max(9999).optional() });

export async function GET(_request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const access = await requireAdminResponse();
  if ("response" in access) return access.response;
  const { courseId } = await params;
  try {
    const announcements = await db.courseAnnouncement.findMany({ where: { courseId }, orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }] });
    return Response.json({ announcements });
  } catch { return internalError(); }
}

export async function POST(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const access = await requireAdminResponse();
  if ("response" in access) return access.response;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "课程公告信息无效。" }, { status: 400 });
  const { courseId } = await params;
  try {
    const announcement = await db.$transaction(async (tx) => {
      const course = await tx.course.findUnique({ where: { id: courseId }, select: { id: true } });
      if (!course) throw new Error("COURSE_NOT_FOUND");
      const publishAt = parsed.data.publishAt ? new Date(parsed.data.publishAt) : null;
      const created = await tx.courseAnnouncement.create({ data: { courseId, title: parsed.data.title, content: parsed.data.content, publishStatus: parsed.data.publishStatus, publishAt, publishedAt: parsed.data.publishStatus === "PUBLISHED" && (!publishAt || publishAt <= new Date()) ? new Date() : null, sortOrder: parsed.data.sortOrder ?? 0, createdBy: access.account.id, updatedBy: access.account.id } });
      await tx.auditLog.create({ data: { actorId: access.account.id, action: "COURSE_ANNOUNCEMENT_CREATED", targetType: "COURSE_ANNOUNCEMENT", targetId: created.id, result: "SUCCEEDED", after: { courseId, title: created.title, publishStatus: created.publishStatus } as Prisma.InputJsonValue } });
      return created;
    });
    return Response.json({ announcement }, { status: 201 });
  } catch (error) { if (error instanceof Error && error.message === "COURSE_NOT_FOUND") return Response.json({ error: "课程不存在。" }, { status: 404 }); return internalError(); }
}
