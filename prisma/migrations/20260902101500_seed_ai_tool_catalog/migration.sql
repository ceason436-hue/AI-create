-- Seed only the server-whitelisted capabilities. The backend may configure them,
-- but may never create a provider route that is absent from code.
INSERT INTO "AiTool" ("id", "toolKey", "name", "description", "category", "routePath", "sortOrder", "status", "visibleToPublic", "allowAnonymousTrial", "dailyTrialLimit", "createdAt", "updatedAt") VALUES
  ('platform-tool-music', 'music', 'AI 音乐', '从节奏、音高和旋律开始，完成一首作品。', '音乐创作', '/tools/ai-music', 10, 'ACTIVE', true, true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('platform-tool-image', 'image', 'AI 绘画', '用文字和参考图把想象变成视觉作品。', '视觉创作', '/tools/ai-art', 20, 'ACTIVE', true, true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('platform-tool-code', 'code', 'AI 编程', '对话式生成可运行的网页作品。', '编程创作', '/tools/ai-programming', 30, 'ACTIVE', true, true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('platform-tool-vision', 'vision', 'AI 阅读与视觉', '边读边问边画，做一份自己的绘本。', '阅读创作', '/tools/ai-reading', 40, 'ACTIVE', true, true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('platform-tool-chat', 'chat', '文本对话', '围绕学习任务进行文本创作与交流。', '文本创作', '/tools/ai-reading', 50, 'ACTIVE', false, true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('platform-tool-music-query', 'music_query', '音乐查询', '查询并管理 AI 音乐生成结果。', '音乐创作', '/tools/ai-music', 60, 'ACTIVE', false, false, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("toolKey") DO NOTHING;
