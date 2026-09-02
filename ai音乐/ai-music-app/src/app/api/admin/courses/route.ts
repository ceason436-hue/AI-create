import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { requireAdminResponse } from "@/lib/admin-access";
import { coursePublicationIssues } from "@/lib/course-publication-policy";
import { db } from "@/lib/db";
import { internalError } from "@/lib/http";

const lessonSchema = z.object({ title: z.string().trim().min(1).max(180), summary: z.string().trim().max(500).optional(), content: z.string().trim().max(20_000).optional(), estimatedMinutes: z.number().int().min(1).max(480).optional() });
const moduleSchema = z.object({ title: z.string().trim().min(1).max(180), description: z.string().trim().max(500).optional(), lessons: z.array(lessonSchema).max(50).optional() });
const schema = z.object({ categoryId: z.string().min(1), name: z.string().trim().min(1).max(180), slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{2,180}$/), shortDescription: z.string().trim().min(1).max(500), fullDescription: z.string().trim().max(20_000).optional(), targetAudience: z.string().trim().max(500).optional(), gradeRange: z.string().trim().max(80).optional(), difficulty: z.string().trim().max(32).optional(), deliveryModes: z.array(z.string().trim().min(1).max(32)).max(8).default([]), durationText: z.string().trim().max(80).optional(), enrollmentStatus: z.string().trim().max(32).default("OPEN"), coverAssetId: z.string().optional(), publishStatus: z.enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]).default("DRAFT"), modules: z.array(moduleSchema).max(30).optional() });

type AdminCourse = Prisma.CourseGetPayload<{ include: { category: true; modules: { include: { lessons: true } } } }>;
function serializeCourse(course: AdminCourse) { return { ...course, modules: course.modules.map((module) => ({ ...module, lessons: module.lessons })) }; }

export async function GET() {
  const access = await requireAdminResponse(); if ("response" in access) return access.response;
  try {
    const courses = await db.course.findMany({ include: { category: true, modules: { orderBy: { sortOrder: "asc" }, include: { lessons: { orderBy: { sortOrder: "asc" } } } } }, orderBy: { updatedAt: "desc" } });
    return Response.json({ courses: courses.map(serializeCourse) });
  } catch { return internalError(); }
}

export async function POST(request: Request) {
  const access = await requireAdminResponse(); if ("response" in access) return access.response;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "课程信息无效。" }, { status: 400 });
  const { modules = [], ...courseData } = parsed.data;
  if (parsed.data.publishStatus === "PUBLISHED") {
    const issues = coursePublicationIssues({ targetAudience: parsed.data.targetAudience, coverAssetId: parsed.data.coverAssetId, publishedModuleCount: modules.length });
    if (issues.length) return Response.json({ error: "课程尚未满足发布条件。", issues }, { status: 400 });
  }
  try {
    const course = await db.$transaction(async (tx) => {
      const created = await tx.course.create({ data: { ...courseData, createdBy: access.account.id, updatedBy: access.account.id, publishedAt: parsed.data.publishStatus === "PUBLISHED" ? new Date() : undefined, modules: { create: modules.map((module, moduleIndex) => ({ title: module.title, description: module.description, sortOrder: moduleIndex, publishStatus: parsed.data.publishStatus === "PUBLISHED" ? "PUBLISHED" : "DRAFT", lessons: { create: (module.lessons ?? []).map((lesson, lessonIndex) => ({ title: lesson.title, summary: lesson.summary, content: lesson.content, estimatedMinutes: lesson.estimatedMinutes ?? 45, sortOrder: lessonIndex, publishStatus: parsed.data.publishStatus === "PUBLISHED" ? "PUBLISHED" : "DRAFT" })) } })) } }, include: { category: true, modules: { include: { lessons: true } } } });
      await tx.auditLog.create({ data: { actorId: access.account.id, action: "COURSE_CREATED", targetType: "COURSE", targetId: created.id, result: "SUCCEEDED", after: { name: created.name, slug: created.slug, publishStatus: created.publishStatus } } });
      return created;
    });
    return Response.json({ course: serializeCourse(course) }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) return Response.json({ error: "课程 slug 已存在。" }, { status: 409 });
    return internalError();
  }
}
