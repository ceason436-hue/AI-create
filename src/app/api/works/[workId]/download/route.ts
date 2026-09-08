import { db } from "@/lib/db";
import { getObject } from "@/lib/storage";
import { getPersonalWorkAccess } from "@/lib/works";
import { forbidden, internalError, unauthorized } from "@/lib/http";

export async function GET(_request: Request, { params }: { params: Promise<{ workId: string }> }) {
  try {
    const access = await getPersonalWorkAccess();
    const { workId } = await params;
    const work = await db.work.findFirst({ where: { id: workId, ownerId: access.accountId, status: { in: ["ACTIVE", "READ_ONLY", "EXPIRING"] } }, include: { assets: true } });
    const asset = work?.assets[0];
    if (!work || !asset) return Response.json({ error: "作品不存在或不可下载。" }, { status: 404 });
    const content = await getObject(asset.objectKey);
    const filename = encodeURIComponent(work.title.replace(/[\\/:*?"<>|]/g, "_") || "work");
    return new Response(content, { headers: { "Content-Type": asset.mimeType, "Content-Length": String(content.byteLength), "Content-Disposition": `attachment; filename*=UTF-8''${filename}` } });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") return unauthorized();
    if (error instanceof Error && ["FORBIDDEN", "NO_STORAGE_ENTITLEMENT"].includes(error.message)) return forbidden();
    return internalError();
  }
}
