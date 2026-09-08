import { describe, expect, it } from "vitest";

import { getBrowserToolStorage } from "./browser-tool-storage";
import { SCHOOL_STORAGE_TTL_MS, createMemoryStorage } from "./tool-storage";

describe("browser tool storage", () => {
  it("does not infer identity from a readable browser cookie", () => {
    const local = createMemoryStorage();
    const session = createMemoryStorage();
    const storage = getBrowserToolStorage("art", undefined, { localStorage: local, sessionStorage: session });

    storage.set("work", { id: "anonymous" });
    expect(storage.identity).toBe("ANONYMOUS");
    expect(storage.persistence).toBe("session");
    expect(local.length).toBe(0);
  });

  it("uses server-verified personal identity for an explicit local draft cache", () => {
    const local = createMemoryStorage();
    const session = createMemoryStorage();
    const storage = getBrowserToolStorage("music", "PERSONAL", { localStorage: local, sessionStorage: session });

    storage.set("draft", { title: "unfinished" });
    expect(storage.identity).toBe("PERSONAL");
    expect(storage.scope).toBe("DRAFT");
    expect(storage.cloudIsSourceOfTruth).toBe(true);
    expect(local.length).toBe(1);
    expect(session.length).toBe(0);
  });

  it("uses server-verified school identity and enforces the seven-day local boundary", () => {
    const local = createMemoryStorage();
    const session = createMemoryStorage();
    let now = 1_000;
    const storage = getBrowserToolStorage("reading", "SCHOOL_SHARED", { localStorage: local, sessionStorage: session, now: () => now });

    storage.set("analysis", { result: true });
    expect(storage.persistence).toBe("local");
    expect(session.length).toBe(0);
    now += SCHOOL_STORAGE_TTL_MS;
    expect(storage.get("analysis")).toBeNull();
  });
});
