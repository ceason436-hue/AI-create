import { describe, expect, it } from "vitest";
import { DEFAULT_HOME_CONTENT, homePageContent, isValidManagedSectionPayload } from "./public-page-contract";

describe("public page content", () => {
  it("accepts a complete typed published payload", () => {
    const content = homePageContent([{ id: "hero", sectionType: "HERO", title: null, sortOrder: 0, payload: { ...DEFAULT_HOME_CONTENT.hero, titleLine1: "后台标题" } }]);
    expect(content.hero.titleLine1).toBe("后台标题");
  });

  it("rejects partial or mistyped payloads as a whole section", () => {
    const content = homePageContent([{ id: "hero", sectionType: "HERO", title: null, sortOrder: 0, payload: { titleLine1: 42 } }]);
    expect(content.hero).toEqual(DEFAULT_HOME_CONTENT.hero);
  });

  it("validates known managed payloads while allowing unrelated section types", () => {
    expect(isValidManagedSectionPayload("home", "HERO", DEFAULT_HOME_CONTENT.hero)).toBe(true);
    expect(isValidManagedSectionPayload("home", "HERO", { titleLine1: 42 })).toBe(false);
    expect(isValidManagedSectionPayload("about", "BODY", { blocks: [] })).toBe(true);
  });
});
