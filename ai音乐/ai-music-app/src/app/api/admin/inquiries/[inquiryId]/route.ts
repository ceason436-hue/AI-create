import { z } from "zod";
import { requireAdminResponse } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { internalError } from "@/lib/http";

const schema = z.object({ status: z.enum(["NEW", "IN_PROGRESS", "RESOLVED", "ARCHIVED"]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ inquiryId: string }> }) {
  const access = await requireAdminResponse();
  if ("response" in access) return access.response;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "线索状态无效。" }, { status: 400 });
  const { inquiryId } = await params;
  try {
    const inquiry = await db.$transaction(async (tx) => {
      const updated = await tx.inquiry.update({ where: { id: inquiryId }, data: { status: parsed.data.status, handledBy: parsed.data.status === "NEW" ? null : access.account.id } });
      await tx.auditLog.create({ data: { actorId: access.account.id, action: "INQUIRY_STATUS_UPDATED", targetType: "INQUIRY", targetId: inquiryId, result: "SUCCEEDED", after: parsed.data } });
      return updated;
    });
    return Response.json({ inquiry });
  } catch { return internalError(); }
}
