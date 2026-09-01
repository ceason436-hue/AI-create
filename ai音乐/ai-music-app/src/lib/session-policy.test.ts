import { describe, expect, it } from "vitest";
import { accountTypeCookieMaxAge, sessionDurationMs } from "./session-policy";

describe("session policy", () => {
  it("uses a short administrator session", () => {
    expect(sessionDurationMs("ADMIN")).toBe(8 * 60 * 60 * 1_000);
    expect(accountTypeCookieMaxAge("ADMIN")).toBe(8 * 60 * 60);
  });

  it("keeps shared classroom sessions within the 12-hour classroom boundary", () => {
    expect(sessionDurationMs("SCHOOL_SHARED")).toBe(12 * 60 * 60 * 1_000);
    expect(accountTypeCookieMaxAge("SCHOOL_SHARED")).toBe(12 * 60 * 60);
  });

  it("preserves the longer personal session", () => {
    expect(sessionDurationMs("PERSONAL")).toBe(30 * 24 * 60 * 60 * 1_000);
    expect(accountTypeCookieMaxAge("PERSONAL")).toBe(30 * 24 * 60 * 60);
  });
});
