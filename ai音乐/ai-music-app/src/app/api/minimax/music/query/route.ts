import { NextResponse } from 'next/server';

export const maxDuration = 120;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('task_id');

    if (!taskId) {
      return NextResponse.json({ error: 'Missing task_id' }, { status: 400 });
    }

    const apiKey = process.env.MINIMAX_API_KEY;
    const groupId = process.env.MINIMAX_GROUP_ID;
    
    if (!apiKey) {
      return NextResponse.json({ error: '服务器未配置 MINIMAX_API_KEY' }, { status: 500 });
    }

    const baseUrl = process.env.MINIMAX_BASE_URL || 'https://api.minimaxi.com';
    const url = `${baseUrl}/v1/query/music_generation?task_id=${taskId}`;

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${apiKey}`,
    };

    if (groupId) {
      headers['GroupId'] = groupId;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok || (data.base_resp && data.base_resp.status_code !== 0)) {
      console.error("Minimax API Error:", data);
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
