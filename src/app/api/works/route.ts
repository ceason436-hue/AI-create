import { Prisma, RequestStatus, WorkStatus, WorkType } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { badRequest, forbidden, internalError, serviceUnavailable, unauthorized } from "@/lib/http";
import { putObject, deleteObject } from "@/lib/storage";
import { getPersonalWorkAccess, usedStorageBytes } from "@/lib/works";
import { resolveWorkCourseContext } from "@/lib/work-course-context";

const mimeTypes = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "text/html": "html",
  "application/json": "json",
} as const;

const workSchema = z.object({
  type: z.nativeEnum(WorkType),
  title: z.string().trim().min(1).max(200),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "audio/mpeg", "audio/wav", "text/html", "application/json"]),
  contentBase64: z.string().min(1).max(3_500_000),
  expiresAt: z.string().datetime().optional(),
  courseId: z.string().min(1).optional(),
  lessonId: z.string().min(1).optional(),
});

function accessError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHENTICATED") return unauthorized();
  if (error instanceof Error && error.message === "FORBIDDEN") return forbidden("学校课堂账号不能使用云端作品库。");
  if (error instanceof Error && error.message === "NO_STORAGE_ENTITLEMENT") return forbidden("当前账户没有可用的云端作品存储权益。");
  return null;
}

export async function GET() {
  try {
    const access = await getPersonalWorkAccess();
    const works = await db.work.findMany({
      where: { ownerId: access.accountId, status: { not: WorkStatus.DELETED } },
      include: { assets: { select: { id: true, mimeType: true, sizeBytes: true, checksum: true } }, courseContext: { include: { course: { select: { name: true, slug: true } }, lesson: { select: { title: true } } } } },
      orderBy: { updatedAt: "desc" },
    });
    const usedBytes = await usedStorageBytes(access.accountId);
    return Response.json({ works: works.map((work) => ({ ...work, sizeBytes: work.sizeBytes.toString(), assets: work.assets.map((asset) => ({ ...asset, sizeBytes: asset.sizeBytes.toString() })) })), storage: { usedBytes: usedBytes.toString(), limitBytes: access.storageLimitBytes.toString() } });
  } catch (error) {
    const response = accessError(error);
    return response ?? internalError();
  }
}

export async function POST(request: Request) {
  let objectKey: string | undefined;
  try {
    const access = await getPersonalWorkAccess();
    const sourceRequestId = request.headers.get("x-ai-request-id")?.trim() || undefined;
    if (sourceRequestId && !/^[A-Za-z0-9_-]{8,128}$/.test(sourceRequestId)) return badRequest("AI 请求编号无效。");
    if (sourceRequestId) {
      const existing = await db.work.findFirst({ where: { ownerId: access.accountId, sourceRequestId }, include: { assets: true, courseContext: true } });
      if (existing) return Response.json({ work: { ...existing, sizeBytes: existing.sizeBytes.toString(), assets: existing.assets.map((asset) => ({ ...asset, sizeBytes: asset.sizeBytes.toString() })), replay: true } });
      const source = await db.aiRequest.findFirst({ where: { requestId: sourceRequestId, accountId: access.accountId, status: RequestStatus.SUCCEEDED }, select: { requestId: true } });
      if (!source) return forbidden("只能保存本人已成功完成的 AI 请求结果。");
    }
    const parsed = workSchema.safeParse(await request.json());
    if (!parsed.success) return badRequest("作品内容或文件类型无效。");
    const content = Buffer.from(parsed.data.contentBase64, "base64");
    if (content.byteLength === 0 || content.byteLength > 2 * 1024 * 1024) return badRequest("单个作品文件必须小于 2MB。");
    const stored = await putObject(access.accountId, content, mimeTypes[parsed.data.mimeType]);
    objectKey = stored.objectKey;
    const requestedExpiry = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;
    const freePlanExpiry = new Date(Date.now() + 30 * 86_400_000);
    const expiresAt = (access.isFreePlan || parsed.data.type === WorkType.READING) && (!requestedExpiry || requestedExpiry > freePlanExpiry) ? freePlanExpiry : requestedExpiry;
    const courseContext = parsed.data.courseId ? await resolveWorkCourseContext(access.accountId, parsed.data.courseId, parsed.data.lessonId) : null;
    if (parsed.data.courseId && !courseContext) return forbidden("只能关联到本人报名有效且已发布的课程与课时。");
    const work = await db.$transaction(async (tx) => {
      const aggregate = await tx.work.aggregate({ where: { ownerId: access.accountId, status: { not: WorkStatus.DELETED } }, _sum: { sizeBytes: true } });
      if ((aggregate._sum.sizeBytes ?? BigInt(0)) + BigInt(stored.sizeBytes) > access.storageLimitBytes) throw new Error("STORAGE_QUOTA_EXCEEDED");
      const created = await tx.work.create({
        data: {
          ownerId: access.accountId,
          sourceRequestId,
          type: parsed.data.type,
          title: parsed.data.title,
          sizeBytes: BigInt(stored.sizeBytes),
          expiresAt,
          courseContext: courseContext ? { create: { ...courseContext, contextType: "MANUAL_LINK" } } : undefined,
          assets: { create: { objectKey: stored.objectKey, mimeType: parsed.data.mimeType, sizeBytes: BigInt(stored.sizeBytes), checksum: stored.checksum } },
        },
        include: { assets: true, courseContext: { include: { course: { select: { name: true, slug: true } }, lesson: { select: { title: true } } } } },
      });
      if (sourceRequestId) await tx.aiRequest.update({ where: { requestId: sourceRequestId }, data: { resultRef: { workId: created.id, assetIds: created.assets.map((asset) => asset.id) } } });
      return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return Response.json({ work: { ...work, sizeBytes: work.sizeBytes.toString(), assets: work.assets.map((asset) => ({ ...asset, sizeBytes: asset.sizeBytes.toString() })) } }, { status: 201 });
  } catch (error) {
    if (objectKey) await deleteObject(objectKey).catch(() => undefined);
    const response = accessError(error);
    if (response) return response;
    if (error instanceof Error && error.message === "STORAGE_QUOTA_EXCEEDED") return forbidden("云端存储空间不足，请删除作品或联系管理员升级权益。");
    if (error instanceof Error && error.message === "STORAGE_DRIVER_NOT_IMPLEMENTED") return serviceUnavailable("当前存储驱动不可用。");
    return internalError();
  }
}
