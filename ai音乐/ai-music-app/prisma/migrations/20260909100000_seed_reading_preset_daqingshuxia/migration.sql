DO $$
DECLARE
  reading_page_id TEXT;
BEGIN
  INSERT INTO "SitePage" ("id", "pageKey", "title", "description", "publishStatus", "publishedAt", "createdAt", "updatedAt")
  VALUES ('site-page-ai-reading-library', 'ai-reading-library', 'AI 阅读预制课文', '可直接用于绘本创作的课文素材。', 'PUBLISHED', NOW(), NOW(), NOW())
  ON CONFLICT ("pageKey") DO UPDATE SET
    "title" = EXCLUDED."title",
    "description" = EXCLUDED."description",
    "publishStatus" = 'PUBLISHED',
    "publishedAt" = COALESCE("SitePage"."publishedAt", NOW()),
    "updatedAt" = NOW()
  RETURNING "id" INTO reading_page_id;

  INSERT INTO "PageSection" ("id", "pageId", "sectionType", "title", "sortOrder", "theme", "payload", "publishStatus")
  VALUES (
    'reading-preset-daqingshuxia',
    reading_page_id,
    'PRESET_ARTICLE',
    '大青树下的小学',
    10,
    'reading',
    $payload$
    {
      "title": "大青树下的小学",
      "grade": 3,
      "semester": "FIRST",
      "publisher": "统编版",
      "coverImage": "/media/temporary-deploy/reading/daqingshuxia-de-xiaoxue-cover.webp",
      "summary": "走进边疆小学，感受多民族同学共同学习、快乐成长的校园生活。",
      "teacherGuide": "按每一段可由一张独立画面完整呈现的标准预置为六个绘本场景；引导学生关注人物、地点、动作和校园氛围。",
      "article": "早晨，从山坡上，从坪坝里，从一条条开着绒球花和太阳花的小路上，走来了许多小学生，有汉族的，有傣族的，有景颇族的，还有阿昌族和德昂族的。大家高高兴兴来到学校，都成了好朋友。同学们向在校园里欢唱的小鸟打招呼，向敬爱的老师问好，向高高飘扬的国旗敬礼。\n\n“当，当当！当，当当！”大青树上的铜钟敲响了。\n\n上课了，大家在教室里一起朗读课文，那声音真好听！这时候，窗外十分安静，树枝不摇了，鸟儿不叫了，蝴蝶停在花朵上，好像都在听同学们读课文。\n\n最有趣的是，跑来了两只猴子。这些山林里的朋友，是那样好奇地听着。\n\n下课了，大家在大青树下跳孔雀舞、摔跤、做游戏，招引来许多小鸟，连松鼠也赶来看热闹。\n\n这就是我们可爱的小学，一所边疆的小学。同学们在这里学习、玩耍，在这里愉快成长。古老的铜钟，挂在大青树粗壮的枝干上。凤尾竹的影子，在洁白的墙上摇晃……",
      "analysis": {
        "title": "大青树下的小学",
        "summary": "从清晨上学、铜钟响起、课堂朗读到课间活动，六幅画面呈现边疆小学的团结、宁静与欢乐。",
        "keywords": ["大青树", "边疆小学", "民族团结", "铜钟", "朗读", "孔雀舞"],
        "structure": [
          {"label": "清晨来到校园", "segmentIndexes": [0, 1]},
          {"label": "课堂与山林朋友", "segmentIndexes": [2, 3]},
          {"label": "课间欢乐与校园回望", "segmentIndexes": [4, 5]}
        ],
        "segments": [
          {"text": "早晨，从山坡上，从坪坝里，从一条条开着绒球花和太阳花的小路上，走来了许多小学生，有汉族的，有傣族的，有景颇族的，还有阿昌族和德昂族的。大家高高兴兴来到学校，都成了好朋友。同学们向在校园里欢唱的小鸟打招呼，向敬爱的老师问好，向高高飘扬的国旗敬礼。", "question": "清晨来到校园的同学们都看到了什么？你想把哪位同学和哪一种花画进第一幅画？", "evidence": "从不同方向来到学校、各民族同学、花朵、小鸟、老师和国旗。", "difficulty": "基础"},
          {"text": "“当，当当！当，当当！”大青树上的铜钟敲响了。", "question": "铜钟敲响时，大青树、校园和同学们会呈现怎样的瞬间？", "evidence": "拟声词“当，当当”与大青树上的铜钟。", "difficulty": "基础"},
          {"text": "上课了，大家在教室里一起朗读课文，那声音真好听！这时候，窗外十分安静，树枝不摇了，鸟儿不叫了，蝴蝶停在花朵上，好像都在听同学们读课文。", "question": "教室里的朗读声和窗外安静的树枝、鸟儿、蝴蝶放在同一幅画里，会是什么感觉？", "evidence": "朗读声与静止的树枝、鸟儿、蝴蝶形成衬托。", "difficulty": "进阶"},
          {"text": "最有趣的是，跑来了两只猴子。这些山林里的朋友，是那样好奇地听着。", "question": "两只猴子会躲在哪儿听课？它们好奇的神情是什么样的？", "evidence": "两只猴子跑来，像山林朋友一样好奇地听课。", "difficulty": "基础"},
          {"text": "下课了，大家在大青树下跳孔雀舞、摔跤、做游戏，招引来许多小鸟，连松鼠也赶来看热闹。", "question": "下课后的大青树下最热闹的动作是什么？小鸟和松鼠分别会在什么位置观看？", "evidence": "跳孔雀舞、摔跤、做游戏以及前来观看的小鸟和松鼠。", "difficulty": "进阶"},
          {"text": "这就是我们可爱的小学，一所边疆的小学。同学们在这里学习、玩耍，在这里愉快成长。古老的铜钟，挂在大青树粗壮的枝干上。凤尾竹的影子，在洁白的墙上摇晃……", "question": "如果这是绘本的最后一页，你会怎样让大青树、铜钟、凤尾竹和洁白的墙共同表现这所可爱的小学？", "evidence": "可爱的边疆小学、快乐成长的同学、古老铜钟和摇晃的凤尾竹影子。", "difficulty": "挑战"}
        ]
      }
    }
    $payload$::jsonb,
    'PUBLISHED'
  )
  ON CONFLICT ("id") DO UPDATE SET
    "pageId" = EXCLUDED."pageId",
    "sectionType" = EXCLUDED."sectionType",
    "title" = EXCLUDED."title",
    "sortOrder" = EXCLUDED."sortOrder",
    "theme" = EXCLUDED."theme",
    "payload" = EXCLUDED."payload",
    "publishStatus" = 'PUBLISHED';

  INSERT INTO "ContentRevision" ("id", "sectionId", "version", "payload", "createdBy", "createdAt")
  SELECT 'reading-preset-daqingshuxia-v1', "id", 1, "payload", 'system', NOW()
  FROM "PageSection" WHERE "id" = 'reading-preset-daqingshuxia'
  ON CONFLICT ("sectionId", "version") DO UPDATE SET "payload" = EXCLUDED."payload", "createdAt" = NOW();
END $$;
