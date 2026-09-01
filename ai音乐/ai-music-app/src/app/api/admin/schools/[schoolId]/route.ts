import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { forbidden, internalError, unauthorized } from "@/lib/http";
import {
  accountStatusForOrganization,
  isAiTool,
  parseSchoolStatus,
} from "@/lib/school-admin";

const updateSchoolSchema = z
  .object({
    name: z.string().trim().min(2).max(160).optional(),
    notes: z.string().trim().max(2_000).nullable().optional(),
    status: z.enum(["ACTIVE", "SUSPENDED", "EXPIRED"]).optional(),
    allowedTools: z
      .array(
        z.enum(["chat", "code", "image", "music", "music_query", "vision"]),
      )
      .max(6)
      .optional(),
    validFrom: z.string().datetime().nullable().optional(),
    validTo: z.string().datetime().nullable().optional(),
  })
  .superRefine(({ validFrom, validTo }, context) => {
    if (validFrom && validTo && new Date(validFrom) >= new Date(validTo)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "合作结束时间必须晚于开始时间。",
      });
    }
  });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ schoolId: string }> },
) {
  try {
    const admin = await requireSuperAdmin();
    const { schoolId } = await params;
    const parsed = updateSchoolSchema.safeParse(await request.json());
    if (!parsed.success)
      return Response.json({ error: "学校更新信息无效。" }, { status: 400 });
    if (parsed.data.allowedTools && !parsed.data.allowedTools.every(isAiTool)) {
      return Response.json({ error: "学校工具配置无效。" }, { status: 400 });
    }

    const result = await db.$transaction(
      async (tx) => {
        const school = await tx.organization.findUnique({
          where: { id: schoolId },
          include: { accounts: { include: { account: true } } },
        });
        if (!school || school.type !== "SCHOOL")
          throw new Error("SCHOOL_NOT_FOUND");
        const organizationAccount = school.accounts[0];
        if (!organizationAccount) throw new Error("SCHOOL_ACCOUNT_NOT_FOUND");

        const nextStatus = parsed.data.status
          ? parseSchoolStatus(parsed.data.status)
          : school.status;
        const updatedSchool = await tx.organization.update({
          where: { id: school.id },
          data: {
            name: parsed.data.name,
            notes: parsed.data.notes,
            status: nextStatus,
          },
        });
        const updatedLink = await tx.organizationAccount.update({
          where: { id: organizationAccount.id },
          data: {
            allowedTools: parsed.data.allowedTools,
            validFrom:
              parsed.data.validFrom === undefined
                ? undefined
                : parsed.data.validFrom
                  ? new Date(parsed.data.validFrom)
                  : null,
            validTo:
              parsed.data.validTo === undefined
                ? undefined
                : parsed.data.validTo
                  ? new Date(parsed.data.validTo)
                  : null,
          },
        });
        if (parsed.data.status) {
          await tx.account.update({
            where: { id: organizationAccount.accountId },
            data: { status: accountStatusForOrganization(nextStatus) },
          });
        }
        await tx.auditLog.create({
          data: {
            actorId: admin.id,
            action: "SCHOOL_UPDATED",
            targetType: "ORGANIZATION",
            targetId: school.id,
            result: "SUCCEEDED",
            before: {
              name: school.name,
              status: school.status,
              allowedTools: organizationAccount.allowedTools,
            },
            after: {
              name: updatedSchool.name,
              status: updatedSchool.status,
              allowedTools: updatedLink.allowedTools,
            },
          },
        });
        return {
          school: updatedSchool,
          account: organizationAccount.account.loginIdentifier,
          link: updatedLink,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return Response.json({
      school: {
        id: result.school.id,
        name: result.school.name,
        code: result.school.code,
        status: result.school.status,
      },
      account: {
        loginIdentifier: result.account,
        allowedTools: result.link.allowedTools,
        validFrom: result.link.validFrom,
        validTo: result.link.validTo,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED")
      return unauthorized();
    if (error instanceof Error && error.message === "FORBIDDEN")
      return forbidden();
    if (
      error instanceof Error &&
      ["SCHOOL_NOT_FOUND", "SCHOOL_ACCOUNT_NOT_FOUND"].includes(error.message)
    ) {
      return Response.json(
        { error: "学校不存在或未配置课堂账号。" },
        { status: 404 },
      );
    }
    return internalError();
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ schoolId: string }> },
) {
  try {
    const admin = await requireSuperAdmin();
    const { schoolId } = await params;
    await db.$transaction(async (tx) => {
      const school = await tx.organization.findUnique({
        where: { id: schoolId },
        include: { accounts: true },
      });
      if (!school || school.type !== "SCHOOL")
        throw new Error("SCHOOL_NOT_FOUND");
      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: "SCHOOL_DELETED",
          targetType: "ORGANIZATION",
          targetId: school.id,
          result: "SUCCEEDED",
          before: { name: school.name, code: school.code },
        },
      });
      await tx.organization.delete({ where: { id: school.id } });
    });
    return Response.json({ deleted: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED")
      return unauthorized();
    if (error instanceof Error && error.message === "FORBIDDEN")
      return forbidden();
    if (error instanceof Error && error.message === "SCHOOL_NOT_FOUND")
      return Response.json({ error: "学校不存在。" }, { status: 404 });
    return internalError();
  }
}
