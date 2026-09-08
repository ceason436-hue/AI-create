import { db } from "@/lib/db";
import { publicCaptionUrl, publicMediaUrl } from "@/lib/media-files";
import { isTemporaryDeployment } from "@/lib/temporary-deployment";

export type PublicMedia = {
  assetId: string;
  src: string;
  mimeType: string | null;
  altText: string;
  sourceType: string;
  captionsSrc: string | null;
  captionLanguage: string | null;
};

export type PublicMediaAssetRecord = {
  id: string;
  status: string;
  processingStatus: string;
  mimeType: string | null;
  altText: string | null;
  title: string | null;
  sourceType: string;
  captionObjectKey: string | null;
  captionLanguage: string | null;
};

export function toPublicMedia(asset: PublicMediaAssetRecord): PublicMedia | null {
  if (asset.status !== "ACTIVE" || asset.processingStatus !== "READY") return null;
  const src = publicMediaUrl(asset.id);
  if (!src) return null;
  return {
    assetId: asset.id,
    src,
    mimeType: asset.mimeType,
    altText: asset.altText?.trim() || asset.title?.trim() || "媒体资源",
    sourceType: asset.sourceType,
    captionsSrc: asset.captionObjectKey ? publicCaptionUrl(asset.id) : null,
    captionLanguage: asset.captionLanguage,
  };
}

export async function resolvePublicMediaAssets(assetIds: Array<string | null | undefined>) {
  if (isTemporaryDeployment()) return new Map<string, PublicMedia>();
  const ids = [...new Set(assetIds.filter((id): id is string => Boolean(id)))];
  if (!ids.length) return new Map<string, PublicMedia>();
  const assets = await db.mediaAsset.findMany({
    where: { id: { in: ids }, status: "ACTIVE", processingStatus: "READY" },
    select: { id: true, status: true, processingStatus: true, mimeType: true, altText: true, title: true, sourceType: true, captionObjectKey: true, captionLanguage: true },
  });
  return new Map(assets.flatMap((asset) => {
    const media = toPublicMedia(asset);
    return media ? [[asset.id, media] as const] : [];
  }));
}
