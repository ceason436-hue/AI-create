import { describe, expect, it } from "vitest";
import { aiToolCreditCostsSchema } from "./ai-cost-policy";

const validCosts = { chat: 1, code: 2, image: 3, music: 4, music_query: 1, vision: 5 };

describe("AI credit cost policy", () => {
  it("accepts a complete non-negative integer cost table", () => {
    expect(aiToolCreditCostsSchema.safeParse(validCosts).success).toBe(true);
    expect(aiToolCreditCostsSchema.safeParse({ ...validCosts, chat: 0 }).success).toBe(true);
  });

  it("rejects incomplete tables so an unpriced AI tool cannot be enabled", () => {
    const incompleteCosts: Partial<typeof validCosts> = { ...validCosts };
    delete incompleteCosts.vision;
    expect(aiToolCreditCostsSchema.safeParse(incompleteCosts).success).toBe(false);
  });

  it("rejects negative, fractional, and excessive tool costs", () => {
    expect(aiToolCreditCostsSchema.safeParse({ ...validCosts, code: -1 }).success).toBe(false);
    expect(aiToolCreditCostsSchema.safeParse({ ...validCosts, image: 1.5 }).success).toBe(false);
    expect(aiToolCreditCostsSchema.safeParse({ ...validCosts, music: 10_001 }).success).toBe(false);
  });
});
