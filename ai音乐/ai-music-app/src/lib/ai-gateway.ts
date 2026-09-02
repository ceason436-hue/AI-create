import { createHash, randomUUID } from "crypto";
import { AccountStatus, AccountType, RequestStatus, UsageStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/auth";
import { db } from "@/lib/db";
import { conflict, forbidden, serviceUnavailable, tooManyRequests, unauthorized } from "@/lib/http";
import { getRedis } from "@/lib/redis";
import { getToolCreditCost } from "@/lib/credit-costs";
import { consumeAnonymousTrial, getAnonymousId, hasTrialConsent } from "@/lib/anonymous-trial";
import { CourseToolContext, resolveCourseToolContext } from "@/lib/course-tool-context";
import { AI_TOOLS, type AiTool } from "@/lib/ai-tool-catalog";
import { getActiveAiTool } from "@/lib/ai-tools";

export { AI_TOOLS };
export type { AiTool };

type GatewayAccess = {
  accountId: string;
  requestId?: string;
  redisKey: string;
  reservedCredits: number;
  anonymous?: boolean;
  courseContext?: CourseToolContext | null;
};

type GatewayResult =
  | { ok: true; access: GatewayAccess }
  | { ok: false; response: NextResponse };

const MAX_REQUEST_BYTES = 4 * 1024 * 1024;

function positiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function responseForAccountAccess() {
  return forbidden("当前账号没有该 AI 工具的使用权益。");
}

async function canUseTool(accountId: string, tool: AiTool) {
  const account = await db.account.findUnique({
    where: { id: accountId },
    include: {
      roles: { include: { role: true } },
      organizationLinks: { include: { organization: true } },
      entitlements: {
        where: {
          status: "ACTIVE",
          startsAt: { lte: new Date() },
          OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
        },
        include: { plan: true },
      },
    },
  });
  if (!account || account.status !== AccountStatus.ACTIVE) return false;
  if (account.type === AccountType.ADMIN) {
    return account.roles.some(({ role }) => role.key === "SUPER_ADMIN");
  }
  if (account.type === AccountType.SCHOOL_SHARED) {
    const now = new Date();
    return account.organizationLinks.some(({ allowedTools, organization, validFrom, validTo }) =>
      organization.status === "ACTIVE" &&
      (!validFrom || validFrom <= now) &&
      (!validTo || validTo > now) &&
      allowedTools.includes(tool),
    );
  }
  return account.entitlements.some(({ plan }) => plan?.allowedTools.includes(tool));
}

async function acquireRateLimit(accountId: string, tool: AiTool): Promise<
  | { ok: true; concurrencyKey: string }
  | { ok: false; reason: "rate" | "concurrency" }
> {
  const redis = await getRedis();
  const minute = Math.floor(Date.now() / 60_000);
  const requestLimit = positiveInt(process.env.AI_REQUESTS_PER_MINUTE, 10);
  const concurrencyLimit = positiveInt(process.env.AI_CONCURRENCY_PER_ACCOUNT, 2);
  const rateKey = `krt:ai:rate:${accountId}:${tool}:${minute}`;
  const concurrencyKey = `krt:ai:concurrency:${accountId}:${tool}`;
  const requests = await redis.incr(rateKey);
  if (requests === 1) await redis.expire(rateKey, 60);
  if (requests > requestLimit) return { ok: false, reason: "rate" as const };

  const concurrent = await redis.incr(concurrencyKey);
  if (concurrent === 1) await redis.expire(concurrencyKey, 180);
  if (concurrent > concurrencyLimit) {
    await redis.decr(concurrencyKey);
    return { ok: false, reason: "concurrency" as const };
  }
  return { ok: true, concurrencyKey };
}

async function acquireAnonymousRateLimit(anonymousId: string, tool: AiTool, dailyTrialLimit: number) {
  const trial = await consumeAnonymousTrial(anonymousId, tool, dailyTrialLimit);
  if (!trial.ok) return { ok: false as const, reason: "trial" as const };
  const redis = await getRedis();
  const concurrencyKey = `krt:ai:concurrency:anonymous:${anonymousId}:${tool}`;
  const concurrent = await redis.incr(concurrencyKey);
  if (concurrent === 1) await redis.expire(concurrencyKey, 180);
  if (concurrent > 1) {
    await redis.decr(concurrencyKey);
    return { ok: false as const, reason: "concurrency" as const };
  }
  return { ok: true as const, concurrencyKey };
}

export async function beginAiRequest(request: Request, tool: AiTool, options?: { trackRequest?: boolean }): Promise<GatewayResult> {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return { ok: false, response: NextResponse.json({ error: "请求内容过大。" }, { status: 413 }) };
  }

  const sessionAccount = await getCurrentAccount();
  let accountId: string;
  let anonymous = false;
  let courseContext: CourseToolContext | null = null;
  if (!sessionAccount) {
    if (!await hasTrialConsent()) {
      return { ok: false, response: NextResponse.json({ error: "请先登录，或确认使用访客试用。", trialAvailable: true, trialAcceptPath: "/api/ai/trial" }, { status: 401 }) };
    }
    const anonymousId = await getAnonymousId(true);
    if (!anonymousId) return { ok: false, response: unauthorized() };
    accountId = anonymousId;
    anonymous = true;
  } else {
    if (sessionAccount.status !== AccountStatus.ACTIVE) {
      return { ok: false, response: forbidden("该账号当前不可使用 AI 功能。") };
    }
    accountId = sessionAccount.id;
    try {
      courseContext = await resolveCourseToolContext(accountId, tool, request.headers.get("x-krt-course-id"), request.headers.get("x-krt-lesson-id"));
    } catch {
      return { ok: false, response: forbidden("课程任务上下文无效、报名已失效，或该课时未绑定当前 AI 工具。") };
    }
  }
  if (process.env.AI_GENERATION_ENABLED !== "true") {
    return { ok: false, response: serviceUnavailable("AI 生成功能当前已暂停。") };
  }
  let configuredTool;
  try {
    configuredTool = await getActiveAiTool(tool);
  } catch {
    return { ok: false, response: serviceUnavailable("AI 工具目录暂不可用，已拒绝本次请求。") };
  }
  if (!configuredTool || configuredTool.status !== "ACTIVE") {
    return { ok: false, response: serviceUnavailable("该 AI 工具当前已由运营后台暂停。") };
  }
  if (anonymous && !configuredTool.allowAnonymousTrial) {
    return { ok: false, response: forbidden("该 AI 工具暂不提供访客试用，请登录后继续。") };
  }
  if (!anonymous && !await canUseTool(accountId, tool)) {
    return { ok: false, response: responseForAccountAccess() };
  }

  let rateLimit;
  try {
    rateLimit = anonymous ? await acquireAnonymousRateLimit(accountId, tool, configuredTool.dailyTrialLimit) : await acquireRateLimit(accountId, tool);
  } catch {
    return { ok: false, response: serviceUnavailable("AI 服务的限流组件暂不可用。") };
  }
  if (!rateLimit.ok) {
    return {
      ok: false,
      response: tooManyRequests(rateLimit.reason === "trial" ? "该 AI 工具今日访客试用次数已用完，请明天再来或登录后继续。" : rateLimit.reason === "rate" ? "AI 请求过于频繁，请稍后重试。" : "已有同类 AI 请求正在生成，请稍后重试。"),
    };
  }

  const trackRequest = options?.trackRequest ?? request.method !== "GET";
  if (!trackRequest) return { ok: true, access: { accountId, redisKey: rateLimit.concurrencyKey, reservedCredits: 0, anonymous, courseContext } };

  // 匿名试用不建立 Account/AIRequest/作品记录；仅由 Redis 计数并在请求结束时释放并发槽位。
  if (anonymous) return { ok: true, access: { accountId, requestId: randomUUID(), redisKey: rateLimit.concurrencyKey, reservedCredits: 0, anonymous: true, courseContext } };

  const idempotencyKey = request.headers.get("idempotency-key")?.trim();
  if (!idempotencyKey || idempotencyKey.length > 128) {
    await getRedis().then((redis) => redis.decr(rateLimit.concurrencyKey)).catch(() => undefined);
    return { ok: false, response: conflict("请使用有效的 Idempotency-Key 提交 AI 请求。") };
  }
  try {
    const configuredCost = !anonymous && sessionAccount?.type === AccountType.PERSONAL ? await getToolCreditCost(tool) : 0;
    if (!anonymous && sessionAccount?.type === AccountType.PERSONAL && configuredCost === null) {
      await getRedis().then((redis) => redis.decr(rateLimit.concurrencyKey)).catch(() => undefined);
      return { ok: false, response: serviceUnavailable("AI 点数规则尚未配置，暂不能发起生成。") };
    }
    const reservedCredits = configuredCost ?? 0;
    const aiRequest = await db.$transaction(async (tx) => {
      if (reservedCredits) {
        const reservation = await tx.creditWallet.updateMany({
          where: { accountId, balance: { gte: reservedCredits } },
          data: { balance: { decrement: reservedCredits }, reservedBalance: { increment: reservedCredits } },
        });
        if (reservation.count !== 1) throw new Error("INSUFFICIENT_CREDITS");
      }
      return tx.aiRequest.create({ data: { accountId, tool, idempotencyKey, status: RequestStatus.RUNNING, reservedCredits } });
    });
    return { ok: true, access: { accountId, requestId: aiRequest.requestId, redisKey: rateLimit.concurrencyKey, reservedCredits, anonymous, courseContext } };
  } catch (error) {
    await getRedis().then((redis) => redis.decr(rateLimit.concurrencyKey)).catch(() => undefined);
    if (error instanceof Error && error.message === "INSUFFICIENT_CREDITS") return { ok: false, response: forbidden("AI 点数不足，无法发起生成。") };
    return { ok: false, response: conflict() };
  }
}

export async function finishAiRequest(access: GatewayAccess, tool: AiTool, succeeded: boolean) {
  try {
    await getRedis().then((redis) => redis.decr(access.redisKey));
  } catch {
    // Redis TTL limits the impact of a transient failure to release a slot.
  }
  if (access.anonymous) {
    await db.anonymousUsageEvent.create({ data: { anonymousIdHash: createHash("sha256").update(access.accountId).digest("hex"), toolKey: tool, status: succeeded ? "SUCCEEDED" : "FAILED", requestId: access.requestId } }).catch(() => undefined);
    return;
  }
  if (!access.requestId) return;
  const status = succeeded ? RequestStatus.SUCCEEDED : RequestStatus.FAILED;
  const usageStatus = succeeded ? UsageStatus.SUCCEEDED : UsageStatus.FAILED;
  await db.$transaction(async (tx) => {
    await tx.aiRequest.update({ where: { requestId: access.requestId }, data: { status } });
    if (access.reservedCredits) {
      await tx.creditWallet.update({ where: { accountId: access.accountId }, data: succeeded ? { reservedBalance: { decrement: access.reservedCredits } } : { balance: { increment: access.reservedCredits }, reservedBalance: { decrement: access.reservedCredits } } });
      if (succeeded) await tx.creditLedger.create({ data: { accountId: access.accountId, delta: -access.reservedCredits, reason: "AI_GENERATION", referenceType: "AI_REQUEST", referenceId: access.requestId } });
    }
    await tx.usageEvent.create({ data: { accountId: access.accountId, tool, status: usageStatus, units: access.reservedCredits, requestId: access.requestId } });
  });
}

export async function withAiGateway(
  request: Request,
  tool: AiTool,
  handler: (requestId: string | undefined, courseContext: CourseToolContext | null | undefined) => Promise<Response>,
  options?: { trackRequest?: boolean },
) {
  const gateway = await beginAiRequest(request, tool, options);
  if (!gateway.ok) return gateway.response;
  try {
    const response = await handler(gateway.access.requestId, gateway.access.courseContext);
    await finishAiRequest(gateway.access, tool, response.ok);
    if (gateway.access.requestId) response.headers.set("x-ai-request-id", gateway.access.requestId);
    return response;
  } catch {
    await finishAiRequest(gateway.access, tool, false).catch(() => undefined);
    return NextResponse.json({ error: "服务器暂时无法处理请求，请稍后重试。" }, { status: 500 });
  }
}

export function ensureSuperAdmin(roleKeys: string[]) {
  return roleKeys.includes("SUPER_ADMIN");
}
