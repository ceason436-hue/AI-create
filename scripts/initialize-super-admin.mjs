import bcrypt from "bcryptjs";
import { PrismaClient, AccountSource, AccountStatus, AccountType } from "@prisma/client";

const { hash } = bcrypt;

const confirmation = "INITIALIZE_SUPER_ADMIN";
const loginIdentifier = process.env.KRT_BOOTSTRAP_ADMIN_LOGIN?.trim().toUpperCase();
const password = process.env.KRT_BOOTSTRAP_ADMIN_PASSWORD;

if (process.env.KRT_BOOTSTRAP_ADMIN_CONFIRMATION !== confirmation) {
  throw new Error("Set KRT_BOOTSTRAP_ADMIN_CONFIRMATION=INITIALIZE_SUPER_ADMIN to run this command.");
}
if (!loginIdentifier || !/^[A-Z0-9_]{3,64}$/.test(loginIdentifier)) {
  throw new Error("KRT_BOOTSTRAP_ADMIN_LOGIN must contain 3-64 uppercase letters, digits, or underscores.");
}
if (!password || password.length < 12) {
  throw new Error("KRT_BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters.");
}

const db = new PrismaClient();

try {
  const role = await db.role.upsert({
    where: { key: "SUPER_ADMIN" },
    update: { name: "超级管理员" },
    create: { key: "SUPER_ADMIN", name: "超级管理员" },
  });
  const existing = await db.account.findUnique({ where: { loginIdentifier } });
  if (existing && existing.type !== AccountType.ADMIN) {
    throw new Error("The requested login identifier already belongs to a non-admin account.");
  }
  const account = await db.$transaction(async (tx) => {
    const saved = existing
      ? await tx.account.update({
          where: { id: existing.id },
          data: { passwordHash: await hash(password, 12), status: AccountStatus.ACTIVE },
        })
      : await tx.account.create({
          data: {
            type: AccountType.ADMIN,
            source: AccountSource.ADMIN_CREATED,
            loginIdentifier,
            passwordHash: await hash(password, 12),
            status: AccountStatus.ACTIVE,
          },
        });
    await tx.accountRole.upsert({
      where: { accountId_roleId: { accountId: saved.id, roleId: role.id } },
      update: {},
      create: { accountId: saved.id, roleId: role.id },
    });
    await tx.session.updateMany({ where: { accountId: saved.id, revokedAt: null }, data: { revokedAt: new Date() } });
    await tx.auditLog.create({
      data: {
        actorId: saved.id,
        action: existing ? "ADMIN_REACTIVATED" : "ADMIN_BOOTSTRAPPED",
        targetType: "ACCOUNT",
        targetId: saved.id,
        result: "SUCCEEDED",
        after: { loginIdentifier, status: AccountStatus.ACTIVE, role: "SUPER_ADMIN" },
      },
    });
    return saved;
  });
  console.log(`${existing ? "Reactivated" : "Created"} permanent SUPER_ADMIN ${loginIdentifier}. Store the password securely and remove bootstrap variables.`);
} finally {
  await db.$disconnect();
}
