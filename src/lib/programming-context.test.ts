import { describe, expect, it } from "vitest";
import {
  estimateProgrammingTokens,
  prepareProgrammingContext,
} from "./programming-context";

describe("AI programming context manager", () => {
  it("estimates Chinese and ASCII content conservatively", () => {
    expect(estimateProgrammingTokens("修改页面")).toBe(4);
    expect(estimateProgrammingTokens("abcdefgh")).toBe(2);
  });

  it("keeps the workspace untouched below the high-water mark", () => {
    const messages = [{ role: "user" as const, content: "把按钮改成蓝色" }];
    expect(prepareProgrammingContext({ messages, currentSource: "<html></html>", limit: 100 }).compacted).toBe(false);
  });

  it("compresses older turns but always keeps the current source and recent task", () => {
    const messages = Array.from({ length: 20 }, (_, index) => ({
      role: index % 2 ? "assistant" as const : "user" as const,
      content: `${index}-${"x".repeat(160)}`,
    }));
    const result = prepareProgrammingContext({ messages, currentSource: "<html>current</html>", limit: 300, target: 180 });
    expect(result.compacted).toBe(true);
    expect(result.messages.at(-1)?.content).toBe(messages.at(-1)?.content);
    expect(result.messages.length).toBeLessThan(messages.length);
    expect(result.summary).toContain("用户要求");
  });

  it("prioritizes the newest instruction when the source consumes most of the budget", () => {
    const latest = { role: "user" as const, content: "保留游戏规则并把背景改成蓝色" };
    const result = prepareProgrammingContext({
      messages: [{ role: "user", content: "x".repeat(400) }, latest],
      currentSource: "页".repeat(240),
      limit: 300,
      target: 180,
    });
    expect(result.messages).toEqual([latest]);
    expect(result.estimatedTokens).toBeLessThanOrEqual(300);
  });
});
