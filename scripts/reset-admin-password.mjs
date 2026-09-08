import bcrypt from "bcryptjs";
import { PrismaClient, AccountType } from "@prisma/client";

const { hash } = bcrypt;
const confirmation = "RESET_ADMIN_PASSWORD";
const loginIdentifier = process.env.KRT_ADMIN_PASSWORD_RESET_LOGIN?.trim().toUpperCase();
const password = process.env.KRT_ADMIN_PASSWORD_RESET_VALUE;

if (process.env.KRT_ADMIN_PASSWORD_RESET_CONFIRMATION !== confirmation) {
  throw new Error("Set KRT_ADMIN_PASSWORD_RESET_CONFIRMATION=RESET_ADMIN_PASSWORD to run this command.");
}
if (!loginIdentifier || !/^[A-Z0-9_]{3,64}$/.test(loginIdentifier)) {
  throw new Error("KRT_ADMIN_PASSWORD_RESET_LOGIN must contain 3-64 uppercase letters, digits, or underscores.");
}
if (!password || password.length < 12) {
  throw new Error("KRT_ADMIN_PASSWORD_RESET_VALUE must be at least 12 characters.");
}

const db = new PrismaClient();

try {
  const account = await db.account.findFirst({
    where: { type: AccountType.ADMIN, loginIdentifier },
    include: { roles: { include: { role: true } } },
  });
  if (!account || !account.roles.some(({ role }) => role.key === "SUPER_ADMIN")) {
    throw new Error("The requested SUPER_ADMIN account does not exist.");
  }

  await db.$transaction(async (tx) => {
    await tx.account.update({ where: { id: account.id }, data: { passwordHash: await hash(password, 12) } });
    await tx.session.updateMany({ where: { accountId: account.id, revokedAt: null }, data: { revokedAt: new Date() } });
    await tx.auditLog.create({
      data: {
        actorId: account.id,
        action: "ADMIN_PASSWORD_RESET",
        targetType: "ACCOUNT",
        targetId: account.id,
        result: "SUCCEEDED",
      },
    });
  });
  console.log(`Reset SUPER_ADMIN password for ${loginIdentifier} and revoked existing sessions.`);
} finally {
  await db.$disconnect();
}
