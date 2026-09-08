import { z } from "zod";

const rawRowSchema = z.object({
  rowNumber: z.number().int().positive(),
  accountId: z.string().trim().min(1, "缺少个人账户 ID").max(128),
  courseId: z.string().trim().min(1, "缺少课程 ID").max(128),
  source: z.string().trim().max(32).optional(),
  startsAt: z.string().trim().min(1, "缺少开始时间"),
  endsAt: z.string().trim().optional().nullable(),
});

export type EnrollmentImportRow = {
  rowNumber: number;
  accountId: string;
  courseId: string;
  source: string;
  startsAt: string;
  endsAt: string | null;
};

export type EnrollmentImportIssue = { rowNumber: number; message: string };

function isoDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function validateEnrollmentImportRows(input: unknown): { rows: EnrollmentImportRow[]; issues: EnrollmentImportIssue[] } {
  const parsed = z.array(rawRowSchema).min(1, "至少提供一行报名数据").max(500, "单次最多导入 500 行").safeParse(input);
  if (!parsed.success) return { rows: [], issues: parsed.error.issues.map((issue) => ({ rowNumber: Number(issue.path[0]) + 1 || 0, message: issue.message })) };
  const issues: EnrollmentImportIssue[] = [];
  const seen = new Set<string>();
  const rows = parsed.data.flatMap((row) => {
    const startsAt = isoDate(row.startsAt);
    const endsAt = row.endsAt ? isoDate(row.endsAt) : null;
    if (!startsAt) { issues.push({ rowNumber: row.rowNumber, message: "开始时间格式无效" }); return []; }
    if (row.endsAt && !endsAt) { issues.push({ rowNumber: row.rowNumber, message: "结束时间格式无效" }); return []; }
    if (endsAt && new Date(endsAt) <= new Date(startsAt)) { issues.push({ rowNumber: row.rowNumber, message: "结束时间必须晚于开始时间" }); return []; }
    const key = `${row.accountId}:${row.courseId}`;
    if (seen.has(key)) { issues.push({ rowNumber: row.rowNumber, message: "同一账户与课程在导入文件中重复" }); return []; }
    seen.add(key);
    return [{ rowNumber: row.rowNumber, accountId: row.accountId, courseId: row.courseId, source: row.source || "ADMIN", startsAt, endsAt }];
  });
  return { rows, issues };
}
