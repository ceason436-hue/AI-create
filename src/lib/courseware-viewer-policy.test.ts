import { describe, expect, it } from "vitest";
import { boundedCoursewarePage, coursewarePreviewUrl } from "./courseware-viewer-policy";

describe("courseware viewer navigation", () => {
  it("keeps selected pages inside the converted document bounds", () => {
    expect(boundedCoursewarePage(0, 8)).toBe(1);
    expect(boundedCoursewarePage(4, 8)).toBe(4);
    expect(boundedCoursewarePage(99, 8)).toBe(8);
  });

  it("adds the selected page as a PDF fragment without changing preview authorization", () => {
    expect(coursewarePreviewUrl("/api/me/courseware/a/content?session=opaque", 2, 8)).toBe("/api/me/courseware/a/content?session=opaque#page=2");
  });
});
