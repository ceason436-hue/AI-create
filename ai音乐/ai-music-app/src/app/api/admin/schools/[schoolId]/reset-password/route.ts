import { Prisma } from "@prisma/client";
import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { forbidden, internalError, unauthorized } from "@/lib/http";
import { passwordHash } from "@/lib/school-admin";
import { z } from "zod";

const resetPasswordSchema = z.object({
  password: z.string().regex(/^\d{6}$/, "学校密码必须是 6 位数字。"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ schoolId: string }> },
) {
  try {
    const admin = await requireSuperAdmin();
    const { schoolId } = await params;
    const parsed = resetPasswordSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success)
      return Response.json(
        { error: "请输入 6 位数字的新密码。" },
        { status: 400 },
      );
    const result = await db.$transaction(
      async (tx) => {
        const school = await tx.organization.findUnique({
          where: { id: schoolId },
          include: { accounts: true },
        });
        if (!school || school.type !== "SCHOOL" || !school.accounts[0])
          throw new Error("SCHOOL_NOT_FOUND");

        await tx.account.update({
          where: { id: school.accounts[0].accountId },
          data: { passwordHash: await passwordHash(parsed.data.password) },
        });
        await tx.session.updateMany({
          where: { accountId: school.accounts[0].accountId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        await tx.auditLog.create({
          data: {
            actorId: admin.id,
            action: "SCHOOL_PASSWORD_RESET",
            targetType: "ORGANIZATION",
            targetId: school.id,
            result: "SUCCEEDED",
          },
        });
        return {
          loginIdentifier: (
            await tx.account.findUniqueOrThrow({
              where: { id: school.accounts[0].accountId },
            })
          ).loginIdentifier,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return Response.json({
      account: { loginIdentifier: result.loginIdentifier },
    });
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
