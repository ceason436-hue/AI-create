import { hash } from "bcryptjs";
import { AccountStatus, AccountType } from "@prisma/client";
import { z } from "zod";
import { ADMIN_PERMISSION_KEYS, requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { internalError } from "@/lib/http";

const schema = z.object({
  displayName: z.string().trim().max(80).optional(),
  status: z.enum([AccountStatus.ACTIVE, AccountStatus.SUSPENDED]).optional(),
  password: z.string().min(12).max(128).optional(),
  permissions: z.array(z.enum(ADMIN_PERMISSION_KEYS)).max(ADMIN_PERMISSION_KEYS.length).optional(),
  superAdmin: z.boolean().optional(),
}).refine((value) => value.superAdmin !== false || (value.permissions?.length ?? 0) > 0, { message: "Choose permissions" });

export async function PATCH(request: Request, { params }: { params: Promise<{ accountId: string }> }) {
  let actor;
  try {
    actor = await requireSuperAdmin();
  } catch (error) {
    return Response.json({ error: error instanceof Error && error.message === "UNAUTHENTICATED" ? "请先登录管理员账号。" : "仅超级管理员可修改管理员。" }, { status: error instanceof Error && error.message === "UNAUTHENTICATED" ? 401 : 403 });
  }
  const input = schema.safeParse(await request.json().catch(() => null));
  if (!input.success) return Response.json({ error: "管理员设置无效；普通管理员至少需要一项权限。" }, { status: 400 });
  const { accountId } = await params;
  try {
    const current = await db.account.findFirst({ where: { id: accountId, type: AccountType.ADMIN }, include: { roles: { include: { role: true } } } });
    if (!current) return Response.json({ error: "管理员不存在。" }, { status: 404 });
    const removingOwnAccess = actor.id === accountId && (input.data.status === AccountStatus.SUSPENDED || input.data.superAdmin === false);
    if (removingOwnAccess) return Response.json({ error: "不能停用当前账号或移除自己的超级管理员权限。" }, { status: 409 });
    const changingRoles = input.data.superAdmin !== undefined || input.data.permissions !== undefined;
    const nextRoleKeys = input.data.superAdmin ? ["SUPER_ADMIN"] : [...new Set(input.data.permissions ?? [])];
    const updated = await db.$transaction(async (tx) => {
      await tx.account.update({ where: { id: accountId }, data: {
        ...(input.data.status ? { status: input.data.status } : {}),
        ...(input.data.password ? { passwordHash: await hash(input.data.password, 12) } : {}),
        profile: { upsert: { create: { displayName: input.data.displayName || null }, update: { displayName: input.data.displayName || null } } },
      } });
      if (changingRoles) {
        const adminRoles = await tx.role.findMany({ where: { OR: [{ key: "SUPER_ADMIN" }, { key: { in: [...ADMIN_PERMISSION_KEYS] } }] }, select: { id: true } });
        await tx.accountRole.deleteMany({ where: { accountId, roleId: { in: adminRoles.map((role) => role.id) } } });
        for (const key of nextRoleKeys) {
          const role = await tx.role.upsert({ where: { key }, update: {}, create: { key, name: key === "SUPER_ADMIN" ? "超级管理员" : key } });
          await tx.accountRole.create({ data: { accountId, roleId: role.id } });
        }
      }
      if (input.data.password || input.data.status === AccountStatus.SUSPENDED) await tx.session.updateMany({ where: { accountId, revokedAt: null }, data: { revokedAt: new Date() } });
      await tx.auditLog.create({ data: { actorId: actor.id, action: "ADMIN_UPDATED", targetType: "ACCOUNT", targetId: accountId, result: "SUCCEEDED", after: { status: input.data.status, roleKeys: changingRoles ? nextRoleKeys : undefined, passwordChanged: Boolean(input.data.password) } } });
      return tx.account.findUniqueOrThrow({ where: { id: accountId }, include: { profile: true, roles: { include: { role: true } } } });
    });
    return Response.json({ admin: { id: updated.id, loginIdentifier: updated.loginIdentifier, displayName: updated.profile?.displayName ?? "", status: updated.status, createdAt: updated.createdAt, lastLoginAt: updated.lastLoginAt, roleKeys: updated.roles.map(({ role }) => role.key) } });
  } catch {
    return internalError();
  }
}
