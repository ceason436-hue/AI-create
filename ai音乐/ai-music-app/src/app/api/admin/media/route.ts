import { randomUUID } from "crypto";
import { requireAdminResponse } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { matchesMediaSignature, mediaExtension, mediaKind, mediaMimeType } from "@/lib/media-files";
import { mediaSnapshot } from "@/lib/media-revisions";
import { initialMediaProcessingStatus } from "@/lib/media-processing-policy";
import { badRequest, internalError } from "@/lib/http";
import { deleteObject, putObjectAtKey } from "@/lib/storage";

export const runtime = "nodejs";
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const DEFAULT_MAX_VIDEO_BYTES = 200 * 1024 * 1024;
function videoUploadLimit() { const configured = Number(process.env.MEDIA_VIDEO_UPLOAD_MAX_BYTES); return Number.isSafeInteger(configured) && configured >= 10 * 1024 * 1024 && configured <= 2 * 1024 * 1024 * 1024 ? configured : DEFAULT_MAX_VIDEO_BYTES; }
const value = (form: FormData, key: string) => typeof form.get(key) === "string" ? String(form.get(key)).trim() : "";

export async function GET() {
  const access = await requireAdminResponse();
  if ("response" in access) return access.response;
  try { return Response.json({ assets: await db.mediaAsset.findMany({ orderBy: { createdAt: "desc" }, take: 200 }) }); } catch { return internalError(); }
}

export async function POST(request: Request) {
  const access = await requireAdminResponse();
  if ("response" in access) return access.response;
  const form = await request.formData().catch(() => null);
  if (!form) return badRequest("上传表单无效。");
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) return badRequest("请选择图片或视频文件。");
  const mimeType = mediaMimeType(file.name, file.type);
  if (!mimeType) return badRequest("仅支持 PNG、JPEG、WebP、GIF、AVIF、MP4 与 WebM，且文件类型必须匹配。");
  const kind = mediaKind(mimeType);
  if (file.size > (kind === "video" ? videoUploadLimit() : MAX_IMAGE_BYTES)) return badRequest(kind === "video" ? "视频超过当前上传大小限制。" : "图片超过 15MB 上传限制。");
  const title = value(form, "title").slice(0, 180) || file.name.slice(0, 180);
  const altText = value(form, "altText").slice(0, 300);
  const licenseNote = value(form, "licenseNote").slice(0, 2_000);
  const sourceType = ["REAL", "GENERATED", "HANDBOOK", "PLACEHOLDER"].includes(value(form, "sourceType")) ? value(form, "sourceType") : "REAL";
  const content = Buffer.from(await file.arrayBuffer());
  if (!matchesMediaSignature(mimeType, content)) return badRequest("媒体文件内容与声明类型不匹配。");
  const objectKey = `media/${randomUUID()}.${mediaExtension(file.name)}`;
  let stored: Awaited<ReturnType<typeof putObjectAtKey>>;
  try { stored = await putObjectAtKey(objectKey, content, { contentType: mimeType }); } catch { return Response.json({ error: "媒体文件暂时无法存储，请检查存储服务。" }, { status: 503 }); }
  try {
    const asset = await db.$transaction(async (tx) => {
      const created = await tx.mediaAsset.create({ data: { sourceType, objectKey: stored.objectKey, title, altText: altText || null, mimeType, licenseNote: licenseNote || null, status: "ACTIVE", processingStatus: initialMediaProcessingStatus(mimeType) } });
      if (kind === "video") await tx.mediaProcessingJob.create({ data: { assetId: created.id } });
      await tx.mediaAssetRevision.create({ data: { assetId: created.id, version: 1, payload: mediaSnapshot(created), createdBy: access.account.id } });
      await tx.auditLog.create({ data: { actorId: access.account.id, action: "MEDIA_UPLOADED", targetType: "MEDIA_ASSET", targetId: created.id, result: "SUCCEEDED", after: { title, sourceType, mimeType, sizeBytes: stored.sizeBytes, processingStatus: created.processingStatus } } });
      return created;
    });
    return Response.json({ asset }, { status: 201 });
  } catch { await deleteObject(stored.objectKey).catch(() => undefined); return internalError(); }
}
