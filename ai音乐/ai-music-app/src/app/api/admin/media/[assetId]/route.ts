import { z } from "zod";
import { requireAdminResponse } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { internalError } from "@/lib/http";
import { mediaSnapshot, restoredMediaData } from "@/lib/media-revisions";

const schema = z.object({ title: z.string().trim().min(1).max(180).optional(), altText: z.string().trim().max(300).optional(), licenseNote: z.string().trim().max(2_000).optional(), status: z.enum(["ACTIVE", "ARCHIVED"]).optional(), restoreVersion: z.number().int().min(1).optional() });

export async function PATCH(request: Request, { params }: { params: Promise<{ assetId: string }> }) {
  const access = await requireAdminResponse(); if ("response" in access) return access.response;
  const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return Response.json({ error: "媒体资源信息无效。" }, { status: 400 });
  const { assetId } = await params;
  try {
    const asset = await db.$transaction(async (tx) => {
      const revision = parsed.data.restoreVersion ? await tx.mediaAssetRevision.findUnique({ where: { assetId_version: { assetId, version: parsed.data.restoreVersion } } }) : null;
      if (parsed.data.restoreVersion && !revision) throw new Error("REVISION_NOT_FOUND");
      const restored = revision ? restoredMediaData(revision.payload) : null;
      if (revision && !restored) throw new Error("REVISION_NOT_FOUND");
      const data = restored ?? Object.fromEntries(Object.entries(parsed.data).filter(([key, value]) => key !== "restoreVersion" && value !== undefined));
      const updated = await tx.mediaAsset.update({ where: { id: assetId }, data });
      const latest = await tx.mediaAssetRevision.aggregate({ where: { assetId }, _max: { version: true } }); const version = (latest._max.version ?? 0) + 1;
      await tx.mediaAssetRevision.create({ data: { assetId, version, payload: mediaSnapshot(updated), createdBy: access.account.id } });
      await tx.auditLog.create({ data: { actorId: access.account.id, action: revision ? "MEDIA_RESTORED" : "MEDIA_UPDATED", targetType: "MEDIA_ASSET", targetId: assetId, result: "SUCCEEDED", after: { version, restoreVersion: parsed.data.restoreVersion } } });
      return updated;
    });
    return Response.json({ asset });
  } catch (error) { if (error instanceof Error && error.message === "REVISION_NOT_FOUND") return Response.json({ error: "媒体历史版本不存在。" }, { status: 404 }); return internalError(); }
}
