"use client";

import { useCallback, useEffect, useState } from "react";

import type { ToolStorageIdentity } from "@/lib/tool-storage";

export type ToolSessionAccountType = "ANONYMOUS" | "ADMIN" | "SCHOOL_SHARED" | "PERSONAL";

export type ToolSessionState = {
  accountType: ToolSessionAccountType;
  storageIdentity: ToolStorageIdentity;
  authenticated: boolean;
  loading: boolean;
  verified: boolean;
  error: string | null;
};

const initialState: ToolSessionState = {
  accountType: "ANONYMOUS",
  storageIdentity: "ANONYMOUS",
  authenticated: false,
  loading: true,
  verified: false,
  error: null,
};

function isAccountType(value: unknown): value is ToolSessionAccountType {
  return ["ANONYMOUS", "ADMIN", "SCHOOL_SHARED", "PERSONAL"].includes(String(value));
}

function isStorageIdentity(value: unknown): value is ToolStorageIdentity {
  return ["ANONYMOUS", "SCHOOL_SHARED", "PERSONAL"].includes(String(value));
}

export function parseToolSessionResponse(value: unknown): Omit<ToolSessionState, "loading" | "verified" | "error"> | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  if (!isAccountType(data.accountType) || !isStorageIdentity(data.storageIdentity) || typeof data.authenticated !== "boolean") return null;
  if (data.accountType === "ANONYMOUS" && data.authenticated) return null;
  if (data.accountType !== "ANONYMOUS" && !data.authenticated) return null;
  if (data.accountType === "PERSONAL" && data.storageIdentity !== "PERSONAL") return null;
  if (data.accountType === "SCHOOL_SHARED" && data.storageIdentity !== "SCHOOL_SHARED") return null;
  if ((data.accountType === "ADMIN" || data.accountType === "ANONYMOUS") && data.storageIdentity !== "ANONYMOUS") return null;
  return { accountType: data.accountType, storageIdentity: data.storageIdentity, authenticated: data.authenticated };
}

export function useToolSession() {
  const [state, setState] = useState<ToolSessionState>(initialState);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const response = await fetch("/api/auth/session", { cache: "no-store", credentials: "same-origin", signal });
      const parsed = response.ok ? parseToolSessionResponse(await response.json()) : null;
      if (!parsed) throw new Error("当前会话暂时无法验证。");
      setState({ ...parsed, loading: false, verified: true, error: null });
    } catch (error) {
      if (signal?.aborted) return;
      setState({ ...initialState, loading: false, error: error instanceof Error ? error.message : "当前会话暂时无法验证。" });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  return { ...state, refresh: () => refresh() };
}
