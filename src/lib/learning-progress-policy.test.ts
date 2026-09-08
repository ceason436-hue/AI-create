import { describe, expect, it } from "vitest";
import { learningProgressPercent } from "./learning-progress-policy";

describe("learning progress policy", () => {
  it("derives a bounded percentage from published lesson completion", () => {
    expect(learningProgressPercent(0, 0)).toBe(0);
    expect(learningProgressPercent(1, 3)).toBe(33);
    expect(learningProgressPercent(9, 3)).toBe(100);
  });
});
