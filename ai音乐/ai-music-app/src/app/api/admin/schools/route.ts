import { AccountSource, AccountType, OrganizationStatus, OrganizationType, Prisma } from "@prisma/client";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { forbidden, internalError, unauthorized } from "@/lib/http";
import { accountStatusForOrganization, createUniqueSchoolPassword, isAiTool, nextSchoolLoginIdentifier, passwordHash } from "@/lib/school-admin";

const schoolInputSchema = z.object({
  name: z.string().trim().min(2).max(160),
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_]{2,32}$/),
  notes: z.string().trim().max(2_000).optional(),
  allowedTools: z.array(z.enum(["chat", "code", "image", "music", "music_query", "vision"])).max(6).default([]),
  validFrom: z.string().datetime().optional(),
  validTo: z.string().datetime().optional(),
}).superRefine(({ validFrom, validTo }, context) => {
  if (validFrom && validTo && new Date(validFrom) >= new Date(validTo)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "合作结束时间必须晚于开始时间。" });
  }
});

export async function GET() {
  try {
    await requireSuperAdmin();
    const schools = await db.organization.findMany({
      where: { type: OrganizationType.SCHOOL },
      include: { accounts: { include: { account: { select: { loginIdentifier: true, status: true, lastLoginAt: true } } } } },
      orderBy: { createdAt: "asc" },
    });
    return Response.json({ schools: schools.map((school) => ({
      id: school.id,
      name: school.name,
      code: school.code,
      status: school.status,
      notes: school.notes,
      accounts: school.accounts.map(({ account, allowedTools, validFrom, validTo }) => ({
        loginIdentifier: account.loginIdentifier,
        status: account.status,
        lastLoginAt: account.lastLoginAt,
        allowedTools,
        validFrom,
        validTo,
      })),
    })) });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") return unauthorized();
    if (error instanceof Error && error.message === "FORBIDDEN") return forbidden();
    return internalError();
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireSuperAdmin();
    const parsed = schoolInputSchema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: "学校信息无效。" }, { status: 400 });
    if (!parsed.data.allowedTools.every(isAiTool)) return Response.json({ error: "学校工具配置无效。" }, { status: 400 });

    const result = await db.$transaction(async (tx) => {
      const loginIdentifier = await nextSchoolLoginIdentifier(tx);
      const initialPassword = await createUniqueSchoolPassword(tx);
      const school = await tx.organization.create({
        data: {
          type: OrganizationType.SCHOOL,
          name: parsed.data.name,
          code: parsed.data.code,
          notes: parsed.data.notes,
          status: OrganizationStatus.ACTIVE,
        },
      });
      const account = await tx.account.create({
        data: {
          type: AccountType.SCHOOL_SHARED,
          source: AccountSource.SCHOOL_SETUP,
          loginIdentifier,
          passwordHash: await passwordHash(initialPassword),
          status: accountStatusForOrganization(school.status),
        },
      });
      await tx.organizationAccount.create({
        data: {
          organizationId: school.id,
          accountId: account.id,
          allowedTools: parsed.data.allowedTools,
          validFrom: parsed.data.validFrom ? new Date(parsed.data.validFrom) : null,
          validTo: parsed.data.validTo ? new Date(parsed.data.validTo) : null,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: "SCHOOL_CREATED",
          targetType: "ORGANIZATION",
          targetId: school.id,
          result: "SUCCEEDED",
          after: { code: school.code, loginIdentifier, allowedTools: parsed.data.allowedTools },
        },
      });
      return { school, loginIdentifier, initialPassword };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return Response.json({
      school: { id: result.school.id, name: result.school.name, code: result.school.code },
      account: { loginIdentifier: result.loginIdentifier, initialPassword: result.initialPassword },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") return unauthorized();
    if (error instanceof Error && error.message === "FORBIDDEN") return forbidden();
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json({ error: "学校代码已存在，请更换学校代码。" }, { status: 409 });
    }
    return internalError();
  }
}
