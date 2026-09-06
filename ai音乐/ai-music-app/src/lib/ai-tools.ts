import { db } from "@/lib/db";
import { AI_TOOL_CATALOG, AI_TOOLS, type AiTool } from "@/lib/ai-tool-catalog";
import { resolvePublicMediaAssets, type PublicMedia } from "@/lib/public-media";

const PUBLIC_AI_TOOL_KEYS = new Set<AiTool>(["code", "image", "music", "reading"]);

export type PublicAiTool = {
  toolKey: AiTool;
  name: string;
  description: string;
  category: string;
  routePath: string;
  color: string;
  cover: PublicMedia | null;
};

export async function getPublicAiTools(): Promise<PublicAiTool[]> {
  const rows = await db.aiTool.findMany({
    where: { status: "ACTIVE", visibleToPublic: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  const mediaById = await resolvePublicMediaAssets(rows.map((row) => row.coverAssetId));
  return rows.flatMap((row) => {
    if (!isKnownAiTool(row.toolKey) || !PUBLIC_AI_TOOL_KEYS.has(row.toolKey)) return [];
    const base = AI_TOOL_CATALOG[row.toolKey];
    return [{ toolKey: row.toolKey, name: row.name, description: row.description, category: row.category, routePath: base.routePath, color: base.color, cover: row.coverAssetId ? mediaById.get(row.coverAssetId) ?? null : null }];
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
