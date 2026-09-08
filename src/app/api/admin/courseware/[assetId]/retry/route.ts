import { requireAdminResponse } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { badRequest, internalError } from "@/lib/http";

export async function POST(_request: Request, { params }: { params: Promise<{ assetId: string }> }) {
  const access = await requireAdminResponse();
  if ("response" in access) return access.response;
  const { assetId } = await params;
  try {
    const asset = await db.coursewareAsset.findUnique({ where: { id: assetId }, select: { id: true, assetType: true, originalObjectKey: true } });
    if (!asset?.originalObjectKey) return badRequest("该课件没有可处理的原件。");
    await db.$transaction(async (tx) => {
      await tx.coursewareAsset.update({ where: { id: assetId }, data: { conversionStatus: "PENDING", publishStatus: "DRAFT", updatedBy: access.account.id } });
      await tx.coursewareJob.create({ data: { assetId, jobType: ["PPT", "WORD"].includes(asset.assetType) ? "CONVERT" : "PREPARE_PREVIEW" } });
      await tx.auditLog.create({ data: { actorId: access.account.id, action: "COURSEWARE_RETRY_QUEUED", targetType: "COURSEWARE", targetId: assetId, result: "SUCCEEDED" } });
    });
    return Response.json({ queued: true });
  } catch {
    return internalError();
  }
}
