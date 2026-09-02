import { randomUUID } from "crypto";
import { requireAdminResponse } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { mediaExtension, mediaMimeType } from "@/lib/media-files";
import { badRequest, internalError } from "@/lib/http";
import { deleteObject, putObjectAtKey } from "@/lib/storage";

export const runtime = "nodejs";
const MAX_MEDIA_BYTES = 15 * 1024 * 1024;
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
  if (!(file instanceof File) || !file.size) return badRequest("请选择图片文件。");
  if (file.size > MAX_MEDIA_BYTES) return badRequest("图片超过 15MB 上传限制。");
  const mimeType = mediaMimeType(file.name, file.type);
  if (!mimeType) return badRequest("仅支持 PNG、JPEG、WebP、GIF 与 AVIF 图片，且文件类型必须匹配。");
  const title = value(form, "title").slice(0, 180) || file.name.slice(0, 180);
  const altText = value(form, "altText").slice(0, 300);
  const licenseNote = value(form, "licenseNote").slice(0, 2_000);
  const sourceType = ["REAL", "GENERATED", "HANDBOOK", "PLACEHOLDER"].includes(value(form, "sourceType")) ? value(form, "sourceType") : "REAL";
  const objectKey = `media/${randomUUID()}.${mediaExtension(file.name)}`;
  let stored: Awaited<ReturnType<typeof putObjectAtKey>>;
  try { stored = await putObjectAtKey(objectKey, Buffer.from(await file.arrayBuffer()), { contentType: mimeType }); } catch { return Response.json({ error: "媒体文件暂时无法存储，请检查存储服务。" }, { status: 503 }); }
  try {
    const asset = await db.$transaction(async (tx) => {
      const created = await tx.mediaAsset.create({ data: { sourceType, objectKey: stored.objectKey, title, altText: altText || null, mimeType, licenseNote: licenseNote || null, status: "ACTIVE" } });
      await tx.auditLog.create({ data: { actorId: access.account.id, action: "MEDIA_UPLOADED", targetType: "MEDIA_ASSET", targetId: created.id, result: "SUCCEEDED", after: { title, sourceType, mimeType, sizeBytes: stored.sizeBytes } } });
      return created;
    });
    return Response.json({ asset }, { status: 201 });
  } catch { await deleteObject(stored.objectKey).catch(() => undefined); return internalError(); }
}
