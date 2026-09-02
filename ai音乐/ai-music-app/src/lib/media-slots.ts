import { db } from "@/lib/db";
import { publicMediaUrl } from "@/lib/media-files";
import type { PublicMediaSlot } from "./site-media-slot";

export async function getPublicMediaSlots(slotKeys: string[]): Promise<Record<string, PublicMediaSlot>> {
  if (!slotKeys.length) return {};
  try {
    const slots = await db.mediaSlot.findMany({ where: { slotKey: { in: slotKeys }, status: "PUBLISHED" } });
    const assetIds = slots.flatMap((slot) => [slot.assetId, slot.mobileAssetId]).filter((id): id is string => Boolean(id));
    const assets = assetIds.length ? await db.mediaAsset.findMany({ where: { id: { in: assetIds }, status: "ACTIVE" }, select: { id: true, mimeType: true, altText: true, title: true } }) : [];
    const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
    return Object.fromEntries(slots.flatMap((slot) => { const asset = slot.assetId ? assetsById.get(slot.assetId) : null; const mobileAsset = slot.mobileAssetId ? assetsById.get(slot.mobileAssetId) : null; return asset ? [[slot.slotKey, { slotKey: slot.slotKey, title: slot.title, description: slot.description, aspectRatio: slot.aspectRatio, focalPoint: slot.focalPoint, src: publicMediaUrl(asset.id)!, mimeType: asset.mimeType, mobileSrc: mobileAsset ? publicMediaUrl(mobileAsset.id) : null, mobileMimeType: mobileAsset?.mimeType ?? null, altText: asset.altText || asset.title || slot.title }]] : []; }));
  } catch { return {}; }
}
