-- Platform content, learning center, courseware protection and CMS.
CREATE TABLE "CourseCategory" (
    "id" TEXT NOT NULL,
    "parentId" TEXT,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "description" TEXT,
    "coverAssetId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CourseCategory_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "shortDescription" VARCHAR(500) NOT NULL,
    "fullDescription" TEXT,
    "targetAudience" TEXT,
    "ageMin" INTEGER,
    "ageMax" INTEGER,
    "gradeRange" TEXT,
    "difficulty" VARCHAR(32),
    "deliveryModes" TEXT[] NOT NULL,
    "totalLessons" INTEGER NOT NULL DEFAULT 0,
    "durationText" VARCHAR(80),
    "enrollmentStatus" VARCHAR(32) NOT NULL DEFAULT 'OPEN',
    "coverAssetId" TEXT,
    "publishStatus" VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CourseModule" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "publishStatus" VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    CONSTRAINT "CourseModule_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "summary" TEXT,
    "content" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 45,
    "publishStatus" VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "cohortId" TEXT,
    "organizationId" TEXT,
    "source" VARCHAR(32) NOT NULL DEFAULT 'ADMIN',
    "status" VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "lastLessonId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "LearningProgress" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "lastViewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LearningProgress_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AnonymousUsageEvent" (
    "id" TEXT NOT NULL,
    "anonymousIdHash" VARCHAR(128) NOT NULL,
    "toolKey" VARCHAR(64) NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "requestId" VARCHAR(128),
    "ipHash" VARCHAR(128),
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnonymousUsageEvent_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CourseToolBinding" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "lessonId" TEXT,
    "toolKey" VARCHAR(64) NOT NULL,
    "accessMode" VARCHAR(32) NOT NULL DEFAULT 'COURSE',
    "presetConfig" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT "CourseToolBinding_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CoursewareAsset" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "lessonId" TEXT,
    "title" VARCHAR(180) NOT NULL,
    "assetType" VARCHAR(32) NOT NULL,
    "originalObjectKey" TEXT,
    "previewObjectKey" TEXT,
    "thumbnailObjectKey" TEXT,
    "originalMimeType" VARCHAR(128),
    "previewMimeType" VARCHAR(128),
    "sizeBytes" BIGINT NOT NULL DEFAULT 0,
    "pageCount" INTEGER,
    "aspectRatio" VARCHAR(32),
    "checksum" VARCHAR(128),
    "conversionStatus" VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    "publishStatus" VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CoursewareAsset_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CoursewareJob" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "jobType" VARCHAR(32) NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "errorCode" VARCHAR(64),
    "errorDetail" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CoursewareJob_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CoursewareAccessLog" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "enrollmentId" TEXT,
    "sessionId" TEXT,
    "ipHash" VARCHAR(128),
    "deviceSummary" VARCHAR(300),
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CoursewareAccessLog_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "summary" VARCHAR(500) NOT NULL,
    "content" TEXT,
    "activityType" VARCHAR(64),
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "location" VARCHAR(180),
    "coverAssetId" TEXT,
    "publishStatus" VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "summary" VARCHAR(500) NOT NULL,
    "content" TEXT,
    "achievementType" VARCHAR(64) NOT NULL DEFAULT 'PROJECT',
    "proofNote" TEXT,
    "coverAssetId" TEXT,
    "publishStatus" VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "TeacherProfile" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "title" VARCHAR(120),
    "bio" TEXT,
    "avatarAssetId" TEXT,
    "publishStatus" VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TeacherProfile_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Campus" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "address" TEXT,
    "description" TEXT,
    "coverAssetId" TEXT,
    "publishStatus" VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Campus_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PartnerSchool" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "logoAssetId" TEXT,
    "description" TEXT,
    "publishStatus" VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PartnerSchool_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL,
    "inquiryType" VARCHAR(32) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "contact" VARCHAR(160) NOT NULL,
    "grade" VARCHAR(80),
    "courseInterest" VARCHAR(180),
    "region" VARCHAR(120),
    "note" TEXT,
    "status" VARCHAR(32) NOT NULL DEFAULT 'NEW',
    "handledBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SitePage" (
    "id" TEXT NOT NULL,
    "pageKey" VARCHAR(80) NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "publishStatus" VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SitePage_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PageSection" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "sectionType" VARCHAR(64) NOT NULL,
    "title" VARCHAR(180),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "theme" VARCHAR(32),
    "payload" JSONB NOT NULL,
    "publishStatus" VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    CONSTRAINT "PageSection_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ContentRevision" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentRevision_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "sourceType" VARCHAR(32) NOT NULL DEFAULT 'PLACEHOLDER',
    "objectKey" TEXT,
    "publicUrl" TEXT,
    "title" VARCHAR(180),
    "altText" VARCHAR(300),
    "mimeType" VARCHAR(128),
    "width" INTEGER,
    "height" INTEGER,
    "licenseNote" TEXT,
    "status" VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MediaSlot" (
    "id" TEXT NOT NULL,
    "slotKey" VARCHAR(120) NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "aspectRatio" VARCHAR(32),
    "status" VARCHAR(32) NOT NULL DEFAULT 'PLACEHOLDER',
    "assetId" TEXT,
    "mobileAssetId" TEXT,
    "focalPoint" VARCHAR(64),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MediaSlot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CourseCategory_slug_key" ON "CourseCategory"("slug");
CREATE INDEX "Course_categoryId_publishStatus_enrollmentStatus_idx" ON "Course"("categoryId", "publishStatus", "enrollmentStatus");
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");
CREATE INDEX "CourseModule_courseId_sortOrder_idx" ON "CourseModule"("courseId", "sortOrder");
CREATE INDEX "Lesson_moduleId_sortOrder_idx" ON "Lesson"("moduleId", "sortOrder");
CREATE UNIQUE INDEX "Enrollment_accountId_courseId_key" ON "Enrollment"("accountId", "courseId");
CREATE INDEX "Enrollment_accountId_status_startsAt_endsAt_idx" ON "Enrollment"("accountId", "status", "startsAt", "endsAt");
CREATE INDEX "AnonymousUsageEvent_anonymousIdHash_toolKey_occurredAt_idx" ON "AnonymousUsageEvent"("anonymousIdHash", "toolKey", "occurredAt");
CREATE UNIQUE INDEX "LearningProgress_enrollmentId_lessonId_key" ON "LearningProgress"("enrollmentId", "lessonId");
CREATE INDEX "CourseToolBinding_courseId_status_sortOrder_idx" ON "CourseToolBinding"("courseId", "status", "sortOrder");
CREATE INDEX "CoursewareAsset_courseId_publishStatus_idx" ON "CoursewareAsset"("courseId", "publishStatus");
CREATE INDEX "CoursewareJob_status_createdAt_idx" ON "CoursewareJob"("status", "createdAt");
CREATE INDEX "CoursewareAccessLog_assetId_accessedAt_idx" ON "CoursewareAccessLog"("assetId", "accessedAt");
CREATE UNIQUE INDEX "Activity_slug_key" ON "Activity"("slug");
CREATE UNIQUE INDEX "Achievement_slug_key" ON "Achievement"("slug");
CREATE INDEX "Inquiry_status_createdAt_idx" ON "Inquiry"("status", "createdAt");
CREATE UNIQUE INDEX "SitePage_pageKey_key" ON "SitePage"("pageKey");
CREATE INDEX "PageSection_pageId_publishStatus_sortOrder_idx" ON "PageSection"("pageId", "publishStatus", "sortOrder");
CREATE UNIQUE INDEX "ContentRevision_sectionId_version_key" ON "ContentRevision"("sectionId", "version");
CREATE UNIQUE INDEX "MediaSlot_slotKey_key" ON "MediaSlot"("slotKey");

ALTER TABLE "CourseCategory" ADD CONSTRAINT "CourseCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CourseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Course" ADD CONSTRAINT "Course_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CourseCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CourseModule" ADD CONSTRAINT "CourseModule_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "CourseModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningProgress" ADD CONSTRAINT "LearningProgress_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningProgress" ADD CONSTRAINT "LearningProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseToolBinding" ADD CONSTRAINT "CourseToolBinding_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseToolBinding" ADD CONSTRAINT "CourseToolBinding_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CoursewareAsset" ADD CONSTRAINT "CoursewareAsset_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CoursewareAsset" ADD CONSTRAINT "CoursewareAsset_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CoursewareJob" ADD CONSTRAINT "CoursewareJob_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "CoursewareAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CoursewareAccessLog" ADD CONSTRAINT "CoursewareAccessLog_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "CoursewareAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CoursewareAccessLog" ADD CONSTRAINT "CoursewareAccessLog_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PageSection" ADD CONSTRAINT "PageSection_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "SitePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentRevision" ADD CONSTRAINT "ContentRevision_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "PageSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
