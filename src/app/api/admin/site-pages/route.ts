import { z } from "zod";
import { requireAdminResponse } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { internalError } from "@/lib/http";

const schema = z.object({ pageKey: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{2,80}$/), title: z.string().trim().min(1).max(180), description: z.string().trim().max(2_000).optional(), publishStatus: z.enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]).default("DRAFT") });

export async function GET() { const access = await requireAdminResponse(); if ("response" in access) return access.response; try { const pages = await db.sitePage.findMany({ include: { _count: { select: { sections: true } } }, orderBy: { updatedAt: "desc" } }); return Response.json({ pages }); } catch { return internalError(); } }
export async function POST(request: Request) { const access = await requireAdminResponse(); if ("response" in access) return access.response; const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return Response.json({ error: "页面信息无效。" }, { status: 400 }); try { const page = await db.$transaction(async (tx) => { const created = await tx.sitePage.create({ data: { ...parsed.data, publishedAt: parsed.data.publishStatus === "PUBLISHED" ? new Date() : undefined } }); await tx.auditLog.create({ data: { actorId: access.account.id, action: "SITE_PAGE_CREATED", targetType: "SITE_PAGE", targetId: created.id, result: "SUCCEEDED", after: { pageKey: created.pageKey, title: created.title } } }); return created; }); return Response.json({ page }, { status: 201 }); } catch (error) { if (error instanceof Error && error.message.includes("Unique constraint")) return Response.json({ error: "页面 Key 已存在。" }, { status: 409 }); return internalError(); } }
