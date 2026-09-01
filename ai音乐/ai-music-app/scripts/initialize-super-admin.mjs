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
  const existingAdmin = await db.account.findFirst({ where: { type: AccountType.ADMIN } });
  if (existingAdmin) {
    throw new Error("An administrator already exists. Refusing to create another bootstrap administrator.");
  }

  const role = await db.role.upsert({
    where: { key: "SUPER_ADMIN" },
    update: { name: "超级管理员" },
    create: { key: "SUPER_ADMIN", name: "超级管理员" },
  });
  const account = await db.account.create({
    data: {
      type: AccountType.ADMIN,
      source: AccountSource.ADMIN_CREATED,
      loginIdentifier,
      passwordHash: await hash(password, 12),
      status: AccountStatus.ACTIVE,
      roles: { create: { roleId: role.id } },
    },
  });
  await db.auditLog.create({
    data: {
      actorId: account.id,
      action: "ADMIN_BOOTSTRAPPED",
      targetType: "ACCOUNT",
      targetId: account.id,
      result: "SUCCEEDED",
      after: { loginIdentifier },
    },
  });
  console.log(`Created SUPER_ADMIN ${loginIdentifier}. Store the password securely and remove bootstrap variables.`);
} finally {
  await db.$disconnect();
}
