import { requireAdminResponse } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { z } from "zod";
import { internalError } from "@/lib/http";
import { revalidateSitePage } from "@/lib/public-revalidation";

const schema = z.object({ title: z.string().trim().min(1).max(180).optional(), description: z.string().trim().max(2_000).nullable().optional(), publishStatus: z.enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]).optional() });

export async function GET(_request: Request, { params }: { params: Promise<{ pageId: string }> }) { const access = await requireAdminResponse("ADMIN_USERS"); if ("response" in access) return access.response; const { pageId } = await params; const page = await db.sitePage.findUnique({ where: { id: pageId }, include: { sections: { orderBy: { sortOrder: "asc" }, include: { revisions: { orderBy: { version: "desc" }, take: 20 } } } } }).catch(() => null); return page ? Response.json({ page }) : Response.json({ error: "页面不存在。" }, { status: 404 }); }

export async function PATCH(request: Request, { params }: { params: Promise<{ pageId: string }> }) {
  const access = await requireAdminResponse("ADMIN_USERS"); if ("response" in access) return access.response;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "页面信息无效。" }, { status: 400 });
  const { pageId } = await params;
  try {
    const page = await db.$transaction(async (tx) => {
      const before = await tx.sitePage.findUnique({ where: { id: pageId } });
      if (!before) throw new Error("PAGE_NOT_FOUND");
      const nextStatus = parsed.data.publishStatus ?? before.publishStatus;
      const updated = await tx.sitePage.update({ where: { id: pageId }, data: { ...parsed.data, publishedAt: nextStatus === "PUBLISHED" ? before.publishedAt ?? new Date() : null } });
      await tx.auditLog.create({ data: { actorId: access.account.id, action: "SITE_PAGE_UPDATED", targetType: "SITE_PAGE", targetId: pageId, result: "SUCCEEDED", before: { title: before.title, publishStatus: before.publishStatus }, after: parsed.data } });
      return updated;
    });
    revalidateSitePage(page.pageKey);
    return Response.json({ page });
  } catch (error) {
    if (error instanceof Error && error.message === "PAGE_NOT_FOUND") return Response.json({ error: "页面不存在。" }, { status: 404 });
    return internalError();
  }
}
