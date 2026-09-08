import { NextResponse } from 'next/server';
import { z } from "zod";
import { withAiGateway } from "@/lib/ai-gateway";
import { badRequest } from "@/lib/http";
import { providerExceptionResponse, providerFetch, providerHttpErrorResponse } from "@/lib/provider-fetch";
import { extractM3Text, minimaxM3Headers, minimaxM3Url } from "@/lib/minimax-m3";

export const maxDuration = 120; // 允许最长 120 秒执行时间

const visionInputSchema = z.object({
  imageUrl: z.string().min(1).max(3_500_000),
  prompt: z.string().trim().min(1).max(20_000),
  curriculumTarget: z.string().trim().max(1_000).optional(),
});

export async function POST(req: Request) {
  return withAiGateway(req, "vision", async () => {
  try {
    const parsed = visionInputSchema.safeParse(await req.json());
    if (!parsed.success) return badRequest();
    const body = parsed.data;
    const { imageUrl, prompt, curriculumTarget } = body;

    const apiKey = process.env.MINIMAX_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'AI 服务暂不可用。' }, { status: 503 });
    }

    const url = minimaxM3Url();

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

    const dataUrl = imageUrl.match(/^data:(image\/(?:png|jpeg|gif|webp));base64,(.+)$/i);
    const imageContent = dataUrl
      ? { type: "image", source: { type: "base64", media_type: dataUrl[1], data: dataUrl[2] } }
      : { type: "image", source: { type: "url", url: imageUrl } };
    const payload = {
      model: "MiniMax-M3", // M3 supports vision
      max_tokens: 1500,
      thinking: { type: "disabled" },
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "请根据系统要求点评这幅学生插图。" }, imageContent
          ]
        }
      ]
    };

    const response = await providerFetch(url, {
      method: 'POST',
      headers: minimaxM3Headers(),
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error("Minimax Vision API returned non-JSON:", responseText.substring(0, 200));
      return NextResponse.json({ 
        error: 'AI 识别图片时间较长，导致请求超时或服务器返回了异常响应，请稍后重试。' 
      }, { status: 502 });
    }

    if (!response.ok) {
      console.error("MiniMax vision request failed", { status: response.status });
      return providerHttpErrorResponse(response);
    }

    const content = extractM3Text(data);
    
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

    return NextResponse.json({ status: "SUCCEEDED", result: { kind: "VISION", preview: parsedData } });

  } catch (error) {
    return providerExceptionResponse(error);
  }
  });
}
