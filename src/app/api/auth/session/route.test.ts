import { AccountStatus, AccountType } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentAccount } from "@/lib/auth";
import { GET } from "./route";

vi.mock("@/lib/auth", () => ({ getCurrentAccount: vi.fn() }));

describe("GET /api/auth/session", () => {
  beforeEach(() => vi.resetAllMocks());

  it("reports an unauthenticated request as anonymous without trusting client state", async () => {
    vi.mocked(getCurrentAccount).mockResolvedValue(null);
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(await response.json()).toEqual({ account: null, authenticated: false, accountType: "ANONYMOUS", storageIdentity: "ANONYMOUS" });
  });

  it("derives personal storage identity from the authenticated server session", async () => {
    const account = { id: "account-1", type: AccountType.PERSONAL, status: AccountStatus.ACTIVE, loginIdentifier: "fixture-user", roleKeys: [] };
    vi.mocked(getCurrentAccount).mockResolvedValue(account);
    const response = await GET();

    expect(await response.json()).toEqual({ account, authenticated: true, accountType: "PERSONAL", storageIdentity: "PERSONAL" });
  });

  it("does not downgrade a session verification failure to anonymous", async () => {
    vi.mocked(getCurrentAccount).mockRejectedValue(new Error("database unavailable"));
    const response = await GET();

    expect(response.status).toBe(503);
  });
});
