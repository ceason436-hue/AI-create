import { requireAdminResponse } from "@/lib/admin-access";
import { extractMinimaxJson } from "@/lib/minimax-response";
import { extractM3Text, minimaxM3Headers, minimaxM3Url, toM3Payload } from "@/lib/minimax-m3";
import { providerFetch } from "@/lib/provider-fetch";
import { localReadingAnalysis, normalizeReadingAnalysis, type ReadingAnalysis } from "@/lib/reading-analysis";
import { readingAnalysisSchema } from "@/lib/reading-lessons";
import { z } from "zod";

export const maxDuration = 100;
const inputSchema = z.object({ title: z.string().trim().min(1).max(120), article: z.string().trim().min(20).max(50_000), teacherGuide: z.string().trim().max(10_000).optional() });

export async function POST(request: Request) {
  const access = await requireAdminResponse("ADMIN_CONTENT");
  if ("response" in access) return access.response;
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "请先填写至少 20 字的课文原文。" }, { status: 400 });
  const { title, article, teacherGuide } = parsed.data;
  const fallback = localReadingAnalysis(title, article, teacherGuide);
  if (!process.env.MINIMAX_API_KEY || article.length > 14_000) return Response.json({ analysis: fallback, fallback: true });
  try {
    const response = await providerFetch(minimaxM3Url(), { method: "POST", headers: minimaxM3Headers(), body: JSON.stringify(toM3Payload([
      { role: "system", content: "你是小学阅读课程编辑。只返回 JSON，不显示思考。按同一幅画面能够完整表达的内容拆分课文；人物、地点、时间或核心动作变化就另起一段，不固定段数，每段通常 60-240 字。字段必须为 title,summary,keywords,structure[{label,segmentIndexes}],segments[{text,question,evidence,difficulty}]。问题只引导学生自己发现画面重点，不能直接提供绘画提示词；difficulty 只能是基础、进阶、挑战。" },
      { role: "user", content: `课文：${title}\n教学要求：${teacherGuide || "无"}\n原文：\n${article}` },
    ], { maxTokens: 4096, temperature: 0.2 })) });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error("PROVIDER_REJECTED");
    const candidate = readingAnalysisSchema.safeParse(extractMinimaxJson(extractM3Text(body)));
    if (!candidate.success) throw new Error("PROVIDER_INVALID_RESPONSE");
    return Response.json({ analysis: normalizeReadingAnalysis(candidate.data as ReadingAnalysis, article) });
  } catch {
    return Response.json({ analysis: fallback, fallback: true });
  }
}
