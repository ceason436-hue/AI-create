import { NextResponse } from 'next/server';
import { z } from "zod";
import { withAiGateway } from "@/lib/ai-gateway";
import { badRequest } from "@/lib/http";

export const maxDuration = 120; // 允许最长 120 秒执行时间

const codeInputSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    name: z.string().max(64).optional(),
    content: z.string().min(1).max(20_000),
  })).min(1).max(20),
});

export async function POST(req: Request) {
  return withAiGateway(req, "code", async (_requestId, courseContext) => {
  try {
    const parsed = codeInputSchema.safeParse(await req.json());
    if (!parsed.success) return badRequest();
    const body = parsed.data;
    // 将默认模型替换为 MiniMax-M2.7
    const { messages } = body;

    const apiKey = process.env.MINIMAX_API_KEY;
    const groupId = process.env.MINIMAX_GROUP_ID;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'AI 服务暂不可用。' }, { status: 503 });
    }

    const baseUrl = process.env.MINIMAX_BASE_URL || 'https://api.minimaxi.com';
    const url = `${baseUrl}/v1/chat/completions`;
    
    // 强制插入系统提示词，确保输出的代码是我们需要的格式
    const systemPrompt = {
      role: 'system',
      name: 'system',
      content: `你是一位顶级的全栈工程师和产品经理。
你的任务是根据用户需求，生成极其精美、功能完整、可以直接在浏览器中完美运行的单文件 HTML 代码（包含 HTML、CSS、JS），并引导用户进一步优化。

核心要求：
1. **结构化回复**：你的回复必须严格包含以下三个部分：
   - **第一部分（思考与反馈）**：简短地告诉用户你对需求的理解，或者你的设计思路。
   - **第二部分（代码主体）**：代码必须且只能包裹在 \`\`\`html 和 \`\`\` 之间。
   - **第三部分（优化引导）**：提出2-3个关于此页面的优化建议，引导用户继续和你对话。例如：“需要我为您添加深色模式切换功能吗？”或“是否需要把静态数据替换为动态的图表？”

2. **代码质量与交互（最重要）**：
   - 页面**绝对不能**只有背景或空壳！必须有真实丰富的内容、排版和复杂的交互。
   - 必须包含真实的 JavaScript 交互逻辑！例如：点击按钮会触发真实的 DOM 操作（弹窗、列表增删改查、状态切换等）。代码必须写在 <body> 底部的 <script> 标签中。
   - 如果是表单，必须有校验逻辑和提交后的成功提示。如果是工具（如计时器、待办事项），必须能真实运行。

3. **设计美学**：
   - 必须通过 CDN 引入 Tailwind CSS (<script src="https://cdn.tailwindcss.com"></script>) 进行页面美化。
   - 使用现代 UI 趋势：毛玻璃效果、清晰的阴影层次、平滑的过渡动画 (transition/hover)。
   - 可以引入图片占位符 (如 https://source.unsplash.com/random/800x600?tech) 增加真实感。`
    };

    const coursePrompt = courseContext ? { role: "system" as const, name: "system", content: `当前为科瑞特课程《${courseContext.courseName}》课时《${courseContext.lessonTitle}》服务。请把代码难度、示例和讲解与本课任务对应，不要虚构课程资料。课时任务：${courseContext.lessonTask ?? "请按课时标题提供合适的编程实践。"}` } : null;
    const finalMessages = [systemPrompt, ...(coursePrompt ? [coursePrompt] : []), ...messages];

    const payload = {
      model: "MiniMax-M2.7",
      messages: finalMessages,
      stream: false
    };

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
      // 尝试解析 JSON。如果网关超时（如 504），返回的是 HTML，这里会抛出异常
      data = JSON.parse(responseText);
    } catch {
      console.error("Minimax Code API returned non-JSON:", responseText.substring(0, 200));
      
      // 如果是非 JSON，尝试看看是不是包含了真实的 HTML 代码（AI成功返回的代码）
      const htmlMatch = responseText.match(/```(?:html|HTML)?\s*([\s\S]*?)```/);
      if (htmlMatch || responseText.includes("<!DOCTYPE html>")) {
        // 如果虽然非标准 JSON 但包含有效代码，尝试补救
        data = {
          base_resp: { status_code: 0 },
          choices: [{ message: { content: responseText } }]
        };
      } else {
        // 如果是纯 HTML 报错页面（比如 504 Gateway Time-out 页面）
        let errorMsg = 'AI 生成代码时间较长，导致请求超时，请稍后重试或尝试简化需求。';
        if (responseText.includes("504 Gateway Time-out")) {
           errorMsg = 'Nginx 网关连接超时 (504 Gateway Time-out)。请联系管理员检查服务器部署配置中的 proxy_read_timeout。';
        }
        return NextResponse.json({ error: errorMsg }, { status: 504 });
      }
    }

    if (!response.ok || (data.base_resp && data.base_resp.status_code !== 0)) {
      console.error("MiniMax code request failed", { status: response.status });
      return NextResponse.json({ 
        error: 'AI 服务暂时无法完成生成，请稍后重试。'
      }, { status: 502 });
    }

    return NextResponse.json(data);

  } catch {
    console.error("Code route failed");
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
  });
}
