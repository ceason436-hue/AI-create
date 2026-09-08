-- AI request idempotency, durable jobs, settlement guards and work lineage.
ALTER TABLE "AiRequest"
  ADD COLUMN "contractVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "inputHash" VARCHAR(64) NOT NULL DEFAULT '',
  ADD COLUMN "resultRef" JSONB,
  ADD COLUMN "errorCode" VARCHAR(64),
  ADD COLUMN "startedAt" TIMESTAMP(3),
  ADD COLUMN "finishedAt" TIMESTAMP(3);
ALTER TABLE "AiRequest" ALTER COLUMN "inputHash" DROP DEFAULT;

ALTER TABLE "Work" ADD COLUMN "sourceRequestId" VARCHAR(128);

CREATE TABLE "AiJob" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "attempt" INTEGER NOT NULL DEFAULT 1,
  "status" "RequestStatus" NOT NULL DEFAULT 'QUEUED',
  "provider" VARCHAR(64),
  "providerTaskId" VARCHAR(256),
  "leaseToken" VARCHAR(128),
  "leaseExpiresAt" TIMESTAMP(3),
  "sanitizedResult" JSONB,
  "errorCode" VARCHAR(64),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Work_sourceRequestId_key" ON "Work"("sourceRequestId");
CREATE UNIQUE INDEX "AiJob_requestId_attempt_key" ON "AiJob"("requestId", "attempt");
CREATE INDEX "AiJob_status_leaseExpiresAt_idx" ON "AiJob"("status", "leaseExpiresAt");
CREATE INDEX "AiJob_provider_providerTaskId_idx" ON "AiJob"("provider", "providerTaskId");
CREATE INDEX "AiRequest_status_updatedAt_idx" ON "AiRequest"("status", "updatedAt");
CREATE UNIQUE INDEX "CreditLedger_accountId_referenceType_referenceId_key" ON "CreditLedger"("accountId", "referenceType", "referenceId");
CREATE UNIQUE INDEX "UsageEvent_accountId_requestId_key" ON "UsageEvent"("accountId", "requestId");

ALTER TABLE "AiJob" ADD CONSTRAINT "AiJob_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "AiRequest"("requestId") ON DELETE CASCADE ON UPDATE CASCADE;
