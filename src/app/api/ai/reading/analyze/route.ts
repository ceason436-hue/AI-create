import { NextResponse } from "next/server";
import { z } from "zod";
import { withAiGateway } from "@/lib/ai-gateway";
import { badRequest } from "@/lib/http";
import { providerFetch } from "@/lib/provider-fetch";
import { extractMinimaxJson } from "@/lib/minimax-response";
import { extractM3Text, minimaxM3Headers, minimaxM3Url, toM3Payload } from "@/lib/minimax-m3";
import { localReadingAnalysis, normalizeReadingAnalysis, type ReadingAnalysis } from "@/lib/reading-analysis";

export const maxDuration = 100;

const inputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  article: z.string().trim().min(20).max(50_000).refine((value) => /[\u3400-\u9fff]/.test(value), "Chinese text required"),
  teacherGuide: z.string().trim().max(10_000).optional(),
}).strict();
const segmentSchema = z.object({ text: z.string().trim().min(1).max(4_000), question: z.string().trim().min(1).max(500), evidence: z.string().trim().min(1).max(500), difficulty: z.enum(["基础", "进阶", "挑战"]) }).strict();
const analysisSchema = z.object({
  title: z.string().trim().min(1).max(120), summary: z.string().trim().min(1).max(600), keywords: z.array(z.string().trim().min(1).max(40)).min(1).max(12),
  structure: z.array(z.object({ label: z.string().trim().min(1).max(80), segmentIndexes: z.array(z.number().int().nonnegative()).min(1).max(80) }).strict()).min(1).max(80),
  segments: z.array(segmentSchema).min(1).max(80),
}).strict();

export async function POST(request: Request) {
  return withAiGateway(request, "reading", async (_requestId, courseContext) => {
    const parsed = inputSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return badRequest("请提供 20-50000 字的中文文章正文。");
    const { title, article, teacherGuide } = parsed.data;
    const fallback = localReadingAnalysis(title, article, teacherGuide);
    const apiKey = process.env.MINIMAX_API_KEY;
    // Long documents previously caused sequential multi-request analysis and appeared to hang. Keep the reliable local splitter as the bounded fallback.
    if (!apiKey || article.length > 14_000) return NextResponse.json({ analysis: fallback, fallback: true });
    try {
      const messages: Array<{ role: "system" | "user"; content: string }> = [
        { role: "system", content: "你是阅读教学助手。只返回 JSON，不要 Markdown，也不要思考过程。不得虚构原文事实。按‘每段都能由同一幅画面完整呈现’拆分：人物、地点、时间或核心动作明显变化时必须另起一段；不得为了固定页数合并；每段通常 60-240 个汉字。字段严格为 title, summary, keywords, structure[{label,segmentIndexes}], segments[{text,question,evidence,difficulty}]。问题必须启发学生自己提炼画面重点，不能直接给出生图提示词。difficulty 只能为基础、进阶、挑战；segmentIndexes 从 0 开始。" },
        ...(courseContext ? [{ role: "system" as const, content: `课程：${courseContext.courseName}；课时：${courseContext.lessonTitle}。` }] : []),
        { role: "user", content: `标题：${title}\n教师指引（可选）：${teacherGuide || "无"}\n正文：\n${article}` },
      ];
      const response = await providerFetch(minimaxM3Url(), {
        method: "POST", signal: AbortSignal.timeout(35_000),
        headers: minimaxM3Headers(),
        body: JSON.stringify(toM3Payload(messages, { maxTokens: 2048, temperature: 0.2 })),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error("PROVIDER_REJECTED");
      const candidate = analysisSchema.safeParse(extractMinimaxJson(extractM3Text(body)));
      if (!candidate.success) throw new Error("PROVIDER_INVALID_RESPONSE");
      return NextResponse.json({ analysis: normalizeReadingAnalysis(candidate.data as ReadingAnalysis, article) });
    } catch (error) {
      console.warn("Reading analysis fell back to deterministic splitter", error instanceof Error ? error.message : "unknown");
      return NextResponse.json({ analysis: fallback, fallback: true });
    }
  });
}
