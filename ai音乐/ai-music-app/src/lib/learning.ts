import { db } from "@/lib/db";
import { activeEnrollmentWhere, canUseLearningCenter } from "@/lib/learning-policy";

export { activeEnrollmentWhere, canUseLearningCenter } from "@/lib/learning-policy";

export async function getLearningDashboard(accountId: string) {
  return db.enrollment.findMany({ where: activeEnrollmentWhere(accountId), include: { course: { include: { category: true, modules: { orderBy: { sortOrder: "asc" }, where: { publishStatus: "PUBLISHED" }, include: { lessons: { orderBy: { sortOrder: "asc" }, where: { publishStatus: "PUBLISHED" } } } } } } }, orderBy: { updatedAt: "desc" } });
}

export async function getLearningDashboardSummary(accountId: string) {
  const enrollments = await getLearningDashboard(accountId);
  const courseIds = enrollments.map((enrollment) => enrollment.courseId);
  const [recentAccesses, toolBindings, recentWorks] = await Promise.all([
    courseIds.length ? db.coursewareAccessLog.findMany({ where: { accountId, asset: { courseId: { in: courseIds }, publishStatus: "PUBLISHED" } }, include: { asset: { select: { id: true, title: true, assetType: true, course: { select: { slug: true, name: true } } } } }, orderBy: { accessedAt: "desc" }, take: 20 }) : Promise.resolve([]),
    courseIds.length ? db.courseToolBinding.findMany({ where: { courseId: { in: courseIds }, status: "ACTIVE" }, select: { courseId: true, lessonId: true, toolKey: true, sortOrder: true }, orderBy: [{ courseId: "asc" }, { sortOrder: "asc" }] }) : Promise.resolve([]),
    db.work.findMany({ where: { ownerId: accountId, status: { not: "DELETED" } }, select: { id: true, title: true, type: true, updatedAt: true }, orderBy: { updatedAt: "desc" }, take: 3 }),
  ]);
  const seenAssetIds = new Set<string>();
  const recentCourseware = recentAccesses.filter((access) => (seenAssetIds.has(access.assetId) ? false : (seenAssetIds.add(access.assetId), true))).slice(0, 4);
  const seenTools = new Set<string>();
  const courseTools = toolBindings.filter((binding) => { const key = `${binding.courseId}:${binding.toolKey}:${binding.lessonId ?? "course"}`; return seenTools.has(key) ? false : (seenTools.add(key), true); }).slice(0, 6);
  return { enrollments, recentCourseware, courseTools, recentWorks };
}

export async function getEnrollmentForCourse(accountId: string, courseSlug: string) {
  return db.enrollment.findFirst({ where: { ...activeEnrollmentWhere(accountId), course: { slug: courseSlug, publishStatus: "PUBLISHED" } }, include: { course: { include: { category: true, toolBindings: { where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" } }, modules: { orderBy: { sortOrder: "asc" }, where: { publishStatus: "PUBLISHED" }, include: { lessons: { orderBy: { sortOrder: "asc" }, where: { publishStatus: "PUBLISHED" } } } } } } } });
}

export function serializeLearningEnrollment(enrollment: Awaited<ReturnType<typeof getLearningDashboard>>[number]) {
  return { id: enrollment.id, startsAt: enrollment.startsAt, endsAt: enrollment.endsAt, status: enrollment.status, progressPercent: enrollment.progressPercent, course: { id: enrollment.course.id, name: enrollment.course.name, slug: enrollment.course.slug, shortDescription: enrollment.course.shortDescription, gradeRange: enrollment.course.gradeRange, durationText: enrollment.course.durationText, category: enrollment.course.category.name, modules: enrollment.course.modules.map((module) => ({ id: module.id, title: module.title, description: module.description, lessons: module.lessons.map((lesson) => ({ id: lesson.id, title: lesson.title, summary: lesson.summary, estimatedMinutes: lesson.estimatedMinutes })) })) } };
}
