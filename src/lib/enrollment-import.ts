import { AccountStatus, AccountType } from "@prisma/client";
import { db } from "@/lib/db";
import { validateEnrollmentImportRows, type EnrollmentImportIssue, type EnrollmentImportRow } from "@/lib/enrollment-import-policy";

export type EnrollmentImportPreview = { rows: EnrollmentImportRow[]; issues: EnrollmentImportIssue[] };

export async function previewEnrollmentImport(input: unknown): Promise<EnrollmentImportPreview> {
  const initial = validateEnrollmentImportRows(input);
  if (initial.issues.length || !initial.rows.length) return initial;
  const [accounts, courses] = await Promise.all([
    db.account.findMany({ where: { id: { in: [...new Set(initial.rows.map((row) => row.accountId))] } }, select: { id: true, type: true, status: true } }),
    db.course.findMany({ where: { id: { in: [...new Set(initial.rows.map((row) => row.courseId))] } }, select: { id: true } }),
  ]);
  const accountsById = new Map(accounts.map((account) => [account.id, account]));
  const courseIds = new Set(courses.map((course) => course.id));
  const issues: EnrollmentImportIssue[] = [];
  initial.rows.forEach((row) => {
    const account = accountsById.get(row.accountId);
    if (!account) issues.push({ rowNumber: row.rowNumber, message: "个人账户不存在" });
    else if (account.type !== AccountType.PERSONAL) issues.push({ rowNumber: row.rowNumber, message: "只能为个人学员账户创建报名" });
    else if (account.status !== AccountStatus.ACTIVE) issues.push({ rowNumber: row.rowNumber, message: "个人账户未启用，不能创建报名" });
    if (!courseIds.has(row.courseId)) issues.push({ rowNumber: row.rowNumber, message: "课程不存在" });
  });
  return { rows: initial.rows, issues };
}
