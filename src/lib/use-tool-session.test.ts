import { describe, expect, it } from "vitest";

import { parseToolSessionResponse } from "./use-tool-session";

describe("tool session response", () => {
  it("accepts identities issued by the session endpoint", () => {
    expect(parseToolSessionResponse({ authenticated: false, accountType: "ANONYMOUS", storageIdentity: "ANONYMOUS" }))
      .toEqual({ authenticated: false, accountType: "ANONYMOUS", storageIdentity: "ANONYMOUS" });
    expect(parseToolSessionResponse({ authenticated: true, accountType: "PERSONAL", storageIdentity: "PERSONAL" })?.storageIdentity).toBe("PERSONAL");
    expect(parseToolSessionResponse({ authenticated: true, accountType: "SCHOOL_SHARED", storageIdentity: "SCHOOL_SHARED" })?.storageIdentity).toBe("SCHOOL_SHARED");
    expect(parseToolSessionResponse({ authenticated: true, accountType: "ADMIN", storageIdentity: "ANONYMOUS" })?.storageIdentity).toBe("ANONYMOUS");
  });

  it("rejects contradictory or forged-looking combinations", () => {
    expect(parseToolSessionResponse({ authenticated: true, accountType: "ANONYMOUS", storageIdentity: "PERSONAL" })).toBeNull();
    expect(parseToolSessionResponse({ authenticated: true, accountType: "PERSONAL", storageIdentity: "SCHOOL_SHARED" })).toBeNull();
    expect(parseToolSessionResponse({ authenticated: false, accountType: "PERSONAL", storageIdentity: "PERSONAL" })).toBeNull();
    expect(parseToolSessionResponse({ authenticated: false, accountType: "root", storageIdentity: "PERSONAL" })).toBeNull();
  });
});
