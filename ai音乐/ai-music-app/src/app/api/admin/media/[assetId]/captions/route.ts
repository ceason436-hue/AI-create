import { randomUUID } from "crypto";
import { requireAdminResponse } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { badRequest, internalError } from "@/lib/http";
import { isWebVtt } from "@/lib/media-files";
import { mediaSnapshot } from "@/lib/media-revisions";
import { putObjectAtKey } from "@/lib/storage";

const MAX_CAPTION_BYTES = 2 * 1024 * 1024;

export async function GET(_request: Request, { params }: { params: Promise<{ assetId: string }> }) {
  const access = await requireAdminResponse();
  if ("response" in access) return access.response;
  const { assetId } = await params;
  try {
    const asset = await db.mediaAsset.findUnique({ where: { id: assetId }, select: { id: true, title: true, mimeType: true, captionObjectKey: true, captionLanguage: true } });
    if (!asset) return Response.json({ error: "媒体不存在。" }, { status: 404 });
    return Response.json({ asset });
  } catch { return internalError(); }
}

export async function POST(request: Request, { params }: { params: Promise<{ assetId: string }> }) {
  const access = await requireAdminResponse();
  if ("response" in access) return access.response;
  const { assetId } = await params;
  const form = await request.formData().catch(() => null);
  if (!form) return badRequest("字幕上传表单无效。");
  const file = form.get("file");
  const language = typeof form.get("language") === "string" ? String(form.get("language")).trim().toLowerCase() : "zh-CN";
  if (!(file instanceof File) || !file.size || file.size > MAX_CAPTION_BYTES || !/^[a-z]{2,3}(?:-[a-z0-9]{2,8})?$/.test(language)) return badRequest("字幕文件或语言标识无效。");
  const content = Buffer.from(await file.arrayBuffer());
  if (!isWebVtt(content)) return badRequest("仅支持 UTF-8 编码且以 WEBVTT 开头的 .vtt 字幕文件。");
  try {
    const source = await db.mediaAsset.findUnique({ where: { id: assetId }, select: { id: true, mimeType: true } });
    if (!source?.mimeType?.startsWith("video/")) return badRequest("字幕只能关联到视频媒体。");
    const stored = await putObjectAtKey(`media/captions/${assetId}/${randomUUID()}.vtt`, content, { contentType: "text/vtt; charset=utf-8" });
    const asset = await db.$transaction(async (tx) => {
      const updated = await tx.mediaAsset.update({ where: { id: assetId }, data: { captionObjectKey: stored.objectKey, captionLanguage: language } });
      const latest = await tx.mediaAssetRevision.aggregate({ where: { assetId }, _max: { version: true } });
      const version = (latest._max.version ?? 0) + 1;
      await tx.mediaAssetRevision.create({ data: { assetId, version, payload: mediaSnapshot(updated), createdBy: access.account.id } });
      await tx.auditLog.create({ data: { actorId: access.account.id, action: "MEDIA_CAPTION_UPLOADED", targetType: "MEDIA_ASSET", targetId: assetId, result: "SUCCEEDED", after: { language, sizeBytes: stored.sizeBytes, version } } });
      return updated;
    });
    return Response.json({ asset });
  } catch { return internalError(); }
}
