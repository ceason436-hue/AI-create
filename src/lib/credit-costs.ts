import { db } from "@/lib/db";
import type { AiTool } from "@/lib/ai-gateway";
import { aiToolCreditCostsSchema } from "@/lib/ai-cost-policy";

export const toolCreditCostsSchema = aiToolCreditCostsSchema;

export async function getToolCreditCost(tool: AiTool) {
  const setting = await db.systemSetting.findUnique({ where: { key: "ai_tool_credit_costs" } });
  const parsed = toolCreditCostsSchema.safeParse(setting?.value);
  return parsed.success ? parsed.data[tool] : null;
}
