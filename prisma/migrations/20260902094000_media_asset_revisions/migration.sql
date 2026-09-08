-- Immutable metadata history for media assets. Binary uploads remain immutable objects.
CREATE TABLE "MediaAssetRevision" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MediaAssetRevision_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MediaAssetRevision_assetId_version_key" ON "MediaAssetRevision"("assetId", "version");
CREATE INDEX "MediaAssetRevision_assetId_createdAt_idx" ON "MediaAssetRevision"("assetId", "createdAt");
