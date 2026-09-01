import { requireAdminResponse } from "@/lib/admin-access";
import { toolCreditCostsSchema } from "@/lib/credit-costs";
import { db } from "@/lib/db";
import { internalError } from "@/lib/http";

export async function GET() {
  const access = await requireAdminResponse();
  if ("response" in access) return access.response;
  const setting = await db.systemSetting.findUnique({ where: { key: "ai_tool_credit_costs" } });
  return Response.json({ costs: setting?.value ?? null, version: setting?.version ?? 0, updatedAt: setting?.updatedAt ?? null });
}

export async function PATCH(request: Request) {
  const access = await requireAdminResponse();
  if ("response" in access) return access.response;
  try {
    const parsed = toolCreditCostsSchema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: "AI 工具点数配置无效。" }, { status: 400 });
    const before = await db.systemSetting.findUnique({ where: { key: "ai_tool_credit_costs" } });
    const setting = await db.systemSetting.upsert({
      where: { key: "ai_tool_credit_costs" },
      update: { value: parsed.data, version: { increment: 1 }, updatedBy: access.account.id },
      create: { key: "ai_tool_credit_costs", value: parsed.data, updatedBy: access.account.id },
    });
    await db.auditLog.create({ data: { actorId: access.account.id, action: "AI_CREDIT_COSTS_UPDATED", targetType: "SYSTEM_SETTING", targetId: setting.key, result: "SUCCEEDED", before: { previousVersion: before?.version ?? 0 }, after: parsed.data } });
    return Response.json({ costs: setting.value, version: setting.version, updatedAt: setting.updatedAt });
  } catch {
    return internalError();
  }
}
