import { NextResponse } from "next/server";
import { z } from "zod";
import { withAiGateway } from "@/lib/ai-gateway";
import { badRequest } from "@/lib/http";
import { providerFetch } from "@/lib/provider-fetch";
import { extractM3Text, minimaxM3Headers, minimaxM3Url, toM3Payload } from "@/lib/minimax-m3";
import { READING_TEACHER_ROLE_PROMPT } from "@/lib/reading-teacher-prompt";

const schema = z.object({ segment: z.string().trim().min(1).max(4_000), question: z.string().trim().max(500).optional(), messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(1_000) })).max(12).default([]) });

export async function POST(request: Request) {
  return withAiGateway(request, "reading", async () => {
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return badRequest("请提供当前阅读段落。");
    if (!process.env.MINIMAX_API_KEY) return NextResponse.json({ error: "AI 老师暂不可用。" }, { status: 503 });
    const { segment, question, messages } = parsed.data;
    const response = await providerFetch(minimaxM3Url(), { method: "POST", headers: minimaxM3Headers(), body: JSON.stringify(toM3Payload([
      { role: "system", content: READING_TEACHER_ROLE_PROMPT },
      { role: "system", content: `当前段落：${segment}\n引导问题：${question || "请引导学生观察段落。"}` },
      ...messages,
    ], { maxTokens: 500, temperature: 0.65 })) });
    const body = await response.json().catch(() => null);
    const text = extractM3Text(body);
    if (!response.ok || !text) return NextResponse.json({ error: "AI 老师暂时无法回答，请稍后再试。" }, { status: 502 });
    return NextResponse.json({ text });
  });
}
