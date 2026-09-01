import { AccountType } from "@prisma/client";
import { db } from "@/lib/db";

export function activeEnrollmentWhere(accountId: string) {
  const now = new Date();
  return { accountId, status: "ACTIVE", startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] };
}

export async function getLearningDashboard(accountId: string) {
  return db.enrollment.findMany({ where: activeEnrollmentWhere(accountId), include: { course: { include: { category: true, modules: { orderBy: { sortOrder: "asc" }, where: { publishStatus: "PUBLISHED" }, include: { lessons: { orderBy: { sortOrder: "asc" }, where: { publishStatus: "PUBLISHED" } } } } } } }, orderBy: { updatedAt: "desc" } });
}

export async function getEnrollmentForCourse(accountId: string, courseSlug: string) {
  return db.enrollment.findFirst({ where: { ...activeEnrollmentWhere(accountId), course: { slug: courseSlug, publishStatus: "PUBLISHED" } }, include: { course: { include: { category: true, modules: { orderBy: { sortOrder: "asc" }, where: { publishStatus: "PUBLISHED" }, include: { lessons: { orderBy: { sortOrder: "asc" }, where: { publishStatus: "PUBLISHED" } } } } } } } });
}

export function canUseLearningCenter(type: AccountType) {
  return type === AccountType.PERSONAL;
}

export function serializeLearningEnrollment(enrollment: Awaited<ReturnType<typeof getLearningDashboard>>[number]) {
  return { id: enrollment.id, startsAt: enrollment.startsAt, endsAt: enrollment.endsAt, status: enrollment.status, progressPercent: enrollment.progressPercent, course: { id: enrollment.course.id, name: enrollment.course.name, slug: enrollment.course.slug, shortDescription: enrollment.course.shortDescription, gradeRange: enrollment.course.gradeRange, durationText: enrollment.course.durationText, category: enrollment.course.category.name, modules: enrollment.course.modules.map((module) => ({ id: module.id, title: module.title, description: module.description, lessons: module.lessons.map((lesson) => ({ id: lesson.id, title: lesson.title, summary: lesson.summary, estimatedMinutes: lesson.estimatedMinutes })) })) } };
}
