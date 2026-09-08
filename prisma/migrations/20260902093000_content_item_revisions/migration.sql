-- Immutable revision history for structured CMS content records.
CREATE TABLE "ContentItemRevision" (
    "id" TEXT NOT NULL,
    "contentType" VARCHAR(32) NOT NULL,
    "contentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentItemRevision_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ContentItemRevision_contentType_contentId_version_key" ON "ContentItemRevision"("contentType", "contentId", "version");
CREATE INDEX "ContentItemRevision_contentType_contentId_createdAt_idx" ON "ContentItemRevision"("contentType", "contentId", "createdAt");
