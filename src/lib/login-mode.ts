import { AccountType } from "@prisma/client";
import { z } from "zod";

export const loginModeSchema = z.enum(["school", "personal", "admin"]);
export type LoginMode = z.infer<typeof loginModeSchema>;

export function loginModeAllowsAccount(
  mode: LoginMode,
  account: { type: AccountType; roleKeys: readonly string[] },
) {
  if (mode === "school") return account.type === AccountType.SCHOOL_SHARED;
  if (mode === "personal") return account.type === AccountType.PERSONAL;
  return account.type === AccountType.ADMIN && account.roleKeys.some((role) =>
    role === "SUPER_ADMIN" || role.startsWith("ADMIN_"),
  );
}

export const loginInputSchema = z.object({
  mode: loginModeSchema,
  loginIdentifier: z.string().trim().min(3).max(64).transform((value) => value.toUpperCase()),
  password: z.string().min(6).max(128),
});
