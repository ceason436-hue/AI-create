import { describe, expect, it } from "vitest";
import { coursewareMimeType, coursewareTypeFromExtension, extensionFromFileName, isConvertibleCourseware } from "./courseware-files";

describe("courseware file classification", () => {
  it("classifies supported office files without trusting arbitrary MIME types", () => {
    expect(extensionFromFileName("课堂任务.PPTX")).toBe("pptx");
    expect(coursewareTypeFromExtension("pptx")).toBe("PPT");
    expect(coursewareMimeType("pptx", "text/plain")).toBe("application/vnd.openxmlformats-officedocument.presentationml.presentation");
    expect(isConvertibleCourseware("PPT")).toBe(true);
  });

  it("rejects unsupported extensions", () => {
    expect(coursewareTypeFromExtension("exe")).toBeNull();
    expect(extensionFromFileName("../../unsafe")).toBe("");
  });
});
