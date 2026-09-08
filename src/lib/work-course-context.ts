import { db } from "@/lib/db";
import { activeEnrollmentWhere } from "@/lib/learning";

export async function resolveWorkCourseContext(accountId: string, courseId: string, lessonId?: string | null) {
  const enrollment = await db.enrollment.findFirst({ where: { ...activeEnrollmentWhere(accountId), courseId, course: { publishStatus: "PUBLISHED" } }, select: { id: true, courseId: true } });
  if (!enrollment) return null;
  if (lessonId) {
    const lesson = await db.lesson.findFirst({ where: { id: lessonId, publishStatus: "PUBLISHED", module: { courseId } }, select: { id: true } });
    if (!lesson) return null;
  }
  return { enrollmentId: enrollment.id, courseId, lessonId: lessonId ?? null };
}
