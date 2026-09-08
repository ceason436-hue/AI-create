import { describe, expect, it } from "vitest";
import { isEnrollmentExpiring, learningContinueHref } from "./learning-dashboard-policy";

describe("learning dashboard policy", () => {
  it("only marks active future expirations inside the reminder window", () => {
    const now = new Date("2026-09-02T00:00:00.000Z");
    expect(isEnrollmentExpiring(new Date("2026-09-10T00:00:00.000Z"), now)).toBe(true);
    expect(isEnrollmentExpiring(new Date("2026-09-20T00:00:00.000Z"), now)).toBe(false);
    expect(isEnrollmentExpiring(new Date("2026-09-01T00:00:00.000Z"), now)).toBe(false);
  });

  it("continues from a published lesson when it is available", () => {
    expect(learningContinueHref("ai-creation", "lesson-2", new Set(["lesson-2"]))).toBe("/learn/courses/ai-creation/lessons/lesson-2");
    expect(learningContinueHref("ai-creation", "removed", new Set())).toBe("/learn/courses/ai-creation");
  });
});
