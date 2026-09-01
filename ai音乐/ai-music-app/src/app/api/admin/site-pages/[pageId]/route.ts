import { requireAdminResponse } from "@/lib/admin-access";
import { db } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ pageId: string }> }) { const access = await requireAdminResponse(); if ("response" in access) return access.response; const { pageId } = await params; const page = await db.sitePage.findUnique({ where: { id: pageId }, include: { sections: { orderBy: { sortOrder: "asc" }, include: { revisions: { orderBy: { version: "desc" }, take: 20 } } } } }).catch(() => null); return page ? Response.json({ page }) : Response.json({ error: "页面不存在。" }, { status: 404 }); }
