import { describe, expect, it } from "vitest";
import { activeEnrollmentWhere, canUseLearningCenter } from "./learning-policy";

describe("learning access policy", () => {
  it("only selects active enrollments that have started and have not expired", () => {
    const asOf = new Date("2026-09-02T08:00:00.000Z");

    expect(activeEnrollmentWhere("student-1", asOf)).toEqual({
      accountId: "student-1",
      status: "ACTIVE",
      startsAt: { lte: asOf },
      OR: [{ endsAt: null }, { endsAt: { gt: asOf } }],
    });
  });

  it("keeps the learning center limited to personal learner accounts", () => {
    expect(canUseLearningCenter("PERSONAL")).toBe(true);
    expect(canUseLearningCenter("ADMIN")).toBe(false);
    expect(canUseLearningCenter("SCHOOL_SHARED")).toBe(false);
  });
});
