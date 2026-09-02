import { db } from "@/lib/db";
import { getObject } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await params;
  const asset = await db.mediaAsset.findFirst({ where: { id: assetId, status: "ACTIVE", mimeType: { startsWith: "video/" } }, select: { captionObjectKey: true } }).catch(() => null);
  if (!asset?.captionObjectKey) return new Response("Not found", { status: 404 });
  try {
    return new Response(await getObject(asset.captionObjectKey), { headers: { "Content-Type": "text/vtt; charset=utf-8", "Cache-Control": "public, max-age=300", "X-Content-Type-Options": "nosniff" } });
  } catch { return new Response("Unavailable", { status: 503 }); }
}
