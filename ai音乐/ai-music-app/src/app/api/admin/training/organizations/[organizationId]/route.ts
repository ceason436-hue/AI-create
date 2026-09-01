import { requireAdminResponse } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { internalError } from "@/lib/http";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  const access = await requireAdminResponse();
  if ("response" in access) return access.response;
  try {
    const { organizationId } = await params;
    const organization = await db.organization.findUnique({
      where: { id: organizationId },
      include: { cohorts: true },
    });
    if (!organization || organization.type !== "TRAINING")
      return Response.json({ error: "培训机构不存在。" }, { status: 404 });
    await db.$transaction(async (tx) => {
      await tx.auditLog.create({
        data: {
          actorId: access.account.id,
          action: "TRAINING_ORGANIZATION_DELETED",
          targetType: "ORGANIZATION",
          targetId: organization.id,
          result: "SUCCEEDED",
          before: {
            name: organization.name,
            code: organization.code,
            cohortCount: organization.cohorts.length,
          },
        },
      });
      await tx.organization.delete({ where: { id: organization.id } });
    });
    return Response.json({ deleted: true });
  } catch {
    return internalError();
  }
}
