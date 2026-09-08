import { describe, expect, it } from "vitest";
import { validateEnrollmentImportRows } from "./enrollment-import-policy";

describe("validateEnrollmentImportRows", () => {
  it("normalizes valid rows and optional source", () => {
    const result = validateEnrollmentImportRows([{ rowNumber: 2, accountId: "student-1", courseId: "course-1", startsAt: "2026-09-02T09:00", endsAt: "2026-10-02T09:00" }]);
    expect(result.issues).toEqual([]);
    expect(result.rows[0]).toMatchObject({ rowNumber: 2, source: "ADMIN", accountId: "student-1", courseId: "course-1" });
    expect(result.rows[0].startsAt).toContain("2026-09-02T");
  });

  it("rejects invalid dates and duplicate account-course rows", () => {
    const result = validateEnrollmentImportRows([
      { rowNumber: 2, accountId: "student-1", courseId: "course-1", startsAt: "not-a-date" },
      { rowNumber: 3, accountId: "student-2", courseId: "course-2", startsAt: "2026-09-03T09:00" },
      { rowNumber: 4, accountId: "student-2", courseId: "course-2", startsAt: "2026-09-03T09:00" },
    ]);
    expect(result.rows).toHaveLength(1);
    expect(result.issues.map((issue) => issue.rowNumber)).toEqual([2, 4]);
  });
});
