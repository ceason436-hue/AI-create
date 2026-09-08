import { NextResponse } from 'next/server';
import { z } from "zod";
import { withAiGateway } from "@/lib/ai-gateway";
import { badRequest } from "@/lib/http";
import { providerExceptionResponse, providerFetch, providerHttpErrorResponse } from "@/lib/provider-fetch";

export const maxDuration = 120;

const imageInputSchema = z.object({
  mode: z.enum(["text2img", "img2img"]),
  prompt: z.string().trim().min(1).max(2_000),
  ratio: z.enum(["1:1", "16:9", "9:16", "4:3", "3:4"]).optional(),
  style: z.string().trim().max(300).nullish(),
  referenceImage: z.string().max(3_500_000).optional(),
});

export async function POST(req: Request) {
  return withAiGateway(req, "image", async () => {
  try {
    const parsed = imageInputSchema.safeParse(await req.json());
    if (!parsed.success) return badRequest();
    const body = parsed.data;
    const { mode, prompt, ratio, style, referenceImage } = body;
    if (mode === "img2img" && !referenceImage) return badRequest("请提供参考图片。");

    const apiKey = process.env.MINIMAX_API_KEY;
    const groupId = process.env.MINIMAX_GROUP_ID; // 可选，有些接口需要
    
    if (!apiKey) {
      return NextResponse.json({ error: 'AI 服务暂不可用。' }, { status: 503 });
    }

    // Accept both the provider root and the commonly pasted `/v1` root.
    // Endpoint construction below owns the API version exactly once.
    const baseUrl = (process.env.MINIMAX_BASE_URL || 'https://api.minimaxi.com').replace(/\/v1\/?$/, '');
    const url = `${baseUrl}/v1/image_generation`;
    
    // 如果存在专门的图生图接口，可以在这里覆盖
    // url = mode === 'img2img' ? 'https://api.minimax.chat/v1/image_generation_i2i' : url;

    // 针对Minimax的样式，拼接进prompt中
    const finalPrompt = prompt + (style ? `, ${style} style` : '');
    
    const payload: Record<string, unknown> = {
      model: "image-01",
      prompt: finalPrompt,
      aspect_ratio: ratio || "1:1",
      // URL avoids pushing multi-megabyte Base64 responses through the browser
      // and is the provider's default/recommended interactive response format.
      response_format: "url",
    };

    if (mode === 'img2img' && referenceImage) {
      // 官方图生图参数可能有区别，常见为 reference_image 或者 image_file 或者 subject_reference
      // 根据 Minimax 官方文档，一般支持直接传入参考图或使用特定参数
      // 提取 base64 部分 (去掉 data:image/jpeg;base64, 前缀)
      const base64Data = referenceImage.split(',')[1] || referenceImage;
      
      // 方案1：参考图 (如果官方使用 reference_image)
      payload.reference_image = base64Data;
      
      // 方案2：如果官方使用 subject_reference
      // payload.subject_reference = [{ type: "character", image_file: referenceImage }];
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };
    
    if (groupId) {
      headers['GroupId'] = groupId;
    }

    const response = await providerFetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || (data.base_resp && data.base_resp.status_code !== 0)) {
      console.error("MiniMax image request failed", { status: response.status });
      return providerHttpErrorResponse(response);
    }

    // URL responses keep the UI responsive; retain Base64 parsing for compatibility.
    let base64Image = '';
    if (data.data && data.data.image_base64 && data.data.image_base64.length > 0) {
      base64Image = `data:image/jpeg;base64,${data.data.image_base64[0]}`;
    } else if (data.data && data.data.image_urls && data.data.image_urls.length > 0) {
      base64Image = data.data.image_urls[0];
    } else {
      return NextResponse.json({ error: '返回的数据格式不匹配，未能找到图片数据' }, { status: 500 });
    }

    return NextResponse.json({ status: "SUCCEEDED", result: { kind: "IMAGE", preview: { image: base64Image } } });

  } catch (error) {
    return providerExceptionResponse(error);
  }
  });
}
