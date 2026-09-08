import { createHash, randomBytes } from "crypto";
import { cookies, headers } from "next/headers";
import { AccountStatus, AccountType } from "@prisma/client";
import { db } from "@/lib/db";
import { sessionDurationMs } from "@/lib/session-policy";
import { isTemporaryDeployment, TEMPORARY_SCHOOL_ACCOUNT, TEMPORARY_SESSION_VALUE } from "@/lib/temporary-deployment";

const COOKIE_NAME = "krt_session";

export type AuthAccount = {
  id: string;
  type: AccountType;
  status: AccountStatus;
  loginIdentifier: string;
  roleKeys: string[];
};

export const ADMIN_PERMISSION_KEYS = [
  "ADMIN_USERS",
  "ADMIN_COURSES",
  "ADMIN_CONTENT",
  "ADMIN_AI",
  "ADMIN_INQUIRIES",
] as const;
export type AdminPermission = (typeof ADMIN_PERMISSION_KEYS)[number];

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function secureCookie() {
  return process.env.NODE_ENV === "production" && process.env.KRT_TEMPORARY_ALLOW_INSECURE_HTTP !== "true";
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

export async function createTemporarySchoolSession() {
  const store = await cookies();
  store.set(COOKIE_NAME, TEMPORARY_SESSION_VALUE, {
    httpOnly: true,
    secure: secureCookie(),
    sameSite: "lax",
    path: "/",
    maxAge: 12 * 60 * 60,
  });
}

export async function getCurrentAccount(): Promise<AuthAccount | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  if (isTemporaryDeployment()) {
    if (token !== TEMPORARY_SESSION_VALUE) return null;
    return {
      id: TEMPORARY_SCHOOL_ACCOUNT.id,
      type: AccountType.SCHOOL_SHARED,
      status: AccountStatus.ACTIVE,
      loginIdentifier: TEMPORARY_SCHOOL_ACCOUNT.loginIdentifier,
      roleKeys: [],
    };
  }

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
  if (token && !isTemporaryDeployment()) {
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
  return account.type === AccountType.ADMIN && (
    hasRole(account, "SUPER_ADMIN") ||
    ADMIN_PERMISSION_KEYS.some((permission) => hasRole(account, permission))
  );
}

export function hasAdminPermission(account: AuthAccount, permission: AdminPermission) {
  return account.type === AccountType.ADMIN && (
    hasRole(account, "SUPER_ADMIN") || hasRole(account, permission)
  );
}

export async function requireAdminPermission(permission: AdminPermission) {
  const account = await requireAccount();
  if (!hasAdminPermission(account, permission)) throw new Error("FORBIDDEN");
  return account;
}

export async function requireSuperAdmin() {
  const account = await requireAccount();
  if (!isAdmin(account)) throw new Error("FORBIDDEN");
  return account;
}
