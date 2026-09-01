import { randomUUID } from "crypto";
import { requireAdminResponse } from "@/lib/admin-access";
import { coursewareMimeType, coursewareTypeFromExtension, extensionFromFileName } from "@/lib/courseware-files";
import { db } from "@/lib/db";
import { badRequest, internalError } from "@/lib/http";
import { deleteObject, putObjectAtKey } from "@/lib/storage";

export const runtime = "nodejs";

const DEFAULT_MAX_UPLOAD_BYTES = 200 * 1024 * 1024;

function uploadLimit() {
  const configured = Number(process.env.COURSEWARE_UPLOAD_MAX_BYTES);
  return Number.isSafeInteger(configured) && configured >= 1_024 * 1_024 && configured <= 2 * 1024 * 1024 * 1024 ? configured : DEFAULT_MAX_UPLOAD_BYTES;
}

function stringField(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const access = await requireAdminResponse();
  if ("response" in access) return access.response;

  const form = await request.formData().catch(() => null);
  if (!form) return badRequest("上传表单无效。");
  const courseId = stringField(form, "courseId");
  const lessonId = stringField(form, "lessonId") || undefined;
  const requestedTitle = stringField(form, "title");
  const file = form.get("file");
  if (!courseId || !(file instanceof File) || !file.size) return badRequest("请选择课程并上传课件文件。");
  if (file.size > uploadLimit()) return badRequest("课件文件超过当前上传大小限制。");

  const extension = extensionFromFileName(file.name);
  const assetType = coursewareTypeFromExtension(extension);
  if (!assetType) return badRequest("仅支持 PDF、PPT/PPTX、Word、图片和常见视频格式。");
  const mimeType = coursewareMimeType(extension, file.type);

  const course = await db.course.findUnique({ where: { id: courseId }, select: { id: true } }).catch(() => null);
  if (!course) return badRequest("课程不存在。");
  if (lessonId) {
    const lesson = await db.lesson.findFirst({ where: { id: lessonId, module: { courseId } }, select: { id: true } }).catch(() => null);
    if (!lesson) return badRequest("课时不属于所选课程。");
  }

  const objectKey = `courseware/original/${courseId}/${randomUUID()}.${extension}`;
  let stored: Awaited<ReturnType<typeof putObjectAtKey>>;
  try {
    stored = await putObjectAtKey(objectKey, Buffer.from(await file.arrayBuffer()), { contentType: mimeType });
  } catch {
    return Response.json({ error: "课件原件暂时无法存储，请检查私有存储服务。" }, { status: 503 });
  }

  try {
    const asset = await db.$transaction(async (tx) => {
      const created = await tx.coursewareAsset.create({
        data: {
          courseId,
          lessonId,
          title: requestedTitle.slice(0, 180) || file.name.slice(0, 180),
          assetType,
          originalObjectKey: stored.objectKey,
          originalMimeType: mimeType,
          sizeBytes: BigInt(stored.sizeBytes),
          checksum: stored.checksum,
          conversionStatus: "PENDING",
          publishStatus: "DRAFT",
          createdBy: access.account.id,
          updatedBy: access.account.id,
        },
      });
      await tx.coursewareJob.create({ data: { assetId: created.id, jobType: assetType === "PPT" || assetType === "WORD" ? "CONVERT" : "PREPARE_PREVIEW" } });
      await tx.auditLog.create({ data: { actorId: access.account.id, action: "COURSEWARE_UPLOADED", targetType: "COURSEWARE", targetId: created.id, result: "SUCCEEDED", after: { title: created.title, assetType, sizeBytes: stored.sizeBytes } } });
      return created;
    });
    return Response.json({ asset: { ...asset, sizeBytes: asset.sizeBytes.toString(), originalObjectKey: undefined, previewObjectKey: undefined } }, { status: 201 });
  } catch {
    await deleteObject(stored.objectKey).catch(() => undefined);
    return internalError();
  }
}
