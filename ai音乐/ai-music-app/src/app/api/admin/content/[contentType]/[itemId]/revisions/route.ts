import { requireAdminResponse } from "@/lib/admin-access";
import { isRevisionableContentType } from "@/lib/content-item-revisions";
import { db } from "@/lib/db";
import { internalError } from "@/lib/http";

export async function GET(_request: Request, { params }: { params: Promise<{ contentType: string; itemId: string }> }) {
  const access = await requireAdminResponse(); if ("response" in access) return access.response;
  const { contentType, itemId } = await params;
  if (!isRevisionableContentType(contentType)) return Response.json({ error: "内容类型不存在。" }, { status: 404 });
  try {
    const revisions = await db.contentItemRevision.findMany({ where: { contentType, contentId: itemId }, select: { id: true, version: true, payload: true, createdAt: true }, orderBy: { version: "desc" } });
    return Response.json({ revisions });
  } catch { return internalError(); }
}
