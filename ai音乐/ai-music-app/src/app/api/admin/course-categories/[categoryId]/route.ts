import { z } from "zod";
import { requireAdminResponse } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { internalError } from "@/lib/http";
const schema = z.object({ name: z.string().trim().min(1).max(120).optional(), description: z.string().trim().max(500).optional(), sortOrder: z.number().int().min(0).max(9999).optional(), status: z.enum(["ACTIVE", "ARCHIVED"]).optional() });
export async function PATCH(request: Request, { params }: { params: Promise<{ categoryId: string }> }) { const access = await requireAdminResponse(); if ("response" in access) return access.response; const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return Response.json({ error: "分类信息无效。" }, { status: 400 }); const { categoryId } = await params; try { const category = await db.courseCategory.update({ where: { id: categoryId }, data: parsed.data }); await db.auditLog.create({ data: { actorId: access.account.id, action: "COURSE_CATEGORY_UPDATED", targetType: "COURSE_CATEGORY", targetId: category.id, result: "SUCCEEDED", after: parsed.data } }); return Response.json({ category }); } catch { return internalError(); } }
