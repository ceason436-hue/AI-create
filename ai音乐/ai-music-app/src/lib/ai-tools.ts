import { db } from "@/lib/db";
import { AI_TOOL_CATALOG, AI_TOOLS, type AiTool } from "@/lib/ai-tool-catalog";

export type PublicAiTool = {
  toolKey: AiTool;
  name: string;
  description: string;
  category: string;
  routePath: string;
  color: string;
  coverAssetId: string | null;
};

export async function getPublicAiTools(): Promise<PublicAiTool[]> {
  const rows = await db.aiTool.findMany({
    where: { status: "ACTIVE", visibleToPublic: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.flatMap((row) => {
    if (!isKnownAiTool(row.toolKey)) return [];
    const base = AI_TOOL_CATALOG[row.toolKey];
    return [{ toolKey: row.toolKey, name: row.name, description: row.description, category: row.category, routePath: row.routePath || base.routePath, color: base.color, coverAssetId: row.coverAssetId }];
  });
}

export async function getAdminAiTools() {
  return db.aiTool.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
}

export async function getActiveAiTool(toolKey: AiTool) {
  return db.aiTool.findUnique({ where: { toolKey } });
}

export function isKnownAiTool(value: string): value is AiTool {
  return (AI_TOOLS as readonly string[]).includes(value);
}
