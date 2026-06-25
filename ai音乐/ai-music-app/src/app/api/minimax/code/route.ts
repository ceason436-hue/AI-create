import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // 将默认模型替换为 MiniMax-M2.7
    const { messages, model = "MiniMax-M2.7" } = body;

    const apiKey = process.env.MINIMAX_API_KEY;
    const groupId = process.env.MINIMAX_GROUP_ID;
    
    if (!apiKey) {
      return NextResponse.json({ error: '服务器未配置 MINIMAX_API_KEY' }, { status: 500 });
    }

    const baseUrl = process.env.MINIMAX_BASE_URL || 'https://api.minimax.io';
    const url = `${baseUrl}/v1/text/chatcompletion_v2`;
    
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

    const finalMessages = [systemPrompt, ...messages];

    const payload = {
      model: model,
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

    const data = await response.json();

    if (!response.ok || (data.base_resp && data.base_resp.status_code !== 0)) {
      console.error("Minimax Code API Error:", data);
      return NextResponse.json({ 
        error: data.base_resp?.status_msg || data.message || 'API 调用失败' 
      }, { status: response.status !== 200 ? response.status : 400 });
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ error: error.message || '服务器内部错误' }, { status: 500 });
  }
}
