import { db } from "@/lib/db";
import { activeEnrollmentWhere } from "@/lib/learning";

export type CourseToolContext = {
  courseId: string;
  lessonId: string;
  courseName: string;
  lessonTitle: string;
  lessonTask: string | null;
};

export async function resolveCourseToolContext(accountId: string, toolKey: string, courseId: string | null, lessonId: string | null): Promise<CourseToolContext | null> {
  if (!courseId && !lessonId) return null;
  if (!courseId || !lessonId || courseId.length > 128 || lessonId.length > 128) throw new Error("COURSE_CONTEXT_INVALID");
  const enrollment = await db.enrollment.findFirst({ where: { ...activeEnrollmentWhere(accountId), courseId }, select: { id: true } });
  if (!enrollment) throw new Error("COURSE_ENROLLMENT_INACTIVE");
  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, publishStatus: "PUBLISHED", module: { courseId } },
    select: { id: true, title: true, summary: true, content: true, module: { select: { course: { select: { name: true } } } } },
  });
  if (!lesson) throw new Error("COURSE_LESSON_UNAVAILABLE");
  const binding = await db.courseToolBinding.findFirst({
    where: { courseId, status: "ACTIVE", OR: [{ lessonId }, { lessonId: null }], ...(toolKey === "chat" ? {} : { toolKey }) },
    select: { id: true },
  });
  if (!binding) throw new Error("COURSE_TOOL_NOT_BOUND");
  return { courseId, lessonId, courseName: lesson.module.course.name, lessonTitle: lesson.title, lessonTask: (lesson.content || lesson.summary || null)?.slice(0, 1_500) ?? null };
}
