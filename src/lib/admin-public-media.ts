import { db } from "@/lib/db";

export async function isReadyPublicMedia(assetId: string | null | undefined, mimePrefix?: string) {
  if (!assetId) return true;
  const asset = await db.mediaAsset.findFirst({
    where: {
      id: assetId,
      status: "ACTIVE",
      processingStatus: "READY",
      ...(mimePrefix ? { mimeType: { startsWith: mimePrefix } } : {}),
    },
    select: { id: true },
  });
  return Boolean(asset);
}
