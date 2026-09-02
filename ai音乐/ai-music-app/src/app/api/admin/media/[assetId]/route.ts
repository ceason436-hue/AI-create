import { z } from "zod";
import { requireAdminResponse } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { internalError } from "@/lib/http";

const schema = z.object({ title: z.string().trim().min(1).max(180).optional(), altText: z.string().trim().max(300).optional(), licenseNote: z.string().trim().max(2_000).optional(), status: z.enum(["ACTIVE", "ARCHIVED"]).optional() });

export async function PATCH(request: Request, { params }: { params: Promise<{ assetId: string }> }) {
  const access = await requireAdminResponse(); if ("response" in access) return access.response;
  const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return Response.json({ error: "媒体资源信息无效。" }, { status: 400 });
  const { assetId } = await params;
  try { const asset = await db.$transaction(async (tx) => { const updated = await tx.mediaAsset.update({ where: { id: assetId }, data: parsed.data }); await tx.auditLog.create({ data: { actorId: access.account.id, action: "MEDIA_UPDATED", targetType: "MEDIA_ASSET", targetId: assetId, result: "SUCCEEDED", after: parsed.data } }); return updated; }); return Response.json({ asset }); } catch { return internalError(); }
}
