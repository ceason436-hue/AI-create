import { requireAdminResponse } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { badRequest, internalError } from "@/lib/http";

export async function POST(_request: Request, { params }: { params: Promise<{ assetId: string }> }) {
  const access = await requireAdminResponse();
  if ("response" in access) return access.response;
  const { assetId } = await params;
  try {
    const asset = await db.mediaAsset.findUnique({ where: { id: assetId }, select: { id: true, objectKey: true, mimeType: true } });
    if (!asset?.objectKey || !asset.mimeType?.startsWith("video/")) return badRequest("该媒体不是可重新处理的视频源文件。");
    await db.$transaction(async (tx) => {
      await tx.mediaAsset.update({ where: { id: assetId }, data: { processingStatus: "PENDING", processingError: null } });
      await tx.mediaProcessingJob.create({ data: { assetId } });
      await tx.auditLog.create({ data: { actorId: access.account.id, action: "MEDIA_PROCESSING_RETRY_QUEUED", targetType: "MEDIA_ASSET", targetId: assetId, result: "SUCCEEDED" } });
    });
    return Response.json({ queued: true });
  } catch {
    return internalError();
  }
}
