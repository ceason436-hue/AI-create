import { NextResponse } from 'next/server';
import { z } from "zod";
import { withAiGateway } from "@/lib/ai-gateway";
import { badRequest } from "@/lib/http";
import { providerExceptionResponse, providerFetch } from "@/lib/provider-fetch";

export const maxDuration = 120;

const musicInputSchema = z.object({
  prompt: z.string().trim().max(1_000).optional(),
  lyrics: z.string().trim().max(8_000).optional(),
  songName: z.string().trim().max(120).optional(),
}).refine(({ prompt, lyrics }) => Boolean(prompt || lyrics));

const providerMusicModels = ["music-2.6", "music-2.6-free"] as const;

function selectedProviderModel() {
  const configured = process.env.MINIMAX_MUSIC_MODEL;
  return providerMusicModels.includes(configured as (typeof providerMusicModels)[number])
    ? configured!
    : "music-2.6";
}

function rejectedMusicResponse(data: unknown, httpStatus: number) {
  const body = data && typeof data === "object" ? data as {
    base_resp?: { status_code?: unknown; status_msg?: unknown };
  } : null;
  const providerCode = typeof body?.base_resp?.status_code === "number"
    ? body.base_resp.status_code
    : undefined;
  const providerMessage = typeof body?.base_resp?.status_msg === "string"
    ? body.base_resp.status_msg.toLowerCase()
    : "";
  const quota = /balance|quota|credit|insufficient|billing/.test(providerMessage);
  const content = /sensitive|content|policy|risk/.test(providerMessage);
  const error = quota
    ? "音乐生成额度不足，请联系管理员检查 MiniMax 账户余额或 Music 2.6 权限。"
    : content
      ? "当前歌词或风格描述未通过生成校验，请修改表达后重试。"
      : "音乐服务未接受本次生成，请稍后重试或联系管理员检查模型配置。";
  return NextResponse.json({
    error,
    code: httpStatus === 429 ? "PROVIDER_RATE_LIMITED" : "PROVIDER_REJECTED",
    retryable: httpStatus === 429 || httpStatus >= 500,
    ...(providerCode !== undefined ? { providerCode } : {}),
  }, { status: httpStatus === 429 ? 429 : 502 });
}

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

    // Accept both the provider root and the commonly pasted `/v1` root.
    // Endpoint construction below owns the API version exactly once.
    const baseUrl = (process.env.MINIMAX_BASE_URL || 'https://api.minimaxi.com').replace(/\/v1\/?$/, '');
    const url = `${baseUrl}/v1/music_generation`;

    const payload: Record<string, unknown> = {
      model: selectedProviderModel(),
      prompt: prompt || "流行音乐",
      output_format: "url",
      audio_setting: { sample_rate: 44100, bitrate: 256000, format: "mp3" },
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

    if (response.status === 410 && data?.base_resp?.status_code === 2153) {
      return NextResponse.json({ error: "当前 MiniMax 账户未开放音乐生成 API，请配置可用的音乐供应商后重试。", code: "PROVIDER_UNAVAILABLE", retryable: false }, { status: 503 });
    }
    if (!response.ok || (data.base_resp && data.base_resp.status_code !== 0)) {
      console.error("MiniMax music request failed", { status: response.status, providerCode: data?.base_resp?.status_code });
      return rejectedMusicResponse(data, response.status);
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
