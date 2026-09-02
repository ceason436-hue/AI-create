import { z } from "zod";
import { requireAdminResponse } from "@/lib/admin-access";
import { isKnownAiTool } from "@/lib/ai-tools";
import { db } from "@/lib/db";
import { internalError } from "@/lib/http";

const schema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().min(1).max(500).optional(),
  category: z.string().trim().min(1).max(64).optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  visibleToPublic: z.boolean().optional(),
  allowAnonymousTrial: z.boolean().optional(),
  dailyTrialLimit: z.number().int().min(0).max(20).optional(),
  coverAssetId: z.string().min(1).nullable().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ toolKey: string }> }) {
  const access = await requireAdminResponse();
  if ("response" in access) return access.response;
  const { toolKey } = await params;
  if (!isKnownAiTool(toolKey)) return Response.json({ error: "只能维护服务端已实现的 AI 工具。" }, { status: 404 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "AI 工具配置无效。" }, { status: 400 });
  try {
    const tool = await db.$transaction(async (tx) => {
      const before = await tx.aiTool.findUnique({ where: { toolKey } });
      if (!before) throw new Error("TOOL_NOT_SEEDED");
      const updated = await tx.aiTool.update({ where: { toolKey }, data: { ...parsed.data, updatedBy: access.account.id } });
      await tx.auditLog.create({ data: { actorId: access.account.id, action: "AI_TOOL_UPDATED", targetType: "AI_TOOL", targetId: updated.id, result: "SUCCEEDED", before: { status: before.status, visibleToPublic: before.visibleToPublic, allowAnonymousTrial: before.allowAnonymousTrial, dailyTrialLimit: before.dailyTrialLimit }, after: { ...parsed.data, toolKey } } });
      return updated;
    });
    return Response.json({ tool });
  } catch (error) {
    if (error instanceof Error && error.message === "TOOL_NOT_SEEDED") return Response.json({ error: "AI 工具目录尚未初始化，请先部署目录迁移。" }, { status: 409 });
    return internalError();
  }
}
