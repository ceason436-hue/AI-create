import { NextResponse } from 'next/server';

export const maxDuration = 120; // 允许最长 120 秒执行时间

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, model = "abab6.5s-chat", tools } = body;

    const apiKey = process.env.MINIMAX_API_KEY;
    const groupId = process.env.MINIMAX_GROUP_ID;
    
    if (!apiKey) {
      return NextResponse.json({ error: '服务器未配置 MINIMAX_API_KEY' }, { status: 500 });
    }

    const baseUrl = process.env.MINIMAX_BASE_URL || 'https://api.minimaxi.com';
    const url = `${baseUrl}/v1/chat/completions`;
    
    let finalModel = model;
    // 如果客户端传了旧模型，自动映射到新模型
    if (model.includes("abab")) {
      finalModel = "MiniMax-M2.7";
    }

    const systemContent = "MM智能助理是一款由MiniMax自研的，没有调用其他产品的接口的大型语言模型。MiniMax是一家中国科技公司，一直致力于进行大模型相关的研究。当你需要获取实时信息或事实性知识时，请务必使用联网搜索工具。";
    
    const finalMessages = [...messages];
    if (finalMessages.length > 0 && finalMessages[0].role !== 'system') {
      finalMessages.unshift({ role: 'system', content: systemContent });
    }

    const payload: any = {
      model: finalModel,
      messages: finalMessages
    };

    if (tools) {
      payload.tools = tools;
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
    } catch (e) {
      console.error("Minimax Chat API returned non-JSON:", responseText.substring(0, 200));
      return NextResponse.json({ 
        error: 'AI 生成时间较长，导致请求超时或服务器返回了异常响应，请稍后重试。' 
      }, { status: 502 });
    }

    if (!response.ok || (data.base_resp && data.base_resp.status_code !== 0)) {
      console.error("Minimax Chat API Error:", data);
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
