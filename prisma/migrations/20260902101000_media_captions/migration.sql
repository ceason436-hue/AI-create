-- Captions are separate private WebVTT objects and are served only through a controlled route.
ALTER TABLE "MediaAsset"
  ADD COLUMN "captionObjectKey" TEXT,
  ADD COLUMN "captionLanguage" VARCHAR(32);
