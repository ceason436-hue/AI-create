import { hash } from "bcryptjs";
import { AccountSource, AccountStatus, AccountType, EntitlementSource, Prisma } from "@prisma/client";
import { z } from "zod";
import { createSession } from "@/lib/auth";
import { AI_TOOLS } from "@/lib/ai-gateway";
import { db } from "@/lib/db";
import { badRequest, conflict, internalError, serviceUnavailable, tooManyRequests } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";

const FREE_PLAN_CODE = "FREE";
const FREE_STORAGE_BYTES = BigInt(200 * 1024 * 1024);

const registrationSchema = z.object({
  loginIdentifier: z.string().trim().min(3).max(64).regex(/^[A-Za-z0-9_]+$/),
  password: z.string().min(8).max(128),
  displayName: z.string().trim().max(80).optional(),
}).superRefine(({ password }, context) => {
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["password"], message: "密码需同时包含字母和数字。" });
  }
});

async function getOrCreateFreePlan(tx: Prisma.TransactionClient) {
  const existing = await tx.plan.findFirst({
    where: { code: FREE_PLAN_CODE, status: "ACTIVE" },
    orderBy: { version: "desc" },
  });
  if (existing) return existing;

  return tx.plan.upsert({
    where: { code_version: { code: FREE_PLAN_CODE, version: 1 } },
    update: { status: "ACTIVE" },
    create: {
      code: FREE_PLAN_CODE,
      version: 1,
      name: "免费体验",
      storageLimitBytes: FREE_STORAGE_BYTES,
      monthlyCredits: 0,
      allowedTools: [...AI_TOOLS],
      status: "ACTIVE",
    },
  });
}

export async function POST(request: Request) {
  try {
    if (!await enforceRateLimit(request, "public-register", 5, 3_600)) return tooManyRequests("注册尝试过于频繁，请稍后重试。");
    const parsed = registrationSchema.safeParse(await request.json());
    if (!parsed.success) return badRequest("注册信息无效，请检查用户名和密码。");
    const identifier = parsed.data.loginIdentifier.toUpperCase();

    const account = await db.$transaction(async (tx) => {
      const existing = await tx.account.findUnique({ where: { loginIdentifier: identifier } });
      if (existing) throw new Error("ACCOUNT_EXISTS");
      const plan = await getOrCreateFreePlan(tx);
      const created = await tx.account.create({
        data: {
          type: AccountType.PERSONAL,
          source: AccountSource.PUBLIC_SIGNUP,
          loginIdentifier: identifier,
          passwordHash: await hash(parsed.data.password, 12),
          status: AccountStatus.ACTIVE,
          profile: parsed.data.displayName ? { create: { displayName: parsed.data.displayName } } : undefined,
        },
      });
      await tx.entitlement.create({
        data: {
          accountId: created.id,
          source: EntitlementSource.FREE_PLAN,
          planId: plan.id,
          startsAt: new Date(),
        },
      });
      await tx.creditWallet.create({ data: { accountId: created.id, balance: plan.monthlyCredits } });
      if (plan.monthlyCredits > 0) {
        await tx.creditLedger.create({ data: { accountId: created.id, delta: plan.monthlyCredits, reason: "FREE_PLAN_GRANTED", referenceType: "PLAN", referenceId: plan.id } });
      }
      await tx.auditLog.create({
        data: {
          actorId: created.id,
          action: "PUBLIC_ACCOUNT_REGISTERED",
          targetType: "ACCOUNT",
          targetId: created.id,
          result: "SUCCEEDED",
          after: { planId: plan.id, planCode: plan.code, planVersion: plan.version },
        },
      });
      return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    await createSession(account);
    return Response.json({ account: { type: account.type, loginIdentifier: account.loginIdentifier } }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "RATE_LIMIT_UNAVAILABLE") return serviceUnavailable("注册保护服务暂不可用，请稍后重试。");
    if (error instanceof Error && error.message === "ACCOUNT_EXISTS") return conflict("用户名已存在，请更换用户名。");
    return internalError();
  }
}
