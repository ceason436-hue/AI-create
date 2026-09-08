import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ transaction: vi.fn() }));

vi.mock("@/lib/admin-access", () => ({ requireAdminResponse: vi.fn(async () => ({ account: { id: "admin-1" } })) }));
vi.mock("@/lib/db", () => ({ db: { $transaction: mocks.transaction } }));

import { POST } from "./route";

describe("POST /api/admin/courses", () => {
  beforeEach(() => mocks.transaction.mockReset());

  it("rejects a slug reserved by an editorial course direction before writing", async () => {
    const response = await POST(new Request("http://localhost/api/admin/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId: "category-1", name: "冲突课程", slug: "programming", shortDescription: "不应覆盖编程方向页" }),
    }));

    expect(response).toBeDefined();
    if (!response) throw new Error("expected a response");
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "该 slug 已由公开课程方向页保留，请更换课程 slug。" });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
