ALTER TABLE "Work"
  ADD COLUMN "favorite" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "parentWorkId" TEXT;

CREATE INDEX "Work_parentWorkId_version_idx" ON "Work"("parentWorkId", "version");
CREATE UNIQUE INDEX "Work_parentWorkId_version_key" ON "Work"("parentWorkId", "version");
ALTER TABLE "Work" ADD CONSTRAINT "Work_parentWorkId_fkey" FOREIGN KEY ("parentWorkId") REFERENCES "Work"("id") ON DELETE SET NULL ON UPDATE CASCADE;
