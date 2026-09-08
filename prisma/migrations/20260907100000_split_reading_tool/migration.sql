-- AI reading is a first-class governed capability. The earlier catalog exposed
-- reading through the unrelated `vision` key, which made entitlements, cost
-- policy and request audit records disagree with the public product.
INSERT INTO "AiTool" ("id", "toolKey", "name", "description", "category", "routePath", "sortOrder", "status", "visibleToPublic", "allowAnonymousTrial", "dailyTrialLimit", "createdAt", "updatedAt")
VALUES ('platform-tool-reading', 'reading', 'AI 阅读', '逐段理解文章、生成问题并创作绘本。', '阅读创作', '/tools/ai-reading', 40, 'ACTIVE', true, true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("toolKey") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "category" = EXCLUDED."category",
  "routePath" = EXCLUDED."routePath",
  "visibleToPublic" = true,
  "updatedAt" = CURRENT_TIMESTAMP;

UPDATE "AiTool"
SET "name" = '视觉点评', "description" = '分析图片内容并给出结构化建议。', "category" = '视觉创作', "routePath" = '/tools/ai-art', "visibleToPublic" = false, "updatedAt" = CURRENT_TIMESTAMP
WHERE "toolKey" = 'vision';

UPDATE "OrganizationAccount"
SET "allowedTools" = array_replace("allowedTools", 'vision', 'reading')
WHERE 'vision' = ANY("allowedTools") AND NOT ('reading' = ANY("allowedTools"));

UPDATE "Plan"
SET "allowedTools" = array_replace("allowedTools", 'vision', 'reading')
WHERE 'vision' = ANY("allowedTools") AND NOT ('reading' = ANY("allowedTools"));

UPDATE "CourseToolBinding" SET "toolKey" = 'reading' WHERE "toolKey" = 'vision';

UPDATE "SystemSetting"
SET "value" = "value" || jsonb_build_object('reading', COALESCE("value"->'vision', '5'::jsonb)),
    "version" = "version" + 1,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'ai_tool_credit_costs' AND NOT ("value" ? 'reading');
