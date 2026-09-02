import { describe, expect, it } from "vitest";

import { AI_TOOL_CATALOG, AI_TOOLS, isAiTool } from "./ai-tool-catalog";

describe("AI tool catalog", () => {
  it("only recognises provider routes that are implemented by the server gateway", () => {
    expect(AI_TOOLS).toEqual(["chat", "code", "image", "music", "music_query", "vision"]);
    expect(isAiTool("image")).toBe(true);
    expect(isAiTool("arbitrary-provider-route")).toBe(false);
  });

  it("gives every governed tool a deterministic public route", () => {
    for (const toolKey of AI_TOOLS) {
      expect(AI_TOOL_CATALOG[toolKey].routePath).toMatch(/^\/tools\//);
    }
  });
});
