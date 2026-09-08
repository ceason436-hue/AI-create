import { AccountStatus, AccountType, EntitlementSource, EntitlementStatus, WorkStatus } from "@prisma/client";
import { getCurrentAccount } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getPersonalWorkAccess() {
  const session = await getCurrentAccount();
  if (!session) throw new Error("UNAUTHENTICATED");
  if (session.type !== AccountType.PERSONAL || session.status !== AccountStatus.ACTIVE) throw new Error("FORBIDDEN");
  const entitlement = await db.entitlement.findFirst({
    where: {
      accountId: session.id,
      status: EntitlementStatus.ACTIVE,
      startsAt: { lte: new Date() },
      OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
    },
    include: { plan: true },
    orderBy: { startsAt: "desc" },
  });
  if (!entitlement?.plan) throw new Error("NO_STORAGE_ENTITLEMENT");
  return {
    accountId: session.id,
    storageLimitBytes: entitlement.plan.storageLimitBytes,
    isFreePlan: entitlement.source === EntitlementSource.FREE_PLAN,
  };
}

export async function usedStorageBytes(accountId: string) {
  const total = await db.work.aggregate({
    where: { ownerId: accountId, status: { in: [WorkStatus.ACTIVE, WorkStatus.READ_ONLY, WorkStatus.EXPIRING] } },
    _sum: { sizeBytes: true },
  });
  return total._sum.sizeBytes ?? BigInt(0);
}
