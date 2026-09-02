import { requireAdminResponse } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { internalError } from "@/lib/http";

export async function GET(_request: Request, { params }: { params: Promise<{ assetId: string }> }) {
  const access = await requireAdminResponse(); if ("response" in access) return access.response;
  const { assetId } = await params;
  try { return Response.json({ revisions: await db.mediaAssetRevision.findMany({ where: { assetId }, select: { id: true, version: true, payload: true, createdAt: true }, orderBy: { version: "desc" } }) }); } catch { return internalError(); }
}
