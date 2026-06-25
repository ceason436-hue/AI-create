import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { imageUrl, prompt, curriculumTarget } = body;

    const apiKey = process.env.MINIMAX_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: '服务器未配置 MINIMAX_API_KEY' }, { status: 500 });
    }

    const baseUrl = process.env.MINIMAX_BASE_URL || 'https://api.minimax.io';
    const url = `${baseUrl}/v1/text/chatcompletion_v2`;

    const systemPrompt = `你是一位温柔、有耐心的小学语文老师。
请仔细观察学生根据课文画的插图，并进行客观且鼓励的点评。

【极其重要的评分与点评原则】：
1. 你的点评必须【严丝合缝地围绕原文章段落】来进行，绝不能发散或脑补原文没有提到的细节。
2. 【客观评分与适当的提升空间】：请根据画面对原文要素的还原度进行评分（80-100分）。如果画面遗漏了原文中明确描写的重要视觉要素（如特定的人物、关键物品、明确的场景），请适当扣分（如给出 85-95 分），并在评语中指出。只有当原文所有的静态关键视觉元素都完美呈现时，才能给出 100 分。
3. 【理解静态图片的局限】：请充分理解静态插图在表现“连续动作、声音、心理活动”时的局限性。**绝不能因为图片不能动或没有声音，就作为扣分理由。**只评判原文中能被画出来的“静态视觉要素”。
4. 提出的改进建议必须且只能来源于“原文章段落”中未被画出的内容，绝不能要求学生添加原文不存在的元素。
5. 请用亲切、鼓励的小学老师口吻输出。

课标要求：${curriculumTarget || '无'}
原文章段落：${prompt}

返回格式必须是一个严格的 JSON 对象：
{
  "percentage": 92, // 根据实际还原度客观打分，范围80-100
  "analysis": "这里描述你在这幅画中看到了什么内容，并结合原文进行整体点评（语气亲切鼓励）...",
  "optimization": "基于原文给出简单的改进建议或鼓励语"
}
纯 JSON 输出，不要包含任何 \`\`\`json 或其他额外说明。`;

    // According to minimax vision API, image should be base64 data url or standard url
    // For vision, we use abab6.5s-chat or abab6.5-chat or abab6.5g-chat which supports vision
    // Note: If abab6.5s doesn't support vision, you might need to change the model to abab6.5g-chat
    
    let base64Data = imageUrl;
    // Format image URL properly if it's base64
    if (imageUrl.startsWith('data:image')) {
      // Keep it as is
    }

    const payload = {
      model: "abab6.5s-chat", // or abab6.5g-chat if vision is required
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: systemPrompt
            },
            {
              type: "image_url",
              image_url: {
                url: base64Data
              }
            }
          ]
        }
      ]
    };

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || (data.base_resp && data.base_resp.status_code !== 0)) {
      console.error("Minimax Vision API Error:", data);
      return NextResponse.json({ 
        error: data.base_resp?.status_msg || data.message || 'API 调用失败' 
      }, { status: response.status !== 200 ? response.status : 400 });
    }

    const choice = data.choices[0];
    let content = choice.messages ? choice.messages[choice.messages.length - 1].content : choice.message.content;
    
    // Robust JSON extraction
    let jsonStr = content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    } else {
      jsonStr = content.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    }
    
    let parsedData;
    try {
      parsedData = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse vision response", e);
      parsedData = {
        percentage: 0,
        analysis: "解析失败",
        optimization: "无"
      };
    }

    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ error: error.message || '服务器内部错误' }, { status: 500 });
  }
}
