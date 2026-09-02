import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireAdminResponse } from "@/lib/admin-access";
import { contentItemSnapshot, isRevisionableContentType, restoredContentItemData } from "@/lib/content-item-revisions";
import { db } from "@/lib/db";
import { internalError } from "@/lib/http";

const modelNames = { activities: "activity", achievements: "achievement", teachers: "teacherProfile", campuses: "campus", partners: "partnerSchool" } as const;
type ModelDelegate = { findUnique: (args: unknown) => Promise<Record<string, unknown> | null>; update: (args: unknown) => Promise<Record<string, unknown>> };
const schema = z.object({ title: z.string().trim().min(1).max(180).optional(), name: z.string().trim().min(1).max(180).optional(), slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{2,180}$/).optional(), summary: z.string().trim().max(500).optional(), description: z.string().trim().max(2_000).optional(), content: z.string().trim().max(20_000).optional(), coverAssetId: z.string().trim().max(120).optional(), publishStatus: z.enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]).optional(), sortOrder: z.number().int().min(0).max(9999).optional(), restoreVersion: z.number().int().min(1).optional() });

function getModel(client: unknown, contentType: string) {
  const modelName = modelNames[contentType as keyof typeof modelNames];
  return modelName ? (client as Record<string, ModelDelegate>)[modelName] : null;
}

function updateData(contentType: string, input: Record<string, unknown>) {
  if (contentType === "teachers") return { name: input.name ?? input.title, bio: input.description ?? input.content, avatarAssetId: input.coverAssetId, publishStatus: input.publishStatus, sortOrder: input.sortOrder };
  if (contentType === "partners") return { name: input.name ?? input.title, description: input.description ?? input.content, logoAssetId: input.coverAssetId, publishStatus: input.publishStatus, sortOrder: input.sortOrder };
  if (contentType === "campuses") return { name: input.name ?? input.title, description: input.description ?? input.content, coverAssetId: input.coverAssetId, publishStatus: input.publishStatus, sortOrder: input.sortOrder };
  return { title: input.title ?? input.name, slug: input.slug, summary: input.summary, content: input.content, coverAssetId: input.coverAssetId, publishStatus: input.publishStatus, sortOrder: input.sortOrder };
}
function withoutUndefined(value: Record<string, unknown>) { return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)); }

export async function PATCH(request: Request, { params }: { params: Promise<{ contentType: string; itemId: string }> }) {
  const access = await requireAdminResponse(); if ("response" in access) return access.response;
  const { contentType, itemId } = await params;
  if (!isRevisionableContentType(contentType) || !getModel(db, contentType)) return Response.json({ error: "内容类型不存在。" }, { status: 404 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "内容信息无效。" }, { status: 400 });
  try {
    const result = await db.$transaction(async (tx) => {
      const model = getModel(tx, contentType); if (!model) throw new Error("CONTENT_NOT_FOUND");
      const current = await model.findUnique({ where: { id: itemId } }); if (!current) throw new Error("CONTENT_NOT_FOUND");
      const revision = parsed.data.restoreVersion ? await tx.contentItemRevision.findUnique({ where: { contentType_contentId_version: { contentType, contentId: itemId, version: parsed.data.restoreVersion } } }) : null;
      if (parsed.data.restoreVersion && !revision) throw new Error("REVISION_NOT_FOUND");
      const restored = revision ? restoredContentItemData(contentType, revision.payload) : null;
      if (revision && !restored) throw new Error("REVISION_NOT_FOUND");
      const item = await model.update({ where: { id: itemId }, data: restored ?? withoutUndefined(updateData(contentType, parsed.data)) });
      const latest = await tx.contentItemRevision.aggregate({ where: { contentType, contentId: itemId }, _max: { version: true } });
      const version = (latest._max.version ?? 0) + 1;
      await tx.contentItemRevision.create({ data: { contentType, contentId: itemId, version, payload: contentItemSnapshot(contentType, item) as Prisma.InputJsonValue, createdBy: access.account.id } });
      await tx.auditLog.create({ data: { actorId: access.account.id, action: revision ? "CONTENT_RESTORED" : "CONTENT_UPDATED", targetType: contentType.toUpperCase(), targetId: itemId, result: "SUCCEEDED", after: { version, restoreVersion: parsed.data.restoreVersion } } });
      return { item, version };
    });
    return Response.json(result);
  } catch (error) {
    if (error instanceof Error && ["CONTENT_NOT_FOUND", "REVISION_NOT_FOUND"].includes(error.message)) return Response.json({ error: "内容或历史版本不存在。" }, { status: 404 });
    return internalError();
  }
}
