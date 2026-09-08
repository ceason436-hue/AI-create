import { z } from "zod";
import { AccountType } from "@prisma/client";
import { getCurrentAccount } from "@/lib/auth";
import { db } from "@/lib/db";
import { activeEnrollmentWhere } from "@/lib/learning";
import { learningProgressPercent } from "@/lib/learning-progress-policy";

const schema = z.object({ completed: z.boolean().default(true) });

export async function POST(request: Request, { params }: { params: Promise<{ courseId: string; lessonId: string }> }) {
  const account = await getCurrentAccount().catch(() => null);
  if (!account || account.type !== AccountType.PERSONAL) return Response.json({ error: "请使用个人学员账号登录。" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "学习进度参数无效。" }, { status: 400 });
  const { courseId, lessonId } = await params;
  const enrollment = await db.enrollment.findFirst({ where: { ...activeEnrollmentWhere(account.id), courseId }, select: { id: true } }).catch(() => null);
  if (!enrollment) return Response.json({ error: "当前课程报名无效。" }, { status: 403 });
  const lesson = await db.lesson.findFirst({ where: { id: lessonId, publishStatus: "PUBLISHED", module: { courseId } }, select: { id: true } }).catch(() => null);
  if (!lesson) return Response.json({ error: "课时不存在或尚未发布。" }, { status: 404 });
  try {
    const result = await db.$transaction(async (tx) => {
      const now = new Date();
      const progress = await tx.learningProgress.upsert({ where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId } }, update: { completedAt: parsed.data.completed ? now : null, lastViewedAt: now }, create: { enrollmentId: enrollment.id, lessonId, completedAt: parsed.data.completed ? now : null, lastViewedAt: now } });
      const totalLessons = await tx.lesson.count({ where: { publishStatus: "PUBLISHED", module: { courseId } } });
      const completedLessons = await tx.learningProgress.count({ where: { enrollmentId: enrollment.id, completedAt: { not: null }, lesson: { publishStatus: "PUBLISHED", module: { courseId } } } });
      const progressPercent = learningProgressPercent(completedLessons, totalLessons);
      await tx.enrollment.update({ where: { id: enrollment.id }, data: { progressPercent, lastLessonId: lessonId } });
      await tx.auditLog.create({ data: { actorId: account.id, action: "LEARNING_PROGRESS_UPDATED", targetType: "LESSON", targetId: lessonId, result: "SUCCEEDED", after: { enrollmentId: enrollment.id, completed: parsed.data.completed, progressPercent } } });
      return { progress, progressPercent };
    });
    return Response.json({ completed: Boolean(result.progress.completedAt), progressPercent: result.progressPercent }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return Response.json({ error: "学习进度暂时无法保存。" }, { status: 503 }); }
}
