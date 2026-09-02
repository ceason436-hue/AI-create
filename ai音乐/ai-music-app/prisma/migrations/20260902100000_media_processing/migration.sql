-- Video processing is asynchronous. Original uploads stay immutable; the worker writes separate playback and poster objects.
ALTER TABLE "MediaAsset"
  ADD COLUMN "playbackObjectKey" TEXT,
  ADD COLUMN "thumbnailObjectKey" TEXT,
  ADD COLUMN "processingStatus" VARCHAR(32) NOT NULL DEFAULT 'READY',
  ADD COLUMN "processingError" TEXT,
  ADD COLUMN "processedAt" TIMESTAMP(3);

CREATE TABLE "MediaProcessingJob" (
  "id" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "jobType" VARCHAR(32) NOT NULL DEFAULT 'TRANSCODE',
  "status" VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "errorCode" VARCHAR(64),
  "errorDetail" TEXT,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MediaProcessingJob_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MediaProcessingJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MediaProcessingJob_status_createdAt_idx" ON "MediaProcessingJob"("status", "createdAt");
CREATE INDEX "MediaProcessingJob_assetId_createdAt_idx" ON "MediaProcessingJob"("assetId", "createdAt");
