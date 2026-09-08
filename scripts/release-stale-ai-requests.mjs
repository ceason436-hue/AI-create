import { PrismaClient, RequestStatus, UsageStatus } from "@prisma/client";

const timeoutMinutes = Number(process.env.KRT_AI_REQUEST_TIMEOUT_MINUTES ?? 15);
const batchSize = Number(process.env.KRT_AI_REQUEST_RECOVERY_BATCH_SIZE ?? 100);

if (!Number.isInteger(timeoutMinutes) || timeoutMinutes < 5 || timeoutMinutes > 1_440) {
  throw new Error("KRT_AI_REQUEST_TIMEOUT_MINUTES must be an integer from 5 to 1440.");
}
if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 1_000) {
  throw new Error("KRT_AI_REQUEST_RECOVERY_BATCH_SIZE must be an integer from 1 to 1000.");
}

const db = new PrismaClient();
const cutoff = new Date(Date.now() - timeoutMinutes * 60_000);
const activeStatuses = [RequestStatus.PENDING, RequestStatus.QUEUED, RequestStatus.RUNNING, RequestStatus.PROVIDER_PENDING, RequestStatus.RESULT_READY, RequestStatus.PERSISTING, RequestStatus.RETRY_WAIT, RequestStatus.RECONCILING, RequestStatus.CANCEL_REQUESTED];

try {
  const candidates = await db.aiRequest.findMany({
    where: { status: { in: activeStatuses }, updatedAt: { lt: cutoff } },
    select: { requestId: true, accountId: true, tool: true, reservedCredits: true },
    orderBy: { updatedAt: "asc" },
    take: batchSize,
  });

  let released = 0;
  for (const candidate of candidates) {
    const result = await db.$transaction(async (tx) => {
      const updated = await tx.aiRequest.updateMany({
        where: { requestId: candidate.requestId, status: { in: activeStatuses }, updatedAt: { lt: cutoff } },
        data: { status: RequestStatus.RELEASED, errorCode: "PROVIDER_TIMEOUT", finishedAt: new Date() },
      });
      if (updated.count !== 1) return false;
      await tx.aiJob.updateMany({ where: { requestId: candidate.requestId, status: { in: activeStatuses } }, data: { status: RequestStatus.RELEASED, errorCode: "PROVIDER_TIMEOUT", leaseToken: null, leaseExpiresAt: null } });

      if (candidate.reservedCredits > 0) {
        await tx.creditWallet.update({
          where: { accountId: candidate.accountId },
          data: {
            balance: { increment: candidate.reservedCredits },
            reservedBalance: { decrement: candidate.reservedCredits },
          },
        });
        await tx.creditLedger.updateMany({ where: { accountId: candidate.accountId, referenceType: "AI_REQUEST", referenceId: candidate.requestId, reason: "AI_RESERVED" }, data: { reason: "AI_RELEASED", delta: 0 } });
      }
      await tx.usageEvent.create({
        data: {
          accountId: candidate.accountId,
          tool: candidate.tool,
          status: UsageStatus.RELEASED,
          units: candidate.reservedCredits,
          requestId: candidate.requestId,
        },
      });
      return true;
    });
    if (result) released += 1;
  }
  console.log(`Released ${released} stale AI request(s) older than ${timeoutMinutes} minute(s).`);
} finally {
  await db.$disconnect();
}
