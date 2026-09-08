import { compare, hash } from "bcryptjs";
import { randomInt } from "crypto";
import { AccountStatus, AccountType, OrganizationStatus, Prisma } from "@prisma/client";
import { AI_TOOLS, type AiTool } from "@/lib/ai-gateway";

const schoolAccountPattern = /^KRT(\d{2,})$/;

export function isAiTool(value: string): value is AiTool {
  return (AI_TOOLS as readonly string[]).includes(value);
}

export function parseSchoolStatus(value: string): OrganizationStatus {
  if (!Object.values(OrganizationStatus).includes(value as OrganizationStatus)) {
    throw new Error("INVALID_STATUS");
  }
  return value as OrganizationStatus;
}

export async function createUniqueSchoolPassword(tx: Prisma.TransactionClient) {
  const accounts = await tx.account.findMany({
    where: { type: AccountType.SCHOOL_SHARED },
    select: { passwordHash: true },
  });
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const password = String(randomInt(100_000, 1_000_000));
    const alreadyUsed = await Promise.all(accounts.map((account) => compare(password, account.passwordHash)));
    if (!alreadyUsed.some(Boolean)) return password;
  }
  throw new Error("PASSWORD_GENERATION_FAILED");
}

export async function nextSchoolLoginIdentifier(tx: Prisma.TransactionClient) {
  const accounts = await tx.account.findMany({
    where: { type: AccountType.SCHOOL_SHARED, loginIdentifier: { startsWith: "KRT" } },
    select: { loginIdentifier: true },
  });
  const largest = accounts.reduce((maximum, account) => {
    const match = schoolAccountPattern.exec(account.loginIdentifier);
    return match ? Math.max(maximum, Number(match[1])) : maximum;
  }, 0);
  const next = largest + 1;
  if (next > 99) throw new Error("SCHOOL_ACCOUNT_CAPACITY_REACHED");
  return `KRT${String(next).padStart(2, "0")}`;
}

export function accountStatusForOrganization(status: OrganizationStatus) {
  return status === OrganizationStatus.ACTIVE ? AccountStatus.ACTIVE : AccountStatus.SUSPENDED;
}

export async function passwordHash(password: string) {
  return hash(password, 12);
}
