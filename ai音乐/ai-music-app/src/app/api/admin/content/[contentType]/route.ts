import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireAdminResponse } from "@/lib/admin-access";
import { contentItemSnapshot, isRevisionableContentType } from "@/lib/content-item-revisions";
import { db } from "@/lib/db";
import { internalError } from "@/lib/http";

const modelNames = { activities: "activity", achievements: "achievement", teachers: "teacherProfile", campuses: "campus", partners: "partnerSchool", inquiries: "inquiry" } as const;
type ContentType = keyof typeof modelNames;
type ModelDelegate = { findMany: (args: unknown) => Promise<unknown[]>; create: (args: unknown) => Promise<Record<string, unknown>> };
const baseSchema = z.object({ name: z.string().trim().min(1).max(180).optional(), title: z.string().trim().min(1).max(180).optional(), slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{2,180}$/).optional(), summary: z.string().trim().max(500).optional(), description: z.string().trim().max(2_000).optional(), content: z.string().trim().max(20_000).optional(), coverAssetId: z.string().trim().max(120).optional(), publishStatus: z.enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]).default("DRAFT"), sortOrder: z.number().int().min(0).max(9999).default(0), activityType: z.string().trim().max(64).optional(), achievementType: z.string().trim().max(64).optional(), bio: z.string().trim().max(2_000).optional(), address: z.string().trim().max(300).optional(), contact: z.string().trim().max(160).optional(), inquiryType: z.string().trim().max(32).optional() });

function getModel(client: unknown, type: string) {
  if (!(type in modelNames)) return null;
  return (client as Record<string, ModelDelegate>)[modelNames[type as ContentType]];
}

export async function GET(_request: Request, { params }: { params: Promise<{ contentType: string }> }) {
  const access = await requireAdminResponse(); if ("response" in access) return access.response;
  const { contentType } = await params; const model = getModel(db, contentType);
  if (!model) return Response.json({ error: "内容类型不存在。" }, { status: 404 });
  try { return Response.json({ items: await model.findMany({ orderBy: { sortOrder: "asc" } }) }); } catch { return internalError(); }
}

export async function POST(request: Request, { params }: { params: Promise<{ contentType: string }> }) {
  const access = await requireAdminResponse(); if ("response" in access) return access.response;
  const { contentType } = await params; if (!getModel(db, contentType)) return Response.json({ error: "内容类型不存在。" }, { status: 404 });
  const parsed = baseSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "内容信息无效。" }, { status: 400 });
  const input = parsed.data; const title = input.title ?? input.name;
  if (!title) return Response.json({ error: "需要标题或名称。" }, { status: 400 });
  const assetId = input.coverAssetId || undefined;
  const data = contentType === "teachers" ? { name: title, bio: input.description ?? input.bio, avatarAssetId: assetId, publishStatus: input.publishStatus, sortOrder: input.sortOrder } : contentType === "partners" ? { name: title, description: input.description ?? input.bio, logoAssetId: assetId, publishStatus: input.publishStatus, sortOrder: input.sortOrder } : contentType === "campuses" ? { name: title, description: input.description ?? input.bio, address: input.address, coverAssetId: assetId, publishStatus: input.publishStatus, sortOrder: input.sortOrder } : { slug: input.slug ?? `draft-${Date.now()}`, title, summary: input.summary ?? input.description ?? "", content: input.content, coverAssetId: assetId, activityType: input.activityType, achievementType: input.achievementType, publishStatus: input.publishStatus, sortOrder: input.sortOrder };
  try {
    const item = await db.$transaction(async (tx) => {
      const model = getModel(tx, contentType); if (!model) throw new Error("MODEL_NOT_FOUND");
      const created = await model.create({ data });
      if (isRevisionableContentType(contentType)) await tx.contentItemRevision.create({ data: { contentType, contentId: String(created.id), version: 1, payload: contentItemSnapshot(contentType, created) as Prisma.InputJsonValue, createdBy: access.account.id } });
      await tx.auditLog.create({ data: { actorId: access.account.id, action: "CONTENT_CREATED", targetType: contentType.toUpperCase(), targetId: String(created.id), result: "SUCCEEDED", after: { title, publishStatus: input.publishStatus, assetId, version: isRevisionableContentType(contentType) ? 1 : undefined } } });
      return created;
    });
    return Response.json({ item }, { status: 201 });
  } catch { return internalError(); }
}
