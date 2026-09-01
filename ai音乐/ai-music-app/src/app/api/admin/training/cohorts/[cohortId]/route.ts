import { requireAdminResponse } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { internalError } from "@/lib/http";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ cohortId: string }> },
) {
  const access = await requireAdminResponse();
  if ("response" in access) return access.response;
  try {
    const { cohortId } = await params;
    await db.$transaction(async (tx) => {
      const cohort = await tx.cohort.findUnique({
        where: { id: cohortId },
        include: { organization: true },
      });
      if (!cohort) throw new Error("COHORT_NOT_FOUND");
      await tx.auditLog.create({
        data: {
          actorId: access.account.id,
          action: "COHORT_DELETED",
          targetType: "COHORT",
          targetId: cohort.id,
          result: "SUCCEEDED",
          before: { organizationId: cohort.organizationId, name: cohort.name },
        },
      });
      await tx.cohort.delete({ where: { id: cohort.id } });
      const remaining = await tx.cohort.count({
        where: { organizationId: cohort.organizationId },
      });
      if (remaining === 0)
        await tx.organization.delete({ where: { id: cohort.organizationId } });
    });
    return Response.json({ deleted: true });
  } catch (error) {
    if (error instanceof Error && error.message === "COHORT_NOT_FOUND")
      return Response.json({ error: "培训班不存在。" }, { status: 404 });
    return internalError();
  }
}
