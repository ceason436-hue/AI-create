import { requireAdminResponse } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { internalError } from "@/lib/http";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ invitationId: string }> },
) {
  const access = await requireAdminResponse();
  if ("response" in access) return access.response;
  try {
    const { invitationId } = await params;
    const invitation = await db.invitationCode.findUnique({
      where: { id: invitationId },
    });
    if (!invitation)
      return Response.json({ error: "邀请码不存在。" }, { status: 404 });
    await db.$transaction(async (tx) => {
      await tx.auditLog.create({
        data: {
          actorId: access.account.id,
          action: "INVITATION_DELETED",
          targetType: "INVITATION",
          targetId: invitation.id,
          result: "SUCCEEDED",
          before: {
            status: invitation.status,
            usedCount: invitation.usedCount,
            maxUses: invitation.maxUses,
          },
        },
      });
      await tx.invitationCode.delete({ where: { id: invitation.id } });
    });
    return Response.json({ deleted: true });
  } catch {
    return internalError();
  }
}
