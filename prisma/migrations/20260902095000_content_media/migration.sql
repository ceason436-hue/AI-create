-- Ordered, captioned media associations for structured CMS content.
CREATE TABLE "ContentMedia" (
    "id" TEXT NOT NULL,
    "contentType" VARCHAR(32) NOT NULL,
    "contentId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "caption" VARCHAR(500),
    "focalPoint" VARCHAR(64),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentMedia_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ContentMedia_contentType_contentId_assetId_key" ON "ContentMedia"("contentType", "contentId", "assetId");
CREATE INDEX "ContentMedia_contentType_contentId_sortOrder_idx" ON "ContentMedia"("contentType", "contentId", "sortOrder");
