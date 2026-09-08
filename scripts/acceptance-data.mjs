import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import nextEnv from "@next/env";

const { hash } = bcrypt;

nextEnv.loadEnvConfig(process.cwd());
const db = new PrismaClient();
const statePath = path.resolve("D:/\.codex/AI-create/acceptance/acceptance-state.json");
const mode = process.argv[2] ?? "seed";
const marker = "AUTOMATED_SYNTHETIC_TEST_DATA";

async function clean(state) {
  const runId = state?.runId;
  if (!runId) return;
  const loginIdentifiers = Object.values(state.accounts ?? {}).map((entry) => entry.loginIdentifier);
  await db.$transaction(async (tx) => {
    await tx.activity.deleteMany({ where: { slug: `acceptance-activity-${runId}` } });
    await tx.achievement.deleteMany({ where: { slug: `acceptance-achievement-${runId}` } });
    await tx.course.deleteMany({ where: { slug: `acceptance-course-${runId}` } });
    await tx.courseCategory.deleteMany({ where: { slug: `acceptance-category-${runId}` } });
    await tx.account.deleteMany({ where: { loginIdentifier: { in: loginIdentifiers } } });
    await tx.organization.deleteMany({ where: { code: { in: [`SCH${runId}`, `TRN${runId}`] } } });
    await tx.plan.deleteMany({ where: { code: `ACC-${runId}` } });
    await tx.auditLog.create({ data: { action: "ACCEPTANCE_FIXTURE_CLEANED", targetType: "ACCEPTANCE_FIXTURE", targetId: runId, result: "SUCCEEDED", after: { marker } } });
  });
}

try {
  if (mode === "clean") {
    const state = JSON.parse(await readFile(statePath, "utf8").catch(() => "null"));
    await clean(state);
    await rm(statePath, { force: true });
    console.log("Synthetic acceptance data cleaned; audit evidence retained.");
  } else if (mode === "seed") {
    const previous = JSON.parse(await readFile(statePath, "utf8").catch(() => "null"));
    if (previous) await clean(previous);
    const runId = Date.now().toString(36).slice(-6).toUpperCase();
    const password = `Krt-${randomBytes(12).toString("base64url")}!`;
    const invitationCode = `KRT-ACC-${randomBytes(6).toString("hex").toUpperCase()}`;
    const expiredSessionToken = randomBytes(32).toString("base64url");
    const passwordHash = await hash(password, 12);
    const accounts = {
      admin: { loginIdentifier: `ACC_ADMIN_${runId}`, password },
      personal: { loginIdentifier: `ACC_PERSONAL_${runId}`, password },
      school: { loginIdentifier: `ACC_SCHOOL_${runId}`, password },
      training: { loginIdentifier: `ACC_TRAINING_${runId}`, password },
      suspended: { loginIdentifier: `ACC_SUSPENDED_${runId}`, password },
      trainingCandidate: { loginIdentifier: `ACC_CANDIDATE_${runId}`, password },
    };
    const fixture = await db.$transaction(async (tx) => {
      const role = await tx.role.upsert({ where: { key: "SUPER_ADMIN" }, update: {}, create: { key: "SUPER_ADMIN", name: "超级管理员" } });
      const plan = await tx.plan.create({ data: { code: `ACC-${runId}`, version: 1, name: `${marker} 验收套餐`, storageLimitBytes: BigInt(200 * 1024 * 1024), monthlyCredits: 10_000, allowedTools: ["chat", "code", "image", "music", "reading"] } });
      const admin = await tx.account.create({ data: { type: "ADMIN", source: "ADMIN_CREATED", loginIdentifier: accounts.admin.loginIdentifier, passwordHash, status: "ACTIVE", roles: { create: { roleId: role.id } } } });
      const personal = await tx.account.create({ data: { type: "PERSONAL", source: "PUBLIC_SIGNUP", loginIdentifier: accounts.personal.loginIdentifier, passwordHash, status: "ACTIVE", profile: { create: { displayName: `${marker} 社会学员` } }, wallet: { create: { balance: 10_000 } }, entitlements: { create: { source: "FREE_PLAN", status: "ACTIVE", planId: plan.id, startsAt: new Date() } } } });
      await tx.session.create({ data: { accountId: personal.id, tokenHash: createHash("sha256").update(expiredSessionToken).digest("hex"), expiresAt: new Date(Date.now() - 60_000), deviceSummary: marker } });
      const training = await tx.account.create({ data: { type: "PERSONAL", source: "TRAINING_INVITE", loginIdentifier: accounts.training.loginIdentifier, passwordHash, status: "ACTIVE", profile: { create: { displayName: `${marker} 培训学员` } }, wallet: { create: { balance: 10_000 } }, entitlements: { create: { source: "TRAINING_INVITE", status: "ACTIVE", planId: plan.id, startsAt: new Date() } } } });
      await tx.account.create({ data: { type: "PERSONAL", source: "PUBLIC_SIGNUP", loginIdentifier: accounts.suspended.loginIdentifier, passwordHash, status: "SUSPENDED" } });
      const schoolOrg = await tx.organization.create({ data: { type: "SCHOOL", name: `${marker} 虚构未来学校`, code: `SCH${runId}`, notes: marker } });
      await tx.account.create({ data: { type: "SCHOOL_SHARED", source: "SCHOOL_SETUP", loginIdentifier: accounts.school.loginIdentifier, passwordHash, status: "ACTIVE", organizationLinks: { create: { organizationId: schoolOrg.id, allowedTools: ["code", "image", "music", "reading"] } } } });
      const trainingOrg = await tx.organization.create({ data: { type: "TRAINING", name: `${marker} 虚构培训中心`, code: `TRN${runId}`, notes: marker } });
      const cohort = await tx.cohort.create({ data: { organizationId: trainingOrg.id, name: `${marker} 预发布班` } });
      await tx.cohortMember.create({ data: { cohortId: cohort.id, accountId: training.id } });
      await tx.invitationCode.create({ data: { codeHash: createHash("sha256").update(invitationCode).digest("hex"), cohortId: cohort.id, planId: plan.id, status: "ACTIVE", maxUses: 5, validFrom: new Date(Date.now() - 60_000), expiresAt: new Date(Date.now() + 86_400_000), entitlementDays: 30, createdById: admin.id } });
      const category = await tx.courseCategory.create({ data: { name: `${marker} 课程分类`, slug: `acceptance-category-${runId}`, description: marker } });
      const course = await tx.course.create({ data: { categoryId: category.id, name: `${marker} 机器人项目课`, slug: `acceptance-course-${runId}`, shortDescription: "仅用于自动化验收的虚构课程。", fullDescription: marker, targetAudience: "一至六年级合成测试账号", gradeRange: "1-6", deliveryModes: ["ONLINE"], totalLessons: 1, enrollmentStatus: "OPEN", publishStatus: "PUBLISHED", publishedAt: new Date(), createdBy: admin.id, updatedBy: admin.id, modules: { create: { title: `${marker} 模块`, publishStatus: "PUBLISHED", lessons: { create: { title: `${marker} 课时`, summary: "完成一次机器人网页创作。", content: marker, publishStatus: "PUBLISHED" } } } } }, include: { modules: { include: { lessons: true } } } });
      const lesson = course.modules[0].lessons[0];
      await tx.courseAnnouncement.create({ data: { courseId: course.id, title: `${marker} 公告`, content: "这是一条合成验收公告。", publishStatus: "PUBLISHED", publishedAt: new Date(), createdBy: admin.id, updatedBy: admin.id } });
      await tx.courseToolBinding.createMany({ data: ["code", "image", "music", "reading"].map((toolKey, sortOrder) => ({ courseId: course.id, lessonId: lesson.id, toolKey, accessMode: "TASK", status: "ACTIVE", sortOrder })) });
      await tx.enrollment.createMany({ data: [personal.id, training.id].map((accountId) => ({ accountId, courseId: course.id, source: "ACCEPTANCE", status: "ACTIVE", startsAt: new Date(Date.now() - 60_000), createdBy: admin.id })) });
      await tx.activity.create({ data: { slug: `acceptance-activity-${runId}`, title: `${marker} 活动`, summary: "虚构活动，仅用于验收。", content: marker, publishStatus: "PUBLISHED", publishedAt: new Date() } });
      await tx.achievement.create({ data: { slug: `acceptance-achievement-${runId}`, title: `${marker} 成果`, summary: "虚构成果，仅用于验收。", content: marker, publishStatus: "PUBLISHED", publishedAt: new Date() } });
      await tx.auditLog.create({ data: { actorId: admin.id, action: "ACCEPTANCE_FIXTURE_SEEDED", targetType: "ACCEPTANCE_FIXTURE", targetId: runId, result: "SUCCEEDED", after: { marker, courseId: course.id, lessonId: lesson.id } } });
      return { courseId: course.id, lessonId: lesson.id };
    });
    const state = { runId, marker, invitationCode, expiredSessionToken, courseId: fixture.courseId, lessonId: fixture.lessonId, accounts, createdAt: new Date().toISOString() };
    await mkdir(path.dirname(statePath), { recursive: true });
    await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, { encoding: "utf8", flag: "w" });
    console.log(`Synthetic acceptance data seeded for run ${runId}. Credentials stored outside the repository.`);
  } else throw new Error("Usage: node scripts/acceptance-data.mjs [seed|clean]");
} finally {
  await db.$disconnect();
}
