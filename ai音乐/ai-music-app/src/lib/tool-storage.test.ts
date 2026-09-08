import { describe, expect, it } from "vitest";

import { SCHOOL_STORAGE_TTL_MS, createMemoryStorage, createToolStorage } from "./tool-storage";

function keys(storage: Storage) {
  return Array.from({ length: storage.length }, (_, index) => storage.key(index));
}

describe("tool storage", () => {
  it("is SSR-safe and keeps anonymous data in memory when session storage is unavailable", () => {
    const local = createMemoryStorage();
    const adapter = createToolStorage({
      identity: "ANONYMOUS",
      namespace: "art",
      scope: "EPHEMERAL",
      ttlMs: 1_000,
      localStorage: local,
    });

    adapter.set("current", { prompt: "test" });
    expect(adapter.persistence).toBe("memory");
    expect(adapter.cloudIsSourceOfTruth).toBe(false);
    expect(adapter.get("current")).toEqual({ prompt: "test" });
    expect(local.length).toBe(0);
  });

  it("keeps school work in browser-local storage and expires it after seven days", () => {
    const session = createMemoryStorage();
    const local = createMemoryStorage();
    let time = 10_000;
    const adapter = createToolStorage({
      identity: "SCHOOL_SHARED",
      namespace: "music",
      scope: "EPHEMERAL",
      ttlMs: SCHOOL_STORAGE_TTL_MS * 2,
      sessionStorage: session,
      localStorage: local,
      now: () => time,
    });

    adapter.set("track", { id: "classroom-track" });
    expect(adapter.persistence).toBe("local");
    expect(session.length).toBe(0);
    expect(adapter.get("track")).toEqual({ id: "classroom-track" });

    time += SCHOOL_STORAGE_TTL_MS;
    expect(adapter.get("track")).toBeNull();
    expect(local.length).toBe(0);
    expect(session.length).toBe(0);
  });

  it("keeps personal drafts explicit and separate from ephemeral session state", () => {
    const session = createMemoryStorage();
    const local = createMemoryStorage();
    const common = { identity: "PERSONAL" as const, namespace: "code", ttlMs: 5_000, sessionStorage: session, localStorage: local };
    const draft = createToolStorage({ ...common, scope: "DRAFT" });
    const ephemeral = createToolStorage({ ...common, scope: "EPHEMERAL" });

    draft.set("editor", "cloud remains the source of truth");
    ephemeral.set("editor", "temporary preview");

    expect(draft.persistence).toBe("local");
    expect(ephemeral.persistence).toBe("session");
    expect(draft.cloudIsSourceOfTruth).toBe(true);
    expect(draft.get("editor")).toBe("cloud remains the source of truth");
    expect(ephemeral.get("editor")).toBe("temporary preview");
    expect(local.length).toBe(1);
    expect(session.length).toBe(1);
  });

  it("rejects persistent draft scope for anonymous and school identities", () => {
    for (const identity of ["ANONYMOUS", "SCHOOL_SHARED"] as const) {
      expect(() => createToolStorage({ identity, namespace: "reading", scope: "DRAFT", ttlMs: 1_000 }))
        .toThrow(/cannot use a persistent draft cache/);
    }
  });

  it("namespaces clear and remove without touching other tools or unrelated storage", () => {
    const session = createMemoryStorage();
    session.setItem("unrelated", "keep");
    const art = createToolStorage({ identity: "SCHOOL_SHARED", namespace: "art", scope: "EPHEMERAL", ttlMs: 1_000, sessionStorage: session });
    const music = createToolStorage({ identity: "SCHOOL_SHARED", namespace: "music", scope: "EPHEMERAL", ttlMs: 1_000, sessionStorage: session });
    art.set("one", 1);
    art.set("two", 2);
    music.set("one", 3);

    art.remove("one");
    expect(art.get("one")).toBeNull();
    expect(art.get("two")).toBe(2);
    art.clear();

    expect(art.get("two")).toBeNull();
    expect(music.get("one")).toBe(3);
    expect(session.getItem("unrelated")).toBe("keep");
  });

  it("migrates across storage only after a successful target write", () => {
    const legacy = createMemoryStorage();
    const session = createMemoryStorage();
    legacy.setItem("old-art", JSON.stringify({ id: "legacy" }));
    const adapter = createToolStorage({ identity: "SCHOOL_SHARED", namespace: "art", scope: "EPHEMERAL", ttlMs: 1_000, sessionStorage: session });

    expect(adapter.migrate({ source: legacy, sourceKey: "old-art", targetKey: "current" })).toBe("migrated");
    expect(legacy.getItem("old-art")).toBeNull();
    expect(adapter.get("current")).toEqual({ id: "legacy" });

    const failingTarget: Storage = {
      length: 0,
      clear() {},
      getItem() { return null; },
      key() { return null; },
      removeItem() {},
      setItem() { throw new Error("quota"); },
    };
    legacy.setItem("retry-me", JSON.stringify({ id: "retry" }));
    const failingAdapter = createToolStorage({ identity: "SCHOOL_SHARED", namespace: "art", scope: "EPHEMERAL", ttlMs: 1_000, sessionStorage: failingTarget });
    expect(failingAdapter.migrate({ source: legacy, sourceKey: "retry-me", targetKey: "retry" })).toBe("failed");
    expect(legacy.getItem("retry-me")).not.toBeNull();
    expect(keys(legacy)).toContain("retry-me");
  });
});
