import { requireAdminResponse } from "@/lib/admin-access";
import { previewEnrollmentImport } from "@/lib/enrollment-import";
import { db } from "@/lib/db";
import { internalError } from "@/lib/http";

export async function POST(request: Request) {
  const access = await requireAdminResponse();
  if ("response" in access) return access.response;
  try {
    const body = await request.json().catch(() => null);
    const preview = await previewEnrollmentImport(body?.rows);
    if (preview.issues.length || !preview.rows.length) return Response.json({ error: "导入校验未通过，未写入任何报名记录。", preview: { totalRows: preview.rows.length, issues: preview.issues } }, { status: 400 });
    const enrollments = await db.$transaction(async (tx) => {
      const results = await Promise.all(preview.rows.map((row) => tx.enrollment.upsert({ where: { accountId_courseId: { accountId: row.accountId, courseId: row.courseId } }, update: { source: row.source, status: "ACTIVE", startsAt: new Date(row.startsAt), endsAt: row.endsAt ? new Date(row.endsAt) : null }, create: { accountId: row.accountId, courseId: row.courseId, source: row.source, startsAt: new Date(row.startsAt), endsAt: row.endsAt ? new Date(row.endsAt) : null, createdBy: access.account.id } })));
      await tx.auditLog.create({ data: { actorId: access.account.id, action: "ENROLLMENTS_BULK_IMPORTED", targetType: "ENROLLMENT", result: "SUCCEEDED", after: { count: results.length, rowNumbers: preview.rows.map((row) => row.rowNumber) } } });
      return results;
    });
    return Response.json({ count: enrollments.length });
  } catch { return internalError(); }
}
