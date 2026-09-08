import { AccountType } from "@prisma/client";

export function activeEnrollmentWhere(accountId: string, asOf = new Date()) {
  return { accountId, status: "ACTIVE", startsAt: { lte: asOf }, OR: [{ endsAt: null }, { endsAt: { gt: asOf } }] };
}

export function canUseLearningCenter(type: AccountType) {
  return type === AccountType.PERSONAL;
}
