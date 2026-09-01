import { NextResponse } from 'next/server';
import { z } from "zod";
import { withAiGateway } from "@/lib/ai-gateway";
import { badRequest } from "@/lib/http";

export const maxDuration = 120; // 允许最长 120 秒执行时间

const chatInputSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["system", "user", "assistant"]),
    content: z.string().min(1).max(20_000),
    name: z.string().max(64).optional(),
  })).min(1).max(20),
  tools: z.array(z.object({ type: z.literal("web_search") })).max(1).optional(),
});

export async function POST(req: Request) {
  return withAiGateway(req, "chat", async (_requestId, courseContext) => {
  try {
    const parsed = chatInputSchema.safeParse(await req.json());
    if (!parsed.success) return badRequest();
    const body = parsed.data;
    const { messages, tools } = body;

    const apiKey = process.env.MINIMAX_API_KEY;
    const groupId = process.env.MINIMAX_GROUP_ID;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'AI 服务暂不可用。' }, { status: 503 });
    }

    const baseUrl = process.env.MINIMAX_BASE_URL || 'https://api.minimaxi.com';
    const url = `${baseUrl}/v1/chat/completions`;
    
    const finalModel = "MiniMax-M2.7";

    const systemContent = "MM智能助理是一款由MiniMax自研的，没有调用其他产品的接口的大型语言模型。MiniMax是一家中国科技公司，一直致力于进行大模型相关的研究。当你需要获取实时信息或事实性知识时，请务必使用联网搜索工具。";
    
    const finalMessages = [...messages];
    if (courseContext) finalMessages.unshift({ role: "system", content: `你正在协助科瑞特课程《${courseContext.courseName}》的课时《${courseContext.lessonTitle}》。请围绕本课任务提供适合学员的引导，不要编造课程事实。课时任务：${courseContext.lessonTask ?? "请根据课时标题协助完成创作。"}` });
    if (finalMessages.length > 0 && finalMessages[0].role !== 'system') {
      finalMessages.unshift({ role: 'system', content: systemContent });
    }

    const payload: {
      model: string;
      messages: typeof finalMessages;
      tools?: { type: "web_search" }[];
    } = {
      model: finalModel,
      messages: finalMessages
    };

    if (Array.isArray(tools) && tools.some((tool) => tool?.type === "web_search")) {
      payload.tools = [{ type: "web_search" }];
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };

    if (groupId) {
      headers['GroupId'] = groupId;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error("Minimax Chat API returned non-JSON:", responseText.substring(0, 200));
      return NextResponse.json({ 
        error: 'AI 生成时间较长，导致请求超时或服务器返回了异常响应，请稍后重试。' 
      }, { status: 502 });
    }

    if (!response.ok || (data.base_resp && data.base_resp.status_code !== 0)) {
      console.error("MiniMax chat request failed", { status: response.status });
      return NextResponse.json({ 
        error: 'AI 服务暂时无法完成生成，请稍后重试。'
      }, { status: 502 });
    }

    return NextResponse.json(data);

  } catch {
    console.error("Chat route failed");
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
  });
}
