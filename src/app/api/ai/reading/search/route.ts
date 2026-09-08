import { z } from "zod";
import { withAiGateway } from "@/lib/ai-gateway";
import { db } from "@/lib/db";
import { isTemporaryDeployment } from "@/lib/temporary-deployment";
import { TEMPORARY_READING_LESSON } from "@/lib/temporary-reading-lesson";
import { extractMinimaxJson } from "@/lib/minimax-response";
import { minimaxM3Headers, minimaxM3Url, toM3Payload, extractM3Text } from "@/lib/minimax-m3";
import { providerFetch } from "@/lib/provider-fetch";

const inputSchema = z.object({ title: z.string().trim().min(1).max(120), grade: z.number().int().min(1).max(6).optional(), region: z.string().trim().max(80).optional(), publisher: z.string().trim().max(80).optional() });
const candidateSchema = z.object({ title: z.string().trim().min(1).max(120), sourceTitle: z.string().trim().min(1).max(200), article: z.string().trim().min(20).max(50_000), summary: z.string().trim().min(1).max(600), grade: z.number().int().min(1).max(12).optional(), publisher: z.string().trim().max(80).optional() });

export async function POST(request: Request) {
  return withAiGateway(request, "reading", async () => {
    const parsed = inputSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: "请输入要查找的课文名称。" }, { status: 400 });
    const { title, grade, region, publisher } = parsed.data;
    if (isTemporaryDeployment()) {
      const matches = TEMPORARY_READING_LESSON.title.includes(title) || title.includes(TEMPORARY_READING_LESSON.title);
      return Response.json({ candidates: matches ? [{ title: TEMPORARY_READING_LESSON.title, sourceTitle: "临时部署预制课文", article: TEMPORARY_READING_LESSON.article, summary: TEMPORARY_READING_LESSON.summary, grade: TEMPORARY_READING_LESSON.grade, publisher: TEMPORARY_READING_LESSON.publisher }] : [], source: "temporary-preset" });
    }
    const page = await db.sitePage.findUnique({ where: { pageKey: "ai-reading-library" }, include: { sections: { where: { sectionType: "PRESET_ARTICLE", publishStatus: "PUBLISHED" } } } }).catch(() => null);
    const localPublished = (page?.sections ?? []).flatMap((section) => { const item = section.payload as Record<string, unknown>; return typeof item.title === "string" && typeof item.article === "string" && (item.title.includes(title) || title.includes(item.title)) ? [{ title: item.title, sourceTitle: "科瑞特已发布课文库", article: item.article, summary: typeof item.summary === "string" ? item.summary : item.article.slice(0, 180), grade: typeof item.grade === "number" ? item.grade : undefined, publisher: typeof item.publisher === "string" ? item.publisher : undefined }] : []; });
    const local = localPublished.slice(0, 5);
    if (local.length) return Response.json({ candidates: local, source: "library" });
    if (!process.env.MINIMAX_API_KEY) return Response.json({ candidates: [], error: "未在课程库找到匹配课文，联网搜索服务尚未配置。" }, { status: 404 });
    try {
      const payload = { ...toM3Payload([{ role: "system", content: "你是课文资料检索助手。必须先使用 web_search 查找可靠公开网页，再返回 JSON。不要输出思考。返回 candidates 数组，每项包含 title、sourceTitle、article、summary、grade、publisher。提供 2-4 个可能匹配的真实候选，article 必须是搜索来源中可核验的课文正文；无法核验时不要编造。" }, { role: "user", content: `查找课文：${title}\n可选条件：年级 ${grade || "不限"}；地区 ${region || "不限"}；教材版本 ${publisher || "不限"}` }], { maxTokens: 5000, temperature: 0.1 }), tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 4 }] };
      const response = await providerFetch(minimaxM3Url(), { method: "POST", headers: minimaxM3Headers(), body: JSON.stringify(payload) });
      const body = await response.json().catch(() => null), extracted = extractMinimaxJson(extractM3Text(body));
      const result = z.object({ candidates: z.array(candidateSchema).max(5) }).safeParse(extracted);
      if (!response.ok || !result.success) throw new Error("SEARCH_INVALID");
      return Response.json({ candidates: result.data.candidates, source: "web" });
    } catch { return Response.json({ candidates: [], error: "联网搜索没有找到可核验的完整课文，请调整名称或上传原文。" }, { status: 404 }); }
  });
}
