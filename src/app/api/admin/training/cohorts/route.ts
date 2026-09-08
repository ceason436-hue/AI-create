import { OrganizationType } from "@prisma/client";
import { z } from "zod";
import { requireAdminResponse } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { conflict, internalError } from "@/lib/http";

const cohortSchema = z.object({
  organizationName: z.string().trim().min(2).max(160),
  organizationCode: z.string().trim().toUpperCase().regex(/^[A-Z0-9_]{2,32}$/),
  name: z.string().trim().min(2).max(160),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
}).superRefine(({ startsAt, endsAt }, context) => {
  if (startsAt && endsAt && new Date(startsAt) >= new Date(endsAt)) context.addIssue({ code: z.ZodIssueCode.custom, message: "结束时间必须晚于开始时间。" });
});

export async function GET() {
  const access = await requireAdminResponse();
  if ("response" in access) return access.response;
  const cohorts = await db.cohort.findMany({ include: { organization: true, _count: { select: { members: true, invitations: true } } }, orderBy: { startsAt: "desc" } });
  return Response.json({ cohorts: cohorts.map((cohort) => ({ ...cohort, memberCount: cohort._count.members, invitationCount: cohort._count.invitations, _count: undefined })) });
}

export async function POST(request: Request) {
  const access = await requireAdminResponse();
  if ("response" in access) return access.response;
  try {
    const parsed = cohortSchema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: "培训班信息无效。" }, { status: 400 });
    const result = await db.$transaction(async (tx) => {
      const existing = await tx.organization.findUnique({ where: { code: parsed.data.organizationCode } });
      if (existing && existing.type !== OrganizationType.TRAINING) throw new Error("ORGANIZATION_CODE_CONFLICT");
      const organization = existing ?? await tx.organization.create({
        data: { type: OrganizationType.TRAINING, name: parsed.data.organizationName, code: parsed.data.organizationCode },
      });
      const cohort = await tx.cohort.create({ data: { organizationId: organization.id, name: parsed.data.name, startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : null, endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null } });
      await tx.auditLog.create({ data: { actorId: access.account.id, action: "COHORT_CREATED", targetType: "COHORT", targetId: cohort.id, result: "SUCCEEDED", after: { organizationId: organization.id } } });
      return { organization, cohort };
    });
    return Response.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "ORGANIZATION_CODE_CONFLICT") return conflict("该机构代码已被非培训机构使用。");
    return internalError();
  }
}
