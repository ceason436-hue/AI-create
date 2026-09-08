import { hash } from "bcryptjs";
import { AccountSource, AccountStatus, AccountType } from "@prisma/client";
import { z } from "zod";
import { ADMIN_PERMISSION_KEYS, requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { internalError } from "@/lib/http";

const permissionSchema = z.enum(ADMIN_PERMISSION_KEYS);
const createSchema = z.object({
  loginIdentifier: z.string().trim().min(3).max(64).transform((value) => value.toUpperCase()).refine((value) => /^[A-Z0-9_]+$/.test(value)),
  password: z.string().min(12).max(128),
  displayName: z.string().trim().max(80).optional(),
  permissions: z.array(permissionSchema).max(ADMIN_PERMISSION_KEYS.length).default([]),
  superAdmin: z.boolean().default(false),
}).refine((value) => value.superAdmin || value.permissions.length > 0, { message: "Choose permissions" });

function accountView(account: {
  id: string;
  loginIdentifier: string;
  status: AccountStatus;
  createdAt: Date;
  lastLoginAt: Date | null;
  profile: { displayName: string | null } | null;
  roles: Array<{ role: { key: string } }>;
}) {
  return {
    id: account.id,
    loginIdentifier: account.loginIdentifier,
    displayName: account.profile?.displayName ?? "",
    status: account.status,
    createdAt: account.createdAt,
    lastLoginAt: account.lastLoginAt,
    roleKeys: account.roles.map(({ role }) => role.key),
  };
}

const include = { profile: true, roles: { include: { role: true } } } as const;

export async function GET() {
  try {
    await requireSuperAdmin();
    const admins = await db.account.findMany({
      where: { type: AccountType.ADMIN, status: { not: AccountStatus.DELETED } },
      include,
      orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    });
    return Response.json({ admins: admins.map(accountView), permissions: ADMIN_PERMISSION_KEYS });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") return Response.json({ error: "请先登录管理员账号。" }, { status: 401 });
    if (error instanceof Error && error.message === "FORBIDDEN") return Response.json({ error: "仅超级管理员可管理其他管理员。" }, { status: 403 });
    return internalError();
  }
}

export async function POST(request: Request) {
  let actor;
  try {
    actor = await requireSuperAdmin();
  } catch (error) {
    return Response.json({ error: error instanceof Error && error.message === "UNAUTHENTICATED" ? "请先登录管理员账号。" : "仅超级管理员可新增管理员。" }, { status: error instanceof Error && error.message === "UNAUTHENTICATED" ? 401 : 403 });
  }
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "请填写有效账号、12 位以上密码，并至少选择一项权限。" }, { status: 400 });
  try {
    const roleKeys = parsed.data.superAdmin ? ["SUPER_ADMIN"] : [...new Set(parsed.data.permissions)];
    const account = await db.$transaction(async (tx) => {
      const created = await tx.account.create({
        data: {
          type: AccountType.ADMIN,
          source: AccountSource.ADMIN_CREATED,
          loginIdentifier: parsed.data.loginIdentifier,
          passwordHash: await hash(parsed.data.password, 12),
          status: AccountStatus.ACTIVE,
          profile: parsed.data.displayName ? { create: { displayName: parsed.data.displayName } } : undefined,
        },
      });
      for (const key of roleKeys) {
        const role = await tx.role.upsert({ where: { key }, update: {}, create: { key, name: key === "SUPER_ADMIN" ? "超级管理员" : key } });
        await tx.accountRole.create({ data: { accountId: created.id, roleId: role.id } });
      }
      await tx.auditLog.create({ data: { actorId: actor.id, action: "ADMIN_CREATED", targetType: "ACCOUNT", targetId: created.id, result: "SUCCEEDED", after: { loginIdentifier: created.loginIdentifier, roleKeys } } });
      return tx.account.findUniqueOrThrow({ where: { id: created.id }, include });
    });
    return Response.json({ admin: accountView(account) }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) return Response.json({ error: "该管理员账号已存在。" }, { status: 409 });
    return internalError();
  }
}
