import { db } from "@/lib/db";
import { publicPlaybackObjectKey } from "@/lib/media-processing-policy";
import { getObject } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await params;
  const asset = await db.mediaAsset.findFirst({ where: { id: assetId, status: "ACTIVE" }, select: { objectKey: true, playbackObjectKey: true, processingStatus: true, mimeType: true, title: true } }).catch(() => null);
  const objectKey = asset ? publicPlaybackObjectKey(asset) : null;
  if (!asset || !objectKey) return new Response("Not found", { status: 404 });
  try {
    return new Response(await getObject(objectKey), { headers: { "Content-Type": asset.mimeType || "application/octet-stream", "Cache-Control": "public, max-age=300", "X-Content-Type-Options": "nosniff", "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(asset.title || "media")}` } });
  } catch { return new Response("Unavailable", { status: 503 }); }
}
