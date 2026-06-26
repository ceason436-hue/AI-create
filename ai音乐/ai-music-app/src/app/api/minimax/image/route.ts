import { NextResponse } from 'next/server';

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mode, prompt, ratio, style, referenceImage } = body;

    const apiKey = process.env.MINIMAX_API_KEY;
    const groupId = process.env.MINIMAX_GROUP_ID; // 可选，有些接口需要
    
    if (!apiKey) {
      return NextResponse.json({ error: '服务器未配置 MINIMAX_API_KEY' }, { status: 500 });
    }

    const baseUrl = process.env.MINIMAX_BASE_URL || 'https://api.minimaxi.com';
    let url = `${baseUrl}/v1/image_generation`;
    
    // 如果存在专门的图生图接口，可以在这里覆盖
    // url = mode === 'img2img' ? 'https://api.minimax.chat/v1/image_generation_i2i' : url;

    // 针对Minimax的样式，拼接进prompt中
    const finalPrompt = prompt + (style ? `, ${style} style` : '');
    
    const payload: any = {
      model: "image-01",
      prompt: finalPrompt,
      aspect_ratio: ratio || "1:1",
      response_format: "base64" // 返回base64格式
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

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || (data.base_resp && data.base_resp.status_code !== 0)) {
      console.error("Minimax API Error:", data);
      return NextResponse.json({ 
        error: data.base_resp?.status_msg || data.message || 'API 调用失败' 
      }, { status: response.status !== 200 ? response.status : 400 });
    }

    // 根据 response_format: "base64"，返回的数据在 data.image_base64 (数组) 中
    let base64Image = '';
    if (data.data && data.data.image_base64 && data.data.image_base64.length > 0) {
      base64Image = `data:image/jpeg;base64,${data.data.image_base64[0]}`;
    } else if (data.data && data.data.image_urls && data.data.image_urls.length > 0) {
      base64Image = data.data.image_urls[0];
    } else {
      return NextResponse.json({ error: '返回的数据格式不匹配，未能找到图片数据' }, { status: 500 });
    }

    return NextResponse.json({ image: base64Image });

  } catch (error: any) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ error: error.message || '服务器内部错误' }, { status: 500 });
  }
}
