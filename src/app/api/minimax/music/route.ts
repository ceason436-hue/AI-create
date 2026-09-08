import { NextResponse } from 'next/server';
import { z } from "zod";
import { withAiGateway } from "@/lib/ai-gateway";
import { badRequest } from "@/lib/http";
import { providerExceptionResponse, providerFetch, providerHttpErrorResponse } from "@/lib/provider-fetch";

export const maxDuration = 120;

const musicInputSchema = z.object({
  prompt: z.string().trim().max(1_000).optional(),
  lyrics: z.string().trim().max(8_000).optional(),
  songName: z.string().trim().max(120).optional(),
}).refine(({ prompt, lyrics }) => Boolean(prompt || lyrics));

export async function POST(req: Request) {
  return withAiGateway(req, "music", async () => {
  try {
    const parsed = musicInputSchema.safeParse(await req.json());
    if (!parsed.success) return badRequest("请提供歌曲风格或歌词。");
    const body = parsed.data;
    const { prompt, lyrics } = body;

    const apiKey = process.env.MINIMAX_API_KEY;
    const groupId = process.env.MINIMAX_GROUP_ID;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'AI 服务暂不可用。' }, { status: 503 });
    }

    const baseUrl = process.env.MINIMAX_BASE_URL || 'https://api.minimaxi.com';
    const url = `${baseUrl}/v1/music_generation`;
    
    const payload: Record<string, string | boolean> = {
      model: "music-2.6-free",
      prompt: prompt || "流行音乐", 
      output_format: "url"
    };

    if (lyrics) {
      payload.lyrics = lyrics;
    } else {
      payload.lyrics_optimizer = true; // Auto-generate lyrics if not provided
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
      console.error("MiniMax music request failed", { status: response.status });
      return providerHttpErrorResponse(response);
    }

    // Music API for 2.6-free is synchronous and returns audio directly when output_format is "url"
    const audioUrl = data?.data?.audio;
    if (typeof audioUrl !== "string" || !audioUrl) return NextResponse.json({ error: "AI 未返回可用音频。", code: "RESULT_EMPTY", retryable: true }, { status: 502 });
    return NextResponse.json({ status: "SUCCEEDED", result: { kind: "MUSIC", preview: { audioUrl, traceId: typeof data.trace_id === "string" ? data.trace_id : undefined } } });

  } catch (error) {
    return providerExceptionResponse(error);
  }
  });
}
