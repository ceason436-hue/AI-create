-- CreateTable
CREATE TABLE "CourseAnnouncement" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "content" TEXT NOT NULL,
    "publishStatus" VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    "publishAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkCourseContext" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "lessonId" TEXT,
    "enrollmentId" TEXT NOT NULL,
    "contextType" VARCHAR(32) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkCourseContext_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiTool" (
    "id" TEXT NOT NULL,
    "toolKey" VARCHAR(64) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "category" VARCHAR(64) NOT NULL,
    "routePath" VARCHAR(180) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    "visibleToPublic" BOOLEAN NOT NULL DEFAULT true,
    "allowAnonymousTrial" BOOLEAN NOT NULL DEFAULT true,
    "dailyTrialLimit" INTEGER NOT NULL DEFAULT 5,
    "coverAssetId" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiTool_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourseAnnouncement_courseId_publishStatus_publishAt_sortOrd_idx" ON "CourseAnnouncement"("courseId", "publishStatus", "publishAt", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "WorkCourseContext_workId_key" ON "WorkCourseContext"("workId");

-- CreateIndex
CREATE INDEX "WorkCourseContext_courseId_lessonId_createdAt_idx" ON "WorkCourseContext"("courseId", "lessonId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkCourseContext_enrollmentId_createdAt_idx" ON "WorkCourseContext"("enrollmentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AiTool_toolKey_key" ON "AiTool"("toolKey");

-- CreateIndex
CREATE INDEX "AiTool_status_visibleToPublic_sortOrder_idx" ON "AiTool"("status", "visibleToPublic", "sortOrder");

-- AddForeignKey
ALTER TABLE "CourseAnnouncement" ADD CONSTRAINT "CourseAnnouncement_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkCourseContext" ADD CONSTRAINT "WorkCourseContext_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkCourseContext" ADD CONSTRAINT "WorkCourseContext_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkCourseContext" ADD CONSTRAINT "WorkCourseContext_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkCourseContext" ADD CONSTRAINT "WorkCourseContext_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
