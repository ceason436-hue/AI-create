import { randomBytes } from "crypto";
import { InvitationStatus } from "@prisma/client";
import { z } from "zod";
import { requireAdminResponse } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { hashInvitationCode } from "@/lib/invitations";
import { conflict, internalError } from "@/lib/http";

const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function createInvitationCode() {
  const bytes = randomBytes(10);
  return `TRN${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("")}`;
}

const invitationSchema = z
  .object({
    cohortId: z.string().cuid(),
    planId: z.string().cuid(),
    maxUses: z.number().int().min(1).max(10_000),
    validFrom: z.string().datetime().optional(),
    expiresAt: z.string().datetime().optional(),
    entitlementDays: z.number().int().min(1).max(3_650).optional(),
  })
  .superRefine(({ validFrom, expiresAt }, context) => {
    if (validFrom && expiresAt && new Date(validFrom) >= new Date(expiresAt))
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "邀请码失效时间必须晚于生效时间。",
      });
  });

export async function GET() {
  const access = await requireAdminResponse();
  if ("response" in access) return access.response;
  const invitations = await db.invitationCode.findMany({
    include: { cohort: { include: { organization: true } }, plan: true },
    orderBy: { expiresAt: "desc" },
  });
  return Response.json({
    invitations: invitations.map((invitation) => ({
      id: invitation.id,
      cohortId: invitation.cohortId,
      planId: invitation.planId,
      status: invitation.status,
      maxUses: invitation.maxUses,
      usedCount: invitation.usedCount,
      validFrom: invitation.validFrom,
      expiresAt: invitation.expiresAt,
      entitlementDays: invitation.entitlementDays,
      cohort: invitation.cohort,
      plan: invitation.plan
        ? {
            ...invitation.plan,
            storageLimitBytes: invitation.plan.storageLimitBytes.toString(),
          }
        : null,
    })),
  });
}

export async function POST(request: Request) {
  const access = await requireAdminResponse();
  if ("response" in access) return access.response;
  try {
    const parsed = invitationSchema.safeParse(await request.json());
    if (!parsed.success)
      return Response.json({ error: "邀请码信息无效。" }, { status: 400 });
    const [cohort, plan] = await Promise.all([
      db.cohort.findUnique({ where: { id: parsed.data.cohortId } }),
      db.plan.findUnique({ where: { id: parsed.data.planId } }),
    ]);
    if (!cohort || !plan || plan.status !== "ACTIVE")
      return Response.json(
        { error: "培训班或权益模板不可用。" },
        { status: 400 },
      );

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = createInvitationCode();
      try {
        const invitation = await db.invitationCode.create({
          data: {
            codeHash: hashInvitationCode(code),
            cohortId: cohort.id,
            planId: plan.id,
            status: InvitationStatus.ACTIVE,
            maxUses: parsed.data.maxUses,
            validFrom: parsed.data.validFrom
              ? new Date(parsed.data.validFrom)
              : null,
            expiresAt: parsed.data.expiresAt
              ? new Date(parsed.data.expiresAt)
              : null,
            entitlementDays: parsed.data.entitlementDays,
            createdById: access.account.id,
          },
        });
        await db.auditLog.create({
          data: {
            actorId: access.account.id,
            action: "INVITATION_CREATED",
            targetType: "INVITATION",
            targetId: invitation.id,
            result: "SUCCEEDED",
            after: {
              cohortId: cohort.id,
              planId: plan.id,
              maxUses: invitation.maxUses,
            },
          },
        });
        return Response.json(
          {
            invitation: {
              id: invitation.id,
              cohortId: invitation.cohortId,
              planId: invitation.planId,
              maxUses: invitation.maxUses,
              expiresAt: invitation.expiresAt,
            },
            code,
          },
          { status: 201 },
        );
      } catch (error) {
        if (!(error instanceof Error)) throw error;
      }
    }
    return conflict("邀请码生成冲突，请重试。");
  } catch {
    return internalError();
  }
}
