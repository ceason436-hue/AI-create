"use client";

import { CLASSROOM_STORAGE_TTL_MS, createToolStorage, type ToolStorageIdentity } from "@/lib/tool-storage";

type BrowserStorageOverrides = {
  sessionStorage?: Storage;
  localStorage?: Storage;
  memoryStorage?: Storage;
  now?: () => number;
};

/**
 * Builds storage from a server-verified identity. Callers must obtain identity
 * from useToolSession(); readable cookies are intentionally never consulted.
 */
export function getBrowserToolStorage(
  namespace: string,
  identity: ToolStorageIdentity = "ANONYMOUS",
  overrides: BrowserStorageOverrides = {},
) {
  return createToolStorage({
    identity,
    namespace,
    scope: identity === "PERSONAL" ? "DRAFT" : "EPHEMERAL",
    ttlMs: identity === "SCHOOL_SHARED" ? CLASSROOM_STORAGE_TTL_MS : identity === "PERSONAL" ? 30 * 86_400_000 : 24 * 60 * 60 * 1_000,
    ...overrides,
  });
}
