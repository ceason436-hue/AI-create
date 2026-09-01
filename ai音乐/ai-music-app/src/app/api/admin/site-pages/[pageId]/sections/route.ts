import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { requireAdminResponse } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { internalError } from "@/lib/http";

const schema = z.object({ sectionType: z.string().trim().regex(/^[A-Z0-9_-]{2,64}$/), title: z.string().trim().max(180).optional(), sortOrder: z.number().int().min(0).max(9999).default(0), theme: z.string().trim().max(32).optional(), payload: z.record(z.string(), z.unknown()), publishStatus: z.enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]).default("DRAFT") });
const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
export async function POST(request: Request, { params }: { params: Promise<{ pageId: string }> }) { const access = await requireAdminResponse(); if ("response" in access) return access.response; const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return Response.json({ error: "区块信息无效。" }, { status: 400 }); const { pageId } = await params; try { const section = await db.$transaction(async (tx) => { const created = await tx.pageSection.create({ data: { pageId, ...parsed.data, payload: json(parsed.data.payload) } }); await tx.contentRevision.create({ data: { sectionId: created.id, version: 1, payload: json(parsed.data.payload), createdBy: access.account.id } }); await tx.auditLog.create({ data: { actorId: access.account.id, action: "PAGE_SECTION_CREATED", targetType: "PAGE_SECTION", targetId: created.id, result: "SUCCEEDED", after: json(parsed.data) } }); return created; }); return Response.json({ section }, { status: 201 }); } catch { return internalError(); } }
