import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { requireAdminResponse } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { internalError } from "@/lib/http";

const publishStatus = z.enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]);
const toolKey = z.enum(["chat", "code", "image", "music", "music_query", "vision"]);
const createSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("MODULE"), title: z.string().trim().min(1).max(180), description: z.string().trim().max(500).optional(), sortOrder: z.number().int().min(0).max(9999).optional(), publishStatus: publishStatus.default("DRAFT") }),
  z.object({ kind: z.literal("LESSON"), moduleId: z.string().min(1), title: z.string().trim().min(1).max(180), summary: z.string().trim().max(500).optional(), content: z.string().trim().max(20_000).optional(), estimatedMinutes: z.number().int().min(1).max(480).default(45), sortOrder: z.number().int().min(0).max(9999).optional(), publishStatus: publishStatus.default("DRAFT") }),
  z.object({ kind: z.literal("TOOL_BINDING"), lessonId: z.string().min(1).optional(), toolKey, accessMode: z.enum(["COURSE", "TASK"]).default("TASK"), sortOrder: z.number().int().min(0).max(9999).optional(), status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE") }),
]);
const updateSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("MODULE"), id: z.string().min(1), title: z.string().trim().min(1).max(180).optional(), description: z.string().trim().max(500).optional(), sortOrder: z.number().int().min(0).max(9999).optional(), publishStatus: publishStatus.optional() }),
  z.object({ kind: z.literal("LESSON"), id: z.string().min(1), title: z.string().trim().min(1).max(180).optional(), summary: z.string().trim().max(500).optional(), content: z.string().trim().max(20_000).optional(), estimatedMinutes: z.number().int().min(1).max(480).optional(), sortOrder: z.number().int().min(0).max(9999).optional(), publishStatus: publishStatus.optional() }),
  z.object({ kind: z.literal("TOOL_BINDING"), id: z.string().min(1), toolKey: toolKey.optional(), accessMode: z.enum(["COURSE", "TASK"]).optional(), sortOrder: z.number().int().min(0).max(9999).optional(), status: z.enum(["ACTIVE", "INACTIVE"]).optional() }),
]);

async function courseExists(courseId: string) {
  return db.course.findUnique({ where: { id: courseId }, select: { id: true } });
}

export async function GET(_request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const access = await requireAdminResponse(); if ("response" in access) return access.response;
  const { courseId } = await params;
  const course = await db.course.findUnique({ where: { id: courseId }, select: { id: true, name: true, modules: { orderBy: { sortOrder: "asc" }, include: { lessons: { orderBy: { sortOrder: "asc" } } } }, toolBindings: { orderBy: { sortOrder: "asc" }, include: { lesson: { select: { title: true } } } } } }).catch(() => null);
  if (!course) return Response.json({ error: "课程不存在。" }, { status: 404 });
  return Response.json({ course });
}

export async function POST(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const access = await requireAdminResponse(); if ("response" in access) return access.response;
  const parsed = createSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return Response.json({ error: "课程结构信息无效。" }, { status: 400 });
  const { courseId } = await params; if (!await courseExists(courseId)) return Response.json({ error: "课程不存在。" }, { status: 404 });
  try {
    let item: unknown;
    if (parsed.data.kind === "MODULE") { const { kind: _kind, ...data } = parsed.data; item = await db.courseModule.create({ data: { courseId, ...data } }); }
    if (parsed.data.kind === "LESSON") { const { kind: _kind, ...data } = parsed.data; const module = await db.courseModule.findFirst({ where: { id: data.moduleId, courseId }, select: { id: true } }); if (!module) return Response.json({ error: "模块不属于当前课程。" }, { status: 400 }); item = await db.lesson.create({ data }); }
    if (parsed.data.kind === "TOOL_BINDING") { const { kind: _kind, ...data } = parsed.data; if (data.lessonId) { const lesson = await db.lesson.findFirst({ where: { id: data.lessonId, module: { courseId } }, select: { id: true } }); if (!lesson) return Response.json({ error: "课时不属于当前课程。" }, { status: 400 }); } item = await db.courseToolBinding.create({ data: { ...data, courseId } }); }
    await db.auditLog.create({ data: { actorId: access.account.id, action: `CURRICULUM_${parsed.data.kind}_CREATED`, targetType: "COURSE", targetId: courseId, result: "SUCCEEDED", after: JSON.parse(JSON.stringify(parsed.data)) as Prisma.InputJsonValue } });
    return Response.json({ item }, { status: 201 });
  } catch { return internalError(); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const access = await requireAdminResponse(); if ("response" in access) return access.response;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return Response.json({ error: "课程结构信息无效。" }, { status: 400 });
  const { courseId } = await params;
  try {
    const { kind, id, ...data } = parsed.data;
    let item: unknown;
    if (kind === "MODULE") { const module = await db.courseModule.findFirst({ where: { id, courseId }, select: { id: true } }); if (!module) return Response.json({ error: "模块不属于当前课程。" }, { status: 404 }); item = await db.courseModule.update({ where: { id }, data }); }
    if (kind === "LESSON") { const lesson = await db.lesson.findFirst({ where: { id, module: { courseId } }, select: { id: true } }); if (!lesson) return Response.json({ error: "课时不属于当前课程。" }, { status: 404 }); item = await db.lesson.update({ where: { id }, data }); }
    if (kind === "TOOL_BINDING") { const binding = await db.courseToolBinding.findFirst({ where: { id, courseId }, select: { id: true } }); if (!binding) return Response.json({ error: "工具绑定不属于当前课程。" }, { status: 404 }); item = await db.courseToolBinding.update({ where: { id }, data }); }
    await db.auditLog.create({ data: { actorId: access.account.id, action: `CURRICULUM_${kind}_UPDATED`, targetType: "COURSE", targetId: courseId, result: "SUCCEEDED", after: JSON.parse(JSON.stringify(parsed.data)) as Prisma.InputJsonValue } });
    return Response.json({ item });
  } catch { return internalError(); }
}
