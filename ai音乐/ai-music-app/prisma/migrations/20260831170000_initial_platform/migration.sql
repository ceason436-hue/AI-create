-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ADMIN', 'SCHOOL_SHARED', 'PERSONAL');

-- CreateEnum
CREATE TYPE "AccountSource" AS ENUM ('TRAINING_INVITE', 'PUBLIC_SIGNUP', 'ADMIN_CREATED', 'SCHOOL_SETUP');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'LOCKED', 'DELETED');

-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('SCHOOL', 'TRAINING');

-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'EXHAUSTED', 'REVOKED');

-- CreateEnum
CREATE TYPE "EntitlementSource" AS ENUM ('SCHOOL_CONTRACT', 'TRAINING_INVITE', 'FREE_PLAN', 'PAID_PLAN', 'CREDIT_PACK', 'ADMIN_GRANT');

-- CreateEnum
CREATE TYPE "EntitlementStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "WorkType" AS ENUM ('IMAGE', 'MUSIC', 'CODE', 'READING', 'VISUAL_REVIEW');

-- CreateEnum
CREATE TYPE "WorkStatus" AS ENUM ('ACTIVE', 'READ_ONLY', 'EXPIRING', 'DELETING', 'DELETED', 'FAILED');

-- CreateEnum
CREATE TYPE "OrderChannel" AS ENUM ('MANUAL', 'WECHAT', 'ALIPAY');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'PENDING', 'PAID', 'CANCELLED', 'REFUNDED', 'FAILED');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'RELEASED', 'REJECTED');

-- CreateEnum
CREATE TYPE "UsageStatus" AS ENUM ('RESERVED', 'SUCCEEDED', 'FAILED', 'RELEASED');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "source" "AccountSource" NOT NULL,
    "loginIdentifier" VARCHAR(64) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'PENDING',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalProfile" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "displayName" VARCHAR(80),
    "mobile" VARCHAR(32),
    "mobileVerifiedAt" TIMESTAMP(3),

    CONSTRAINT "PersonalProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "key" VARCHAR(64) NOT NULL,
    "name" VARCHAR(80) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountRole" (
    "accountId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "AccountRole_pkey" PRIMARY KEY ("accountId","roleId")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "type" "OrganizationType" NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationAccount" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "allowedTools" TEXT[],

    CONSTRAINT "OrganizationAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cohort" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),

    CONSTRAINT "Cohort_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CohortMember" (
    "cohortId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CohortMember_pkey" PRIMARY KEY ("cohortId","accountId")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "version" INTEGER NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "storageLimitBytes" BIGINT NOT NULL,
    "monthlyCredits" INTEGER NOT NULL DEFAULT 0,
    "allowedTools" TEXT[],
    "status" VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvitationCode" (
    "id" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "planId" TEXT,
    "status" "InvitationStatus" NOT NULL DEFAULT 'DRAFT',
    "maxUses" INTEGER NOT NULL,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "validFrom" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "entitlementDays" INTEGER,
    "createdById" TEXT,

    CONSTRAINT "InvitationCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvitationRedemption" (
    "invitationId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvitationRedemption_pkey" PRIMARY KEY ("invitationId","accountId")
);

-- CreateTable
CREATE TABLE "Entitlement" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "source" "EntitlementSource" NOT NULL,
    "status" "EntitlementStatus" NOT NULL DEFAULT 'ACTIVE',
    "planId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "Entitlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditWallet" (
    "accountId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "reservedBalance" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CreditWallet_pkey" PRIMARY KEY ("accountId")
);

-- CreateTable
CREATE TABLE "CreditLedger" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" VARCHAR(64) NOT NULL,
    "referenceType" VARCHAR(64),
    "referenceId" VARCHAR(128),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Work" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "type" "WorkType" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "status" "WorkStatus" NOT NULL DEFAULT 'ACTIVE',
    "sizeBytes" BIGINT NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Work_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkAsset" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "objectKey" VARCHAR(512) NOT NULL,
    "mimeType" VARCHAR(128) NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "checksum" VARCHAR(128),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "planId" TEXT,
    "channel" "OrderChannel" NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "amountCents" INTEGER NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "operatorNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "providerTradeNo" TEXT,
    "status" VARCHAR(32) NOT NULL,
    "rawEventRef" VARCHAR(256),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiRequest" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "tool" VARCHAR(64) NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "reservedCredits" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageEvent" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "tool" VARCHAR(64) NOT NULL,
    "status" "UsageStatus" NOT NULL,
    "units" INTEGER NOT NULL DEFAULT 0,
    "estimatedCost" DECIMAL(12,6),
    "requestId" VARCHAR(128),
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "deviceSummary" VARCHAR(300),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" VARCHAR(128) NOT NULL,
    "targetType" VARCHAR(64) NOT NULL,
    "targetId" VARCHAR(128),
    "result" VARCHAR(32) NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" VARCHAR(128) NOT NULL,
    "value" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "RetentionJob" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,

    CONSTRAINT "RetentionJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_loginIdentifier_key" ON "Account"("loginIdentifier");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalProfile_accountId_key" ON "PersonalProfile"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalProfile_mobile_key" ON "PersonalProfile"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "Role_key_key" ON "Role"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_code_key" ON "Organization"("code");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationAccount_accountId_key" ON "OrganizationAccount"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_code_version_key" ON "Plan"("code", "version");

-- CreateIndex
CREATE UNIQUE INDEX "InvitationCode_codeHash_key" ON "InvitationCode"("codeHash");

-- CreateIndex
CREATE INDEX "Entitlement_accountId_status_startsAt_endsAt_idx" ON "Entitlement"("accountId", "status", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "CreditLedger_accountId_createdAt_idx" ON "CreditLedger"("accountId", "createdAt");

-- CreateIndex
CREATE INDEX "Work_ownerId_status_expiresAt_idx" ON "Work"("ownerId", "status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkAsset_objectKey_key" ON "WorkAsset"("objectKey");

-- CreateIndex
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerTradeNo_key" ON "Payment"("providerTradeNo");

-- CreateIndex
CREATE UNIQUE INDEX "AiRequest_requestId_key" ON "AiRequest"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "AiRequest_accountId_idempotencyKey_key" ON "AiRequest"("accountId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "UsageEvent_accountId_occurredAt_idx" ON "UsageEvent"("accountId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_accountId_expiresAt_idx" ON "Session"("accountId", "expiresAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "RetentionJob_status_scheduledAt_idx" ON "RetentionJob"("status", "scheduledAt");

-- AddForeignKey
ALTER TABLE "PersonalProfile" ADD CONSTRAINT "PersonalProfile_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountRole" ADD CONSTRAINT "AccountRole_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountRole" ADD CONSTRAINT "AccountRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationAccount" ADD CONSTRAINT "OrganizationAccount_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationAccount" ADD CONSTRAINT "OrganizationAccount_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cohort" ADD CONSTRAINT "Cohort_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CohortMember" ADD CONSTRAINT "CohortMember_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CohortMember" ADD CONSTRAINT "CohortMember_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitationCode" ADD CONSTRAINT "InvitationCode_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitationCode" ADD CONSTRAINT "InvitationCode_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitationRedemption" ADD CONSTRAINT "InvitationRedemption_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "InvitationCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitationRedemption" ADD CONSTRAINT "InvitationRedemption_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditWallet" ADD CONSTRAINT "CreditWallet_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditLedger" ADD CONSTRAINT "CreditLedger_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "CreditWallet"("accountId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Work" ADD CONSTRAINT "Work_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkAsset" ADD CONSTRAINT "WorkAsset_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiRequest" ADD CONSTRAINT "AiRequest_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageEvent" ADD CONSTRAINT "UsageEvent_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetentionJob" ADD CONSTRAINT "RetentionJob_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

