import { NextResponse } from "next/server";
import { z } from "zod";
import { withAiGateway } from "@/lib/ai-gateway";
import { badRequest } from "@/lib/http";
import { providerFetch } from "@/lib/provider-fetch";

export const maxDuration = 120;

const inputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  article: z.string().trim().min(20).max(50_000).refine((value) => /[\u3400-\u9fff]/.test(value), "Chinese text required"),
  grade: z.number().int().min(1).max(6),
  teacherGuide: z.string().trim().max(10_000).optional(),
}).strict();

const analysisSchema = z.object({
  title: z.string().trim().min(1).max(120),
  summary: z.string().trim().min(1).max(600),
  keywords: z.array(z.string().trim().min(1).max(40)).min(1).max(12),
  structure: z.array(z.object({ label: z.string().trim().min(1).max(80), segmentIndexes: z.array(z.number().int().nonnegative()).min(1).max(80) }).strict()).min(1).max(80),
  segments: z.array(z.object({ text: z.string().trim().min(1).max(4_000), question: z.string().trim().min(1).max(500), evidence: z.string().trim().min(1).max(500), difficulty: z.enum(["基础", "进阶", "挑战"]) }).strict()).min(1).max(80),
}).strict();

function extractJson(content: string) {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ?? content;
  const start = fenced.indexOf("{");
  const end = fenced.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("PROVIDER_INVALID_RESPONSE");
  return JSON.parse(fenced.slice(start, end + 1));
}

export async function POST(request: Request) {
  return withAiGateway(request, "reading", async (_requestId, courseContext) => {
    const parsed = inputSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return badRequest("请提供 20-50000 字的中文文章正文，并选择一至六年级。");
    const apiKey = process.env.MINIMAX_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "AI 服务暂不可用。", code: "PROVIDER_UNAVAILABLE" }, { status: 503 });
    const baseUrl = process.env.MINIMAX_BASE_URL || "https://api.minimaxi.com";
    try {
      const chunks = parsed.data.article.match(/[\s\S]{1,8_000}/g) ?? [];
      const partials: z.infer<typeof analysisSchema>[] = [];
      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
        const response = await providerFetch(`${baseUrl}/v1/chat/completions`, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", ...(process.env.MINIMAX_GROUP_ID ? { GroupId: process.env.MINIMAX_GROUP_ID } : {}) },
          body: JSON.stringify({ model: "MiniMax-M2.7", stream: false, messages: [
            { role: "system", name: "system", content: "你是小学阅读教学分析助手。只返回 JSON，不要 Markdown。不得虚构原文没有的事实。segments 中的 evidence 必须引用或准确转述当前段落中的证据。JSON 字段严格为 title, summary, keywords, structure[{label,segmentIndexes}], segments[{text,question,evidence,difficulty}]，difficulty 只能是基础、进阶、挑战，segmentIndexes 从 0 开始。" },
            ...(courseContext ? [{ role: "system", name: "system", content: `课程：${courseContext.courseName}；课时：${courseContext.lessonTitle}；任务：${courseContext.lessonTask ?? "阅读理解"}` }] : []),
            { role: "user", content: `年级：${parsed.data.grade} 年级\n标题：${parsed.data.title}\n这是全文第 ${chunkIndex + 1}/${chunks.length} 块。教师指引：${parsed.data.teacherGuide || "无"}\n正文：\n${chunks[chunkIndex]}` },
          ] }),
        });
        const providerBody = await response.json().catch(() => null) as { choices?: Array<{ message?: { content?: string } }>; base_resp?: { status_code?: number } } | null;
        if (!response.ok || providerBody?.base_resp?.status_code && providerBody.base_resp.status_code !== 0) throw new Error("PROVIDER_REJECTED");
        const content = providerBody?.choices?.[0]?.message?.content;
        if (typeof content !== "string") throw new Error("PROVIDER_INVALID_RESPONSE");
        partials.push(analysisSchema.parse(extractJson(content)));
      }
      let offset = 0;
      const structure = partials.flatMap((part) => { const currentOffset = offset; offset += part.segments.length; return part.structure.map((node) => ({ ...node, segmentIndexes: node.segmentIndexes.map((index) => index + currentOffset) })); });
      const analysis = analysisSchema.parse({ title: parsed.data.title, summary: partials.map((part) => part.summary).join(" ").slice(0, 600), keywords: [...new Set(partials.flatMap((part) => part.keywords))].slice(0, 12), structure, segments: partials.flatMap((part) => part.segments) });
      return NextResponse.json({ analysis });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error && error.message === "PROVIDER_REJECTED" ? "AI 阅读分析暂时失败，请稍后重试。" : "AI 返回的阅读结构未通过校验，请重试。", code: error instanceof Error && error.message === "PROVIDER_REJECTED" ? "PROVIDER_REJECTED" : "PROVIDER_INVALID_RESPONSE" }, { status: 502 });
    }
  });
}
