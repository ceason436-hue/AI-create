import { z } from "zod";
import { db } from "@/lib/db";
import { getPersonalWorkAccess } from "@/lib/works";
import { resolveWorkCourseContext } from "@/lib/work-course-context";
import { forbidden, internalError, unauthorized } from "@/lib/http";

const schema = z.object({ courseId: z.string().min(1), lessonId: z.string().min(1).nullable().optional() });

export async function PATCH(request: Request, { params }: { params: Promise<{ workId: string }> }) {
  try {
    const access = await getPersonalWorkAccess();
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: "课程作品归属信息无效。" }, { status: 400 });
    const { workId } = await params;
    const [work, context] = await Promise.all([
      db.work.findFirst({ where: { id: workId, ownerId: access.accountId, status: { not: "DELETED" } }, select: { id: true } }),
      resolveWorkCourseContext(access.accountId, parsed.data.courseId, parsed.data.lessonId),
    ]);
    if (!work) return Response.json({ error: "作品不存在。" }, { status: 404 });
    if (!context) return forbidden("只能关联到本人报名有效且已发布的课程与课时。");
    const courseContext = await db.$transaction(async (tx) => {
      const saved = await tx.workCourseContext.upsert({ where: { workId }, update: { courseId: context.courseId, lessonId: context.lessonId, enrollmentId: context.enrollmentId, contextType: "MANUAL_LINK" }, create: { workId, ...context, contextType: "MANUAL_LINK" }, include: { course: { select: { name: true, slug: true } }, lesson: { select: { title: true } } } });
      await tx.auditLog.create({ data: { actorId: access.accountId, action: "WORK_COURSE_CONTEXT_LINKED", targetType: "WORK", targetId: workId, result: "SUCCEEDED", after: { courseId: context.courseId, lessonId: context.lessonId, contextType: "MANUAL_LINK" } } });
      return saved;
    });
    return Response.json({ courseContext });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") return unauthorized();
    if (error instanceof Error && error.message === "FORBIDDEN") return forbidden("学校课堂账号不能使用云端作品库。");
    return internalError();
  }
}
