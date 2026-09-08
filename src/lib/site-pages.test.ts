import { describe, expect, it } from "vitest";
import { sectionPayload, type PublishedSection } from "./site-page-payload";

const sections: PublishedSection[] = [
  { id: "hero-1", sectionType: "HERO", title: "首屏", payload: { title: "由后台发布的标题", primaryLabel: "浏览课程" }, sortOrder: 0 },
];

describe("sectionPayload", () => {
  it("merges a published section payload over the safe fallback", () => {
    expect(sectionPayload(sections, "HERO", { title: "默认标题", intro: "默认说明", primaryLabel: "默认按钮" })).toEqual({ title: "由后台发布的标题", intro: "默认说明", primaryLabel: "浏览课程" });
  });

  it("keeps the fallback when the requested section is missing or malformed", () => {
    const fallback = { title: "默认标题" };
    expect(sectionPayload(sections, "PROCESS", fallback)).toBe(fallback);
    expect(sectionPayload([{ ...sections[0], payload: ["invalid"] }], "HERO", fallback)).toBe(fallback);
  });
});
