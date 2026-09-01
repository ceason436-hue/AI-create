import { z } from "zod";
import { requireAdminResponse } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { isAiTool } from "@/lib/school-admin";
import { internalError } from "@/lib/http";

const planSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_]{2,32}$/),
  name: z.string().trim().min(2).max(80),
  storageLimitBytes: z.number().int().min(0).max(10_995_116_277_760),
  monthlyCredits: z.number().int().min(0).max(1_000_000),
  allowedTools: z.array(z.enum(["chat", "code", "image", "music", "music_query", "vision"])).min(1).max(6),
});

export async function GET() {
  const access = await requireAdminResponse();
  if ("response" in access) return access.response;
  const plans = await db.plan.findMany({ orderBy: [{ code: "asc" }, { version: "desc" }] });
  return Response.json({ plans: plans.map((plan) => ({ ...plan, storageLimitBytes: plan.storageLimitBytes.toString() })) });
}

export async function POST(request: Request) {
  const access = await requireAdminResponse();
  if ("response" in access) return access.response;
  try {
    const parsed = planSchema.safeParse(await request.json());
    if (!parsed.success || !parsed.data.allowedTools.every(isAiTool)) return Response.json({ error: "权益模板无效。" }, { status: 400 });
    const latest = await db.plan.findFirst({ where: { code: parsed.data.code }, orderBy: { version: "desc" } });
    const plan = await db.plan.create({
      data: { ...parsed.data, version: (latest?.version ?? 0) + 1, storageLimitBytes: BigInt(parsed.data.storageLimitBytes) },
    });
    await db.auditLog.create({
      data: { actorId: access.account.id, action: "PLAN_CREATED", targetType: "PLAN", targetId: plan.id, result: "SUCCEEDED", after: { code: plan.code, version: plan.version } },
    });
    return Response.json({ plan: { ...plan, storageLimitBytes: plan.storageLimitBytes.toString() } }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("BigInt")) return Response.json({ error: "存储容量无效。" }, { status: 400 });
    return internalError();
  }
}
