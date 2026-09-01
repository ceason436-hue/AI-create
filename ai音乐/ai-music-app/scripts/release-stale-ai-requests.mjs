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

try {
  const candidates = await db.aiRequest.findMany({
    where: { status: RequestStatus.RUNNING, updatedAt: { lt: cutoff } },
    select: { requestId: true, accountId: true, tool: true, reservedCredits: true },
    orderBy: { updatedAt: "asc" },
    take: batchSize,
  });

  let released = 0;
  for (const candidate of candidates) {
    const result = await db.$transaction(async (tx) => {
      const updated = await tx.aiRequest.updateMany({
        where: { requestId: candidate.requestId, status: RequestStatus.RUNNING, updatedAt: { lt: cutoff } },
        data: { status: RequestStatus.RELEASED },
      });
      if (updated.count !== 1) return false;

      if (candidate.reservedCredits > 0) {
        await tx.creditWallet.update({
          where: { accountId: candidate.accountId },
          data: {
            balance: { increment: candidate.reservedCredits },
            reservedBalance: { decrement: candidate.reservedCredits },
          },
        });
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
