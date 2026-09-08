import { NextResponse } from "next/server";
import { z } from "zod";
import { withAiGateway } from "@/lib/ai-gateway";
import { badRequest } from "@/lib/http";
import { providerExceptionResponse, providerFetch } from "@/lib/provider-fetch";
import { extractM3Text, minimaxM3Headers, minimaxM3Url, toM3Payload } from "@/lib/minimax-m3";

export const maxDuration = 120;
const inputSchema = z.object({ messages: z.array(z.object({ role: z.enum(["system", "user", "assistant"]), content: z.string().min(1).max(20_000) })).min(1).max(20) });

export async function POST(request: Request) {
  return withAiGateway(request, "chat", async (_requestId, courseContext) => {
    try {
      const parsed = inputSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) return badRequest("请提供有效的对话内容。");
      if (!process.env.MINIMAX_API_KEY) return NextResponse.json({ error: "AI 服务暂不可用。" }, { status: 503 });
      const messages = [
        { role: "system" as const, content: "你是科瑞特 AI 的学习助手。用清晰、适龄的中文回答；不要泄露内部推理过程。" },
        ...(courseContext ? [{ role: "system" as const, content: `当前课程《${courseContext.courseName}》·《${courseContext.lessonTitle}》。围绕本课任务引导，不要编造课程事实。` }] : []),
        ...parsed.data.messages,
      ];
      const response = await providerFetch(minimaxM3Url(), { method: "POST", headers: minimaxM3Headers(), body: JSON.stringify(toM3Payload(messages, { maxTokens: 2048, temperature: 0.7 })) });
      const body = await response.json().catch(() => null);
      const text = extractM3Text(body);
      if (!response.ok || !text) return NextResponse.json({ error: "AI 服务未返回有效文本，请稍后重试。", code: "PROVIDER_REJECTED", retryable: true }, { status: 502 });
      return NextResponse.json({ status: "SUCCEEDED", result: { kind: "TEXT", preview: { text } } });
    } catch (error) { return providerExceptionResponse(error); }
  });
}
