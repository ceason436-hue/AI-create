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
  leaseToken: string;
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
  | { ok: true; concurrencyKey: string; leaseToken: string }
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

  const leaseToken = randomUUID();
  const now = Date.now();
  const acquired = await redis.eval(
    "redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', ARGV[1]); if redis.call('ZCARD', KEYS[1]) >= tonumber(ARGV[2]) then return 0 end; redis.call('ZADD', KEYS[1], ARGV[3], ARGV[4]); redis.call('EXPIRE', KEYS[1], 180); return 1",
    { keys: [concurrencyKey], arguments: [String(now), String(concurrencyLimit), String(now + 180_000), leaseToken] },
  );
  if (Number(acquired) !== 1) return { ok: false, reason: "concurrency" as const };
  return { ok: true, concurrencyKey, leaseToken };
}

async function acquireAnonymousRateLimit(anonymousId: string, tool: AiTool, dailyTrialLimit: number) {
  const trial = await consumeAnonymousTrial(anonymousId, tool, dailyTrialLimit);
  if (!trial.ok) return { ok: false as const, reason: "trial" as const };
  const redis = await getRedis();
  const concurrencyKey = `krt:ai:concurrency:anonymous:${anonymousId}:${tool}`;
  const leaseToken = randomUUID();
  const now = Date.now();
  const acquired = await redis.eval(
    "redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', ARGV[1]); if redis.call('ZCARD', KEYS[1]) >= 1 then return 0 end; redis.call('ZADD', KEYS[1], ARGV[2], ARGV[3]); redis.call('EXPIRE', KEYS[1], 180); return 1",
    { keys: [concurrencyKey], arguments: [String(now), String(now + 180_000), leaseToken] },
  );
  if (Number(acquired) !== 1) return { ok: false as const, reason: "concurrency" as const };
  return { ok: true as const, concurrencyKey, leaseToken };
}

async function releaseConcurrencyLease(key: string, token: string) {
  await getRedis().then((redis) => redis.zRem(key, token)).catch(() => undefined);
}

function requestInputHash(raw: string) {
  try {
    const normalize = (value: unknown): unknown => Array.isArray(value)
      ? value.map(normalize)
      : value && typeof value === "object"
        ? Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, normalize(entry)]))
        : value;
    return createHash("sha256").update(JSON.stringify(normalize(JSON.parse(raw)))).digest("hex");
  } catch {
    return createHash("sha256").update(raw).digest("hex");
  }
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

  const trackRequest = options?.trackRequest ?? request.method !== "GET";
  const idempotencyKey = trackRequest && !anonymous ? request.headers.get("idempotency-key")?.trim() : undefined;
  if (trackRequest && !anonymous && (!idempotencyKey || idempotencyKey.length > 128 || !/^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/.test(idempotencyKey))) {
    return { ok: false, response: conflict("请使用 8-128 位有效 Idempotency-Key 提交 AI 请求。") };
  }
  const inputHash = trackRequest ? requestInputHash(await request.clone().text().catch(() => "")) : "";

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

  if (!trackRequest) return { ok: true, access: { accountId, redisKey: rateLimit.concurrencyKey, leaseToken: rateLimit.leaseToken, reservedCredits: 0, anonymous, courseContext } };

  // 匿名试用不建立 Account/AIRequest/作品记录；仅由 Redis 计数并在请求结束时释放并发槽位。
  if (anonymous) return { ok: true, access: { accountId, requestId: randomUUID(), redisKey: rateLimit.concurrencyKey, leaseToken: rateLimit.leaseToken, reservedCredits: 0, anonymous: true, courseContext } };

  const existing = await db.aiRequest.findUnique({ where: { accountId_idempotencyKey: { accountId, idempotencyKey: idempotencyKey! } }, select: { requestId: true, inputHash: true, status: true } }).catch(() => null);
  if (existing) {
    await releaseConcurrencyLease(rateLimit.concurrencyKey, rateLimit.leaseToken);
    if (existing.inputHash !== inputHash) return { ok: false, response: conflict("同一 Idempotency-Key 不能用于不同请求内容。") };
    return { ok: false, response: NextResponse.json({ requestId: existing.requestId, status: existing.status, replay: true }, { status: 202, headers: { "x-ai-request-id": existing.requestId } }) };
  }
  try {
    const configuredCost = !anonymous && sessionAccount?.type === AccountType.PERSONAL ? await getToolCreditCost(tool) : 0;
    if (!anonymous && sessionAccount?.type === AccountType.PERSONAL && configuredCost === null) {
      await releaseConcurrencyLease(rateLimit.concurrencyKey, rateLimit.leaseToken);
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
      const created = await tx.aiRequest.create({ data: { accountId, tool, idempotencyKey: idempotencyKey!, contractVersion: 1, inputHash, status: RequestStatus.RUNNING, reservedCredits, startedAt: new Date(), jobs: { create: { attempt: 1, status: RequestStatus.RUNNING, leaseToken: rateLimit.leaseToken, leaseExpiresAt: new Date(Date.now() + 180_000) } } } });
      if (reservedCredits) await tx.creditLedger.create({ data: { accountId, delta: 0, reason: "AI_RESERVED", referenceType: "AI_REQUEST", referenceId: created.requestId } });
      return created;
    });
    return { ok: true, access: { accountId, requestId: aiRequest.requestId, redisKey: rateLimit.concurrencyKey, leaseToken: rateLimit.leaseToken, reservedCredits, anonymous, courseContext } };
  } catch (error) {
    await releaseConcurrencyLease(rateLimit.concurrencyKey, rateLimit.leaseToken);
    if (error instanceof Error && error.message === "INSUFFICIENT_CREDITS") return { ok: false, response: forbidden("AI 点数不足，无法发起生成。") };
    return { ok: false, response: conflict() };
  }
}

export async function finishAiRequest(access: GatewayAccess, tool: AiTool, succeeded: boolean, errorCode?: string) {
  await releaseConcurrencyLease(access.redisKey, access.leaseToken);
  if (access.anonymous) {
    await db.anonymousUsageEvent.create({ data: { anonymousIdHash: createHash("sha256").update(access.accountId).digest("hex"), toolKey: tool, status: succeeded ? "SUCCEEDED" : "FAILED", requestId: access.requestId } }).catch(() => undefined);
    return;
  }
  if (!access.requestId) return;
  const status = succeeded ? RequestStatus.SUCCEEDED : RequestStatus.FAILED;
  const usageStatus = succeeded ? UsageStatus.SUCCEEDED : UsageStatus.FAILED;
  await db.$transaction(async (tx) => {
    const settled = await tx.aiRequest.updateMany({ where: { requestId: access.requestId, status: { in: [RequestStatus.PENDING, RequestStatus.RUNNING, RequestStatus.PROVIDER_PENDING, RequestStatus.RESULT_READY, RequestStatus.PERSISTING, RequestStatus.RETRY_WAIT, RequestStatus.RECONCILING] } }, data: { status, finishedAt: new Date(), errorCode: succeeded ? null : errorCode ?? "PROVIDER_REJECTED" } });
    if (settled.count !== 1) return;
    await tx.aiJob.updateMany({ where: { requestId: access.requestId, status: { notIn: [RequestStatus.SUCCEEDED, RequestStatus.FAILED, RequestStatus.CANCELLED] } }, data: { status, errorCode: succeeded ? null : errorCode ?? "PROVIDER_REJECTED", leaseToken: null, leaseExpiresAt: null } });
    if (access.reservedCredits) {
      await tx.creditWallet.update({ where: { accountId: access.accountId }, data: succeeded ? { reservedBalance: { decrement: access.reservedCredits } } : { balance: { increment: access.reservedCredits }, reservedBalance: { decrement: access.reservedCredits } } });
      await tx.creditLedger.updateMany({ where: { accountId: access.accountId, referenceType: "AI_REQUEST", referenceId: access.requestId, reason: "AI_RESERVED" }, data: { delta: succeeded ? -access.reservedCredits : 0, reason: succeeded ? "AI_GENERATION" : "AI_RELEASED" } });
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
    const errorCode = response.status === 429 ? "PROVIDER_RATE_LIMITED" : response.status === 504 ? "PROVIDER_TIMEOUT" : response.status >= 500 ? "PROVIDER_UNAVAILABLE" : response.status >= 400 ? "INVALID_INPUT" : undefined;
    await finishAiRequest(gateway.access, tool, response.ok, errorCode);
    if (gateway.access.requestId) {
      response.headers.set("x-ai-request-id", gateway.access.requestId);
      if (response.headers.get("content-type")?.includes("application/json")) {
        const payload = await response.clone().json().catch(() => null);
        if (payload && typeof payload === "object" && !Array.isArray(payload) && !("requestId" in payload)) {
          const headers = new Headers(response.headers); headers.delete("content-length");
          return NextResponse.json({ ...payload, requestId: gateway.access.requestId }, { status: response.status, headers });
        }
      }
    }
    return response;
  } catch {
    await finishAiRequest(gateway.access, tool, false, "INTERNAL_ERROR").catch(() => undefined);
    return NextResponse.json({ error: "服务器暂时无法处理请求，请稍后重试。" }, { status: 500 });
  }
}

export function ensureSuperAdmin(roleKeys: string[]) {
  return roleKeys.includes("SUPER_ADMIN");
}
