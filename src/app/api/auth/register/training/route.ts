import { hash } from "bcryptjs";
import { AccountSource, AccountStatus, AccountType, EntitlementSource, InvitationStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { createSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashInvitationCode, normalizeInvitationCode } from "@/lib/invitations";
import { badRequest, conflict, forbidden, internalError, serviceUnavailable, tooManyRequests } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";

const registrationSchema = z.object({
  loginIdentifier: z.string().trim().min(3).max(64).regex(/^[A-Za-z0-9_]+$/),
  password: z.string().min(8).max(128),
  displayName: z.string().trim().max(80).optional(),
  invitationCode: z.string().trim().min(4).max(128),
}).superRefine(({ password }, context) => {
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["password"], message: "密码需同时包含字母和数字。" });
  }
});

export async function POST(request: Request) {
  try {
    if (!await enforceRateLimit(request, "training-register", 5, 3_600)) return tooManyRequests("注册尝试过于频繁，请稍后重试。");
    const parsed = registrationSchema.safeParse(await request.json());
    if (!parsed.success) return badRequest("注册信息无效，请检查用户名、密码和邀请码。");
    const identifier = parsed.data.loginIdentifier.toUpperCase();
    const codeHash = hashInvitationCode(normalizeInvitationCode(parsed.data.invitationCode));
    const now = new Date();

    const account = await db.$transaction(async (tx) => {
      const invitation = await tx.invitationCode.findUnique({
        where: { codeHash },
        include: { cohort: true, plan: true },
      });
      if (!invitation || invitation.status !== InvitationStatus.ACTIVE) throw new Error("INVITATION_INVALID");
      if ((invitation.validFrom && invitation.validFrom > now) || (invitation.expiresAt && invitation.expiresAt <= now)) {
        throw new Error("INVITATION_EXPIRED");
      }
      if (invitation.usedCount >= invitation.maxUses) throw new Error("INVITATION_EXHAUSTED");
      const existing = await tx.account.findUnique({ where: { loginIdentifier: identifier } });
      if (existing) throw new Error("ACCOUNT_EXISTS");

      const created = await tx.account.create({
        data: {
          type: AccountType.PERSONAL,
          source: AccountSource.TRAINING_INVITE,
          loginIdentifier: identifier,
          passwordHash: await hash(parsed.data.password, 12),
          status: AccountStatus.ACTIVE,
          profile: parsed.data.displayName ? { create: { displayName: parsed.data.displayName } } : undefined,
        },
      });
      const redemption = await tx.invitationRedemption.create({
        data: { invitationId: invitation.id, accountId: created.id },
      }).catch(() => { throw new Error("INVITATION_ALREADY_REDEEMED"); });
      await tx.invitationCode.updateMany({
        where: { id: invitation.id, status: InvitationStatus.ACTIVE, usedCount: { lt: invitation.maxUses } },
        data: { usedCount: { increment: 1 }, status: invitation.usedCount + 1 >= invitation.maxUses ? InvitationStatus.EXHAUSTED : InvitationStatus.ACTIVE },
      });
      const days = invitation.entitlementDays ?? (invitation.cohort.endsAt ? Math.max(1, Math.ceil((invitation.cohort.endsAt.getTime() - now.getTime()) / 86_400_000)) : 30);
      await tx.cohortMember.create({ data: { cohortId: invitation.cohortId, accountId: created.id } });
      await tx.entitlement.create({
        data: {
          accountId: created.id,
          source: EntitlementSource.TRAINING_INVITE,
          planId: invitation.planId,
          startsAt: now,
          endsAt: new Date(now.getTime() + days * 86_400_000),
          metadata: { invitationId: invitation.id, redemptionId: redemption.invitationId },
        },
      });
      const credits = invitation.plan?.monthlyCredits ?? 0;
      await tx.creditWallet.create({ data: { accountId: created.id, balance: credits } });
      if (credits > 0) {
        await tx.creditLedger.create({ data: { accountId: created.id, delta: credits, reason: "TRAINING_ENTITLEMENT_GRANTED", referenceType: "INVITATION", referenceId: invitation.id } });
      }
      await tx.auditLog.create({
        data: {
          actorId: created.id,
          action: "TRAINING_ACCOUNT_REGISTERED",
          targetType: "ACCOUNT",
          targetId: created.id,
          result: "SUCCEEDED",
          after: { invitationId: invitation.id, cohortId: invitation.cohortId },
        },
      });
      return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    await createSession(account);
    return Response.json({ account: { type: account.type, loginIdentifier: account.loginIdentifier } }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "RATE_LIMIT_UNAVAILABLE") return serviceUnavailable("注册保护服务暂不可用，请稍后重试。");
    if (error instanceof Error && error.message === "ACCOUNT_EXISTS") return conflict("用户名已存在，请更换用户名。");
    if (error instanceof Error && error.message === "INVITATION_ALREADY_REDEEMED") return conflict("该邀请码已被此账户兑换。");
    if (error instanceof Error && ["INVITATION_INVALID", "INVITATION_EXPIRED", "INVITATION_EXHAUSTED"].includes(error.message)) {
      return forbidden("邀请码无效、已过期或已达到使用人数上限。");
    }
    return internalError();
  }
}
