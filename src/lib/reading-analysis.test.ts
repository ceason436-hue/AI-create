import { describe, expect, it } from "vitest";
import { localReadingAnalysis, normalizeReadingAnalysis, splitReadingScenes } from "./reading-analysis";

describe("reading scene segmentation", () => {
  it("does not leave a long article as one scene", () => {
    const article = "清晨，小朋友们从山坡出发。".repeat(35);
    expect(splitReadingScenes(article).length).toBeGreaterThan(1);
    expect(localReadingAnalysis("出发", article).segments.every((segment) => segment.text.length <= 180)).toBe(true);
  });

  it("repairs an oversized provider segment", () => {
    const article = "第一幅画面发生了变化。".repeat(40);
    const repaired = normalizeReadingAnalysis({ title: "课文", summary: "摘要", keywords: ["变化"], structure: [{ label: "全文", segmentIndexes: [0] }], segments: [{ text: article, question: "发生了什么？", evidence: "原文", difficulty: "基础" }] }, article);
    expect(repaired.segments.length).toBeGreaterThan(1);
  });

  it("keeps distinct drawable moments in a short textbook passage", () => {
    const article = "蒲公英妈妈准备了降落伞，孩子们乘着风出发。苍耳妈妈让种子挂住动物的皮毛。豌豆妈妈晒开豆荚，种子蹦着跳着离开。";
    const scenes = splitReadingScenes(article);
    expect(scenes.length).toBeGreaterThanOrEqual(3);
    expect(scenes).toEqual(expect.arrayContaining([expect.stringContaining("蒲公英"), expect.stringContaining("苍耳"), expect.stringContaining("豌豆")]));
  });
});
