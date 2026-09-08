import { describe, expect, it } from "vitest";
import { builtinArticles } from "./data";

describe("AI reading built-in materials", () => {
  it("uses managed local placeholders instead of temporary third-party cover URLs", () => {
    expect(builtinArticles.every((article) => article.coverImage.startsWith("/"))).toBe(true);
  });
});
