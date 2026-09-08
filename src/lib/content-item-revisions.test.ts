import { describe, expect, it } from "vitest";
import { contentItemSnapshot, restoredContentItemData } from "./content-item-revisions";

describe("content item revisions", () => {
  it("keeps only publishable activity fields in a snapshot", () => {
    expect(contentItemSnapshot("activities", { id: "ignore", title: "AI挑战赛", summary: "公开活动", startsAt: new Date("2026-09-01T00:00:00.000Z"), sortOrder: 2 })).toEqual({ title: "AI挑战赛", summary: "公开活动", startsAt: "2026-09-01T00:00:00.000Z", sortOrder: 2 });
  });

  it("does not restore unrecognised JSON fields", () => {
    expect(restoredContentItemData("partners", { name: "示例学校", logoAssetId: "media-1", dangerous: "discard" })).toEqual({ name: "示例学校", logoAssetId: "media-1" });
  });
});
