import { describe, expect, it } from "vitest";
import { isReservedCourseDirectionSlug, RESERVED_COURSE_DIRECTION_SLUGS } from "./public-slugs";

describe("public course slugs", () => {
  it("reserves every editorial course direction and pathway slug", () => {
    expect(RESERVED_COURSE_DIRECTION_SLUGS).toHaveLength(10);
    for (const slug of RESERVED_COURSE_DIRECTION_SLUGS) expect(isReservedCourseDirectionSlug(slug)).toBe(true);
  });

  it("normalizes input without reserving ordinary database course slugs", () => {
    expect(isReservedCourseDirectionSlug(" Programming ")).toBe(true);
    expect(isReservedCourseDirectionSlug("spring-ai-lab-2026")).toBe(false);
  });
});
