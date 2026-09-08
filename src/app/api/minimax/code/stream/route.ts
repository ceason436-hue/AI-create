import { z } from "zod";
import { beginAiRequest, finishAiRequest } from "@/lib/ai-gateway";
import { providerFetch } from "@/lib/provider-fetch";
import { extractMinimaxHtml } from "@/lib/minimax-response";
import { minimaxM3Headers, minimaxM3Url, toM3Payload } from "@/lib/minimax-m3";
import { prepareProgrammingContext, PROGRAMMING_CONTEXT_LIMIT } from "@/lib/programming-context";

export const maxDuration = 120;

const inputSchema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(100_000) })).min(1).max(64),
  contextSummary: z.string().max(100_000).default(""),
  currentSource: z.string().max(900_000).default(""),
  attachments: z.array(z.object({ name: z.string().max(180), type: z.string().max(100), text: z.string().max(20_000).optional() })).max(12).default([]),
});

function event(type: string, payload: Record<string, unknown> = {}) {
  return `${JSON.stringify({ type, ...payload })}\n`;
}

function appendStreamChunk(previous: string, next: string) {
  if (!next) return { content: previous, delta: "" };
  if (next.startsWith(previous)) return { content: next, delta: next.slice(previous.length) };
  return { content: previous + next, delta: next };
}

export async function POST(request: Request) {
  const gateway = await beginAiRequest(request, "code");
  if (!gateway.ok) return gateway.response;
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    await finishAiRequest(gateway.access, "code", false, "INVALID_INPUT");
    return Response.json({ error: "请描述想要制作的网页或小游戏。" }, { status: 400 });
  }
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    await finishAiRequest(gateway.access, "code", false, "PROVIDER_UNAVAILABLE");
    return Response.json({ error: "AI 服务暂不可用。" }, { status: 503 });
  }

  const preparedContext = prepareProgrammingContext({
    messages: parsed.data.messages,
    currentSource: parsed.data.currentSource,
    summary: parsed.data.contextSummary,
  });
  if (preparedContext.estimatedTokens > PROGRAMMING_CONTEXT_LIMIT) {
    await finishAiRequest(gateway.access, "code", false, "CONTEXT_TOO_LARGE");
    return Response.json({ error: "当前项目源码超过 256k 上下文上限，请先拆分页面文件。" }, { status: 413 });
  }
  const attachmentContext = parsed.data.attachments.map((file) => `参考文件：${file.name} (${file.type || "unknown"})${file.text ? `\n${file.text}` : ""}`).join("\n\n");
  const workspaceSource = parsed.data.currentSource.trim()
    ? `以下是当前工作区中正在运行的完整 HTML。本轮必须在此版本上修改，保留用户未要求改动的功能。\n<current_workspace_html>\n${parsed.data.currentSource}\n</current_workspace_html>`
    : "";
  const messages = [
    {
      role: "system" as const,
      content: `你是一个持续工作的网页编程 Agent，不是闲聊助手。把每条用户指令视为对当前工作区的修改任务，必须基于已有成品持续迭代，保留未被要求改动的内容与交互。
请返回两部分：先用 2-5 句简短中文说明本次完成了什么和如何验证；然后输出一个且只输出一个 HTML 代码块。
代码必须是修改后的完整单文件 HTML，包含所需 CSS 和 JavaScript，无需构建就能在浏览器中运行；不要只输出差异片段。用户要求互动时必须有真实交互逻辑。不使用外部 CDN、远程图片、Cookie 或网络请求。不显示 <think> 标签或内部推理。`,
    },
    ...(preparedContext.summary ? [{ role: "system" as const, content: `已压缩的项目上下文（需继续遵守）：\n${preparedContext.summary}` }] : []),
    ...(attachmentContext ? [{ role: "system" as const, content: attachmentContext }] : []),
    ...(workspaceSource ? [{ role: "user" as const, content: workspaceSource }] : []),
    ...preparedContext.messages,
  ];

  let upstream: Response;
  try {
    upstream = await providerFetch(minimaxM3Url(), {
      method: "POST",
      headers: minimaxM3Headers(),
      body: JSON.stringify(toM3Payload(messages, { stream: true, maxTokens: 16_384, temperature: 0.25 })),
    });
  } catch {
    await finishAiRequest(gateway.access, "code", false, "PROVIDER_UNAVAILABLE");
    return Response.json({ error: "AI 代码服务连接失败，请稍后重试。" }, { status: 502 });
  }
  if (!upstream.ok || !upstream.body) {
    await finishAiRequest(gateway.access, "code", false, upstream.status === 429 ? "PROVIDER_RATE_LIMITED" : "PROVIDER_REJECTED");
    return Response.json({ error: upstream.status === 429 ? "AI 服务繁忙，请稍后重试。" : "AI 代码服务未接受本次请求。" }, { status: upstream.status === 429 ? 429 : 502 });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = "";
      let rawContent = "";
      let settled = false;
      const push = (type: string, payload: Record<string, unknown> = {}) => controller.enqueue(encoder.encode(event(type, payload)));
      const settle = async (success: boolean, code?: string) => {
        if (settled) return;
        settled = true;
        await finishAiRequest(gateway.access, "code", success, code).catch(() => undefined);
      };
      try {
        push("stage", { label: "正在理解需求与参考内容" });
        const reader = upstream.body!.getReader();
        push("stage", { label: "正在规划页面结构与交互" });
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const value = line.slice(5).trim();
            if (!value || value === "[DONE]") continue;
            const chunk = JSON.parse(value) as { type?: unknown; delta?: { type?: unknown; text?: unknown } };
            const text = chunk.type === "content_block_delta" && chunk.delta?.type === "text_delta" ? chunk.delta.text : undefined;
            if (typeof text !== "string") continue;
            const appended = appendStreamChunk(rawContent, text);
            rawContent = appended.content;
            if (appended.delta) push("delta", { text: appended.delta });
          }
        }
        push("stage", { label: "正在检查成品是否可运行" });
        const source = extractMinimaxHtml(rawContent);
        if (!source) throw new Error("PROVIDER_INVALID_RESPONSE");
        push("result", { source, message: rawContent.replace(/```(?:html)?\s*[\s\S]*?```/i, "").trim() });
        await settle(true);
        push("done");
      } catch {
        await settle(false, "PROVIDER_INVALID_RESPONSE");
        push("error", { message: "AI 返回的代码无法预览，请简化需求后重试。" });
      } finally {
        controller.close();
      }
    },
    async cancel() {
      await finishAiRequest(gateway.access, "code", false, "CANCELLED").catch(() => undefined);
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", ...(gateway.access.requestId ? { "x-ai-request-id": gateway.access.requestId } : {}) } });
}
