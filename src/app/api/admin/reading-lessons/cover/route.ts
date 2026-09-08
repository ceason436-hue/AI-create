import { randomUUID } from "crypto";
import { requireAdminResponse } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { matchesMediaSignature } from "@/lib/media-files";
import { providerFetch, providerExceptionResponse, providerHttpErrorResponse } from "@/lib/provider-fetch";
import { putObjectAtKey } from "@/lib/storage";
import { z } from "zod";

export const maxDuration = 120;
const schema = z.object({ title: z.string().trim().min(1).max(120), summary: z.string().trim().max(600).optional(), article: z.string().trim().max(4_000).optional(), style: z.string().trim().max(120).optional() });

export async function POST(request: Request) {
  const access = await requireAdminResponse("ADMIN_CONTENT");
  if ("response" in access) return access.response;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "请先填写课文名称。" }, { status: 400 });
  if (!process.env.MINIMAX_API_KEY) return Response.json({ error: "MiniMax 图片服务尚未配置。" }, { status: 503 });
  try {
    const baseUrl = (process.env.MINIMAX_BASE_URL || "https://api.minimaxi.com").replace(/\/v1\/?$/, "");
    const prompt = `为小学语文课文《${parsed.data.title}》设计一张精致的横版绘本课程封面。内容依据：${parsed.data.summary || parsed.data.article?.slice(0, 500) || "课文主题"}。画面细节丰富、人物友好、适合儿童阅读、主体完整、留出安全边距；不要文字、不要校徽、不要水印。${parsed.data.style || "温暖水彩绘本"}`;
    const generated = await providerFetch(`${baseUrl}/v1/image_generation`, { method: "POST", headers: { Authorization: `Bearer ${process.env.MINIMAX_API_KEY}`, "Content-Type": "application/json", ...(process.env.MINIMAX_GROUP_ID ? { GroupId: process.env.MINIMAX_GROUP_ID } : {}) }, body: JSON.stringify({ model: "image-01", prompt, aspect_ratio: "16:9", response_format: "url" }) });
    const data = await generated.json().catch(() => null) as { data?: { image_urls?: string[] }; base_resp?: { status_code?: number } } | null;
    if (!generated.ok || data?.base_resp?.status_code) return providerHttpErrorResponse(generated);
    const remoteUrl = data?.data?.image_urls?.[0];
    if (!remoteUrl) return Response.json({ error: "图片服务没有返回封面。" }, { status: 502 });
    const imageResponse = await providerFetch(remoteUrl);
    if (!imageResponse.ok) throw new Error("COVER_DOWNLOAD_FAILED");
    const content = Buffer.from(await imageResponse.arrayBuffer());
    if (content.byteLength > 15 * 1024 * 1024) return Response.json({ error: "生成封面文件过大。" }, { status: 413 });
    const header = imageResponse.headers.get("content-type")?.split(";")[0];
    const mimeType = header === "image/png" || header === "image/webp" ? header : "image/jpeg";
    if (!matchesMediaSignature(mimeType, content)) return Response.json({ error: "生成封面格式无效。" }, { status: 502 });
    const extension = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
    const stored = await putObjectAtKey(`media/${randomUUID()}.${extension}`, content, { contentType: mimeType });
    const asset = await db.mediaAsset.create({ data: { sourceType: "GENERATED", objectKey: stored.objectKey, title: `《${parsed.data.title}》课程封面`, altText: `${parsed.data.title}课文绘本封面`, mimeType, status: "ACTIVE", processingStatus: "READY" } });
    await db.auditLog.create({ data: { actorId: access.account.id, action: "READING_COVER_GENERATED", targetType: "MEDIA_ASSET", targetId: asset.id, result: "SUCCEEDED" } });
    return Response.json({ coverImage: `/api/media/${asset.id}`, assetId: asset.id });
  } catch (error) {
    return providerExceptionResponse(error);
  }
}
