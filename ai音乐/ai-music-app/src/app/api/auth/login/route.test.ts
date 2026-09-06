import { AccountType } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { loginInputSchema, loginModeAllowsAccount } from "@/lib/login-mode";

describe("login mode contract", () => {
  it.each([
    ["school", AccountType.SCHOOL_SHARED, [], true],
    ["school", AccountType.PERSONAL, [], false],
    ["school", AccountType.ADMIN, ["SUPER_ADMIN"], false],
    ["personal", AccountType.PERSONAL, [], true],
    ["personal", AccountType.SCHOOL_SHARED, [], false],
    ["personal", AccountType.ADMIN, ["SUPER_ADMIN"], false],
    ["admin", AccountType.ADMIN, ["SUPER_ADMIN"], true],
    ["admin", AccountType.ADMIN, [], false],
    ["admin", AccountType.PERSONAL, ["SUPER_ADMIN"], false],
  ] as const)("maps %s to the expected account and role", (mode, type, roleKeys, allowed) => {
    expect(loginModeAllowsAccount(mode, { type, roleKeys })).toBe(allowed);
  });

  it("requires a stable, recognized mode", () => {
    expect(loginInputSchema.safeParse({ mode: "school", loginIdentifier: "KRT01", password: "123456" }).success).toBe(true);
    expect(loginInputSchema.safeParse({ loginIdentifier: "KRT01", password: "123456" }).success).toBe(false);
    expect(loginInputSchema.safeParse({ mode: "teacher", loginIdentifier: "KRT01", password: "123456" }).success).toBe(false);
  });
});
