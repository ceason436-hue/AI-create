import { describe, expect, it } from "vitest";
import { coursePublicationIssues } from "./course-publication-policy";

describe("coursePublicationIssues", () => {
  it("requires audience, cover and a published module", () => {
    expect(coursePublicationIssues({ publishedModuleCount: 0 })).toEqual(["请填写适合人群与先修要求。", "请绑定课程封面媒体资源。", "至少发布一个课程模块后才能发布课程。"]);
  });

  it("accepts a publish-ready course", () => {
    expect(coursePublicationIssues({ targetAudience: "三至六年级", coverAssetId: "media-1", publishedModuleCount: 1 })).toEqual([]);
  });
});
