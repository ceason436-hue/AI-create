import { describe, expect, it } from "vitest";
import { chunkReadingArticle, extractMinimaxHtml, extractMinimaxJson, stripMinimaxThinking } from "./minimax-response";

describe("MiniMax response normalization", () => {
  it("removes model thinking without exposing it to the browser", () => {
    expect(stripMinimaxThinking("<think>private reasoning</think>\n最终答案")).toBe("最终答案");
    expect(stripMinimaxThinking("<think>unfinished private reasoning")).toBe("");
  });

  it("extracts fenced HTML after a thinking block", () => {
    expect(extractMinimaxHtml("<think>plan</think>\n```html\n<!doctype html><html><body>ok</body></html>\n```"))
      .toBe("<!doctype html><html><body>ok</body></html>");
  });

  it("extracts only the final JSON instead of joining reasoning JSON with the answer", () => {
    expect(extractMinimaxJson('<think>example {"wrong":true}</think>\n```json\n{"title":"春日观察"}\n```'))
      .toEqual({ title: "春日观察" });
  });

  it("splits reading input without losing text", () => {
    const article = "春".repeat(8001);
    const chunks = chunkReadingArticle(article);
    expect(chunks.map((chunk) => chunk.length)).toEqual([8000, 1]);
    expect(chunks.join("")).toBe(article);
  });
});
