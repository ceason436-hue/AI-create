import { createHash, randomBytes } from "crypto";
import { cookies, headers } from "next/headers";
import { AccountStatus, AccountType } from "@prisma/client";
import { db } from "@/lib/db";
import { sessionDurationMs } from "@/lib/session-policy";

const COOKIE_NAME = "krt_session";

export type AuthAccount = {
  id: string;
  type: AccountType;
  status: AccountStatus;
  loginIdentifier: string;
  roleKeys: string[];
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function secureCookie() {
  return process.env.NODE_ENV === "production";
}

export async function createSession(account: Pick<AuthAccount, "id" | "type">) {
  const token = randomBytes(32).toString("base64url");
  const durationMs = sessionDurationMs(account.type);
  const expiresAt = new Date(Date.now() + durationMs);
  const requestHeaders = await headers();

  await db.session.create({
    data: {
      accountId: account.id,
      tokenHash: hashToken(token),
      expiresAt,
      deviceSummary: requestHeaders.get("user-agent")?.slice(0, 300),
    },
  });

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: secureCookie(),
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getCurrentAccount(): Promise<AuthAccount | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await db.session.findFirst({
    where: {
      tokenHash: hashToken(token),
      revokedAt: null,
      expiresAt: { gt: new Date() },
      account: { status: AccountStatus.ACTIVE },
    },
    include: { account: { include: { roles: { include: { role: true } } } } },
  });

  return session
    ? {
        id: session.account.id,
        type: session.account.type,
        status: session.account.status,
        loginIdentifier: session.account.loginIdentifier,
        roleKeys: session.account.roles.map(({ role }) => role.key),
      }
    : null;
}

export async function requireAccount() {
  const account = await getCurrentAccount();
  if (!account) throw new Error("UNAUTHENTICATED");
  return account;
}

export async function requireRole(roleKey: string) {
  const account = await requireAccount();
  if (!hasRole(account, roleKey)) throw new Error("FORBIDDEN");
  return account;
}

export async function revokeCurrentSession() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (token) {
    await db.session.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  (await cookies()).delete(COOKIE_NAME);
}

export function hasRole(account: AuthAccount, roleKey: string) {
  return account.roleKeys.includes(roleKey);
}

export function isAdmin(account: AuthAccount) {
  return account.type === AccountType.ADMIN && hasRole(account, "SUPER_ADMIN");
}

export async function requireSuperAdmin() {
  const account = await requireAccount();
  if (!isAdmin(account)) throw new Error("FORBIDDEN");
  return account;
}
