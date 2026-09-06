import { WorkStatus } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { deleteObject } from "@/lib/storage";
import { getPersonalWorkAccess } from "@/lib/works";
import { forbidden, internalError, unauthorized } from "@/lib/http";

const patchSchema = z.object({ favorite: z.boolean() }).strict();

export async function PATCH(request: Request, { params }: { params: Promise<{ workId: string }> }) {
  try {
    const access = await getPersonalWorkAccess();
    const parsed = patchSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: "作品更新参数无效。" }, { status: 400 });
    const { workId } = await params;
    const updated = await db.work.updateMany({ where: { id: workId, ownerId: access.accountId, status: { not: WorkStatus.DELETED } }, data: parsed.data });
    if (!updated.count) return Response.json({ error: "作品不存在。" }, { status: 404 });
    return Response.json({ workId, favorite: parsed.data.favorite });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") return unauthorized();
    if (error instanceof Error && ["FORBIDDEN", "NO_STORAGE_ENTITLEMENT"].includes(error.message)) return forbidden();
    return internalError();
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ workId: string }> }) {
  try {
    const access = await getPersonalWorkAccess();
    const { workId } = await params;
    const work = await db.work.findFirst({ where: { id: workId, ownerId: access.accountId, status: { not: WorkStatus.DELETED } }, include: { assets: true } });
    if (!work) return Response.json({ error: "作品不存在。" }, { status: 404 });
    await db.work.update({ where: { id: work.id }, data: { status: WorkStatus.DELETING } });
    try {
      await Promise.all(work.assets.map((asset) => deleteObject(asset.objectKey)));
      await db.work.update({ where: { id: work.id }, data: { status: WorkStatus.DELETED } });
      return Response.json({ ok: true });
    } catch {
      await db.work.update({ where: { id: work.id }, data: { status: WorkStatus.FAILED } });
      return internalError();
    }
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") return unauthorized();
    if (error instanceof Error && ["FORBIDDEN", "NO_STORAGE_ENTITLEMENT"].includes(error.message)) return forbidden();
    return internalError();
  }
}
