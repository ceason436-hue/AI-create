import { db } from "@/lib/db";
import { publicCaptionUrl, publicMediaUrl } from "@/lib/media-files";

export type PublicCategory = { id: string; name: string; slug: string; description: string; coverAssetId: string | null };
export type PublicCourse = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  targetAudience: string;
  gradeRange: string;
  difficulty: string;
  durationText: string;
  deliveryModes: string[];
  enrollmentStatus: string;
  category: PublicCategory;
  modules: Array<{ id: string; title: string; description: string; lessons: Array<{ id: string; title: string; summary: string; estimatedMinutes: number }> }>;
};

export type PublicListItem = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  type?: string;
  coverAssetId?: string | null;
  coverMimeType?: string | null;
  date?: string | null;
  media?: Array<{ src: string; mimeType: string | null; caption: string | null; focalPoint: string | null; captionsSrc?: string | null; captionLanguage?: string | null }>;
};

const imageAssets = {
  scene: "/tu1.jpg",
  art: "/tu2.png",
  poster: "/haibao1.png",
};

const fallbackCategories: PublicCategory[] = [
  { id: "category-regular", name: "常规课", slug: "regular", description: "从计算思维、机器人到数字创作，建立持续学习的科技基础。", coverAssetId: imageAssets.scene },
  { id: "category-competition", name: "竞赛课程", slug: "competition", description: "以项目制训练和阶段成果，陪伴孩子准备科创赛事。", coverAssetId: imageAssets.art },
  { id: "category-ai", name: "AI课程", slug: "ai", description: "把 AI 变成可理解、可动手、可展示的创作工具。", coverAssetId: imageAssets.poster },
];

const fallbackCourses: PublicCourse[] = [
  {
    id: "course-ai-creation",
    name: "AI 创作启航",
    slug: "ai-creation-starter",
    shortDescription: "从一个问题开始，完成一件属于自己的 AI 科创作品。",
    fullDescription: "通过阅读、图像、音乐和编程四种表达方式，带孩子理解 AI 的工作方式，并完成一项可展示的跨学科创作。",
    targetAudience: "小学二至六年级，对科技创作感兴趣的孩子",
    gradeRange: "二至六年级",
    difficulty: "启蒙",
    durationText: "8 次课 / 16 小时",
    deliveryModes: ["线下", "校内合作"],
    enrollmentStatus: "OPEN",
    category: fallbackCategories[2],
    modules: [
      { id: "m-ai-1", title: "认识 AI 与创作任务", description: "从生活问题出发，建立创作目标。", lessons: [{ id: "l-ai-1", title: "我的第一个 AI 项目", summary: "了解项目流程和安全使用边界。", estimatedMinutes: 45 }, { id: "l-ai-2", title: "把想法变成提示", summary: "学会把观察、目标和限制说清楚。", estimatedMinutes: 45 }] },
      { id: "m-ai-2", title: "多模态作品工作坊", description: "用文字、图像和声音丰富表达。", lessons: [{ id: "l-ai-3", title: "作品展示与复盘", summary: "整理过程，完成一次小型作品发布。", estimatedMinutes: 60 }] },
    ],
  },
  {
    id: "course-music",
    name: "AI 音乐实验室",
    slug: "ai-music-lab",
    shortDescription: "从节奏、音高到旋律，让零基础孩子完成第一首原创音乐。",
    fullDescription: "将音乐基础与 AI 工具结合，孩子可以先在浏览器里练习，再把灵感扩展为一首完整作品。",
    targetAudience: "喜欢音乐、故事和动手尝试的孩子",
    gradeRange: "二至六年级",
    difficulty: "基础",
    durationText: "6 次课 / 12 小时",
    deliveryModes: ["线下", "线上"],
    enrollmentStatus: "OPEN",
    category: fallbackCategories[2],
    modules: [{ id: "m-music-1", title: "声音与节奏", description: "用互动练习建立音乐直觉。", lessons: [{ id: "l-music-1", title: "节奏实验", summary: "从拍手和鼓点认识节奏。", estimatedMinutes: 45 }, { id: "l-music-2", title: "三键成曲", summary: "用简单选择组合音乐片段。", estimatedMinutes: 60 }] }],
  },
  {
    id: "course-robotics",
    name: "机器人与工程实践",
    slug: "robotics-engineering",
    shortDescription: "从拆解问题到制作原型，完成一次有证据的工程实践。",
    fullDescription: "使用结构化的工程流程，让孩子学会观察、设计、测试和改进，而不是只追求一次成功。",
    targetAudience: "喜欢搭建、实验和解决问题的孩子",
    gradeRange: "三至六年级",
    difficulty: "进阶",
    durationText: "10 次课 / 20 小时",
    deliveryModes: ["线下", "校内合作"],
    enrollmentStatus: "COMING_SOON",
    category: fallbackCategories[0],
    modules: [{ id: "m-robot-1", title: "设计与原型", description: "从需求到方案，再到可验证的原型。", lessons: [{ id: "l-robot-1", title: "观察与拆解", summary: "将复杂问题拆成可完成的小任务。", estimatedMinutes: 60 }] }],
  },
  {
    id: "course-competition",
    name: "科创竞赛项目制训练",
    slug: "competition-project",
    shortDescription: "围绕真实主题完成选题、研究、制作、答辩与迭代。",
    fullDescription: "课程不承诺虚构的奖项或排名，以项目记录、过程证据和表达能力为核心，帮助团队形成可核验的作品材料。",
    targetAudience: "已经有基础，希望参加项目制活动的学生",
    gradeRange: "四至六年级",
    difficulty: "竞赛",
    durationText: "12 次课 / 24 小时",
    deliveryModes: ["线下", "集训"],
    enrollmentStatus: "CONSULT",
    category: fallbackCategories[1],
    modules: [{ id: "m-comp-1", title: "选题与证据", description: "建立项目问题、方法和展示结构。", lessons: [{ id: "l-comp-1", title: "项目问题定义", summary: "把兴趣转为可以验证的问题。", estimatedMinutes: 60 }] }],
  },
  {
    id: "course-programming",
    name: "少儿编程课程体系",
    slug: "programming-pathway",
    shortDescription: "从 Scratch 到 Python、C++，循序渐进培养计算思维与综合运用能力。",
    fullDescription: "根据《AI科瑞特手册》课程资料，编程课程覆盖 Scratch、Python 和 C++，强调科学教学设计、细致分析、启发式教学，以及知识与思维并重。",
    targetAudience: "小学一至六年级，按基础与年龄分层",
    gradeRange: "小学一至六年级",
    difficulty: "基础 / 进阶",
    durationText: "按年龄与课程体系安排",
    deliveryModes: ["线下", "校内合作"],
    enrollmentStatus: "CONSULT",
    category: fallbackCategories[0],
    modules: [{ id: "m-code-1", title: "图形化编程基础", description: "理解程序、角色、坐标、控制和综合运用。", lessons: [{ id: "l-code-1", title: "Scratch 与计算思维", summary: "从图形化编程建立问题拆解能力。", estimatedMinutes: 60 }] }],
  },
];

const fallbackActivities: PublicListItem[] = [
  { id: "activity-open-lab", slug: "open-lab", title: "AI 科创开放实验室", summary: "用一个下午体验从灵感到作品的完整流程。", content: "活动内容、时间和报名方式将在资料确认后由运营后台发布。", type: "体验活动", date: null },
  { id: "activity-project-day", slug: "project-day", title: "小小项目日", summary: "把课程中的小作品带到真实展示场景里。", content: "这是用于占位的活动介绍，正式发布前会替换为经过确认的活动信息。", type: "作品展示", date: null },
];

const fallbackAchievements: PublicListItem[] = [
  { id: "handbook-awards", slug: "handbook-awards", title: "手册资料中的奖项殊荣", summary: "《AI科瑞特手册》收录青少年科技创新大赛、宋庆龄少年儿童发明奖等成果资料。", content: "该内容来自项目提供的《AI科瑞特手册》视觉资料页。正式上线前仍需由运营人员确认每项成果的展示范围、名称、时间和授权，并按证书原件补充可核验说明。", type: "手册资料 · 奖项殊荣", coverAssetId: "/handbook/handbook-07.png" },
  { id: "handbook-robotics", slug: "handbook-robotics", title: "机器人与人工智能竞赛资料", summary: "手册资料页展示世界机器人大会、长三角青少年人工智能奥林匹克挑战赛等证书与成果。", content: "该内容来自项目提供的《AI科瑞特手册》视觉资料页。当前页面使用手册页作为真实资料展示，不对证书中的个人信息、名次或授权范围做额外推断。", type: "手册资料 · 竞赛成果", coverAssetId: "/handbook/handbook-08.png" },
  { id: "achievement-project-wall", slug: "project-wall", title: "AI 作品成长墙", summary: "记录从问题、草图到最终作品的过程，而不仅是一张结果图。", content: "当前为品牌占位案例，不代表真实学员或已获奖成果。", type: "作品展示", coverAssetId: imageAssets.art },
  { id: "achievement-school-lab", slug: "school-lab", title: "校园创作工作坊", summary: "围绕课堂任务完成一次团队协作和公开表达。", content: "当前为待补充的合作案例占位内容。", type: "合作案例", coverAssetId: imageAssets.scene },
];

const fallbackTeachers: PublicListItem[] = [{ id: "teacher-xu", slug: "teacher-xu", title: "徐鸿涛 博士", summary: "《AI科瑞特手册》专家顾问资料：砾典微创始人、复旦大学研究员、博导。", content: "信息来源：项目提供的《AI科瑞特手册》专家顾问页面。公开展示前请项目负责人确认姓名、职务、照片和授权范围。", type: "手册资料 · 专家顾问", coverAssetId: "/handbook/handbook-05.png" }, { id: "teacher-placeholder", slug: "teacher-placeholder", title: "更多师资资料待补充", summary: "真实教师资料与公开授权范围确认后展示。", content: "占位内容，不代表真实教师资料。", type: "品牌占位", coverAssetId: imageAssets.poster }];
const fallbackCampuses: PublicListItem[] = [{ id: "campus-placeholder", slug: "campus-placeholder", title: "校区资料待补充", summary: "校区地址、开放时间和环境图片确认后展示。", content: "占位内容，不代表真实校区信息。", type: "品牌占位", coverAssetId: imageAssets.scene }];

function mapCourse(course: Awaited<ReturnType<typeof db.course.findFirst>> & { category?: PublicCategory | null } | null): PublicCourse | null {
  if (!course || !course.category) return null;
  return {
    id: course.id,
    name: course.name,
    slug: course.slug,
    shortDescription: course.shortDescription,
    fullDescription: course.fullDescription ?? course.shortDescription,
    targetAudience: course.targetAudience ?? "适合希望动手创作的学生",
    gradeRange: course.gradeRange ?? "以课程详情为准",
    difficulty: course.difficulty ?? "基础",
    durationText: course.durationText ?? "以课程安排为准",
    deliveryModes: course.deliveryModes,
    enrollmentStatus: course.enrollmentStatus,
    category: course.category,
    modules: [],
  };
}

export async function getPublicCourses(filters?: { category?: string; query?: string }) {
  try {
    const courses = await db.course.findMany({
      where: { publishStatus: "PUBLISHED", ...(filters?.category ? { category: { slug: filters.category } } : {}), ...(filters?.query ? { OR: [{ name: { contains: filters.query, mode: "insensitive" } }, { shortDescription: { contains: filters.query, mode: "insensitive" } }] } : {}) },
      include: { category: true, modules: { orderBy: { sortOrder: "asc" }, include: { lessons: { orderBy: { sortOrder: "asc" }, where: { publishStatus: "PUBLISHED" } } } } },
      orderBy: [{ category: { sortOrder: "asc" } }, { updatedAt: "desc" }],
    });
    const mapped = courses.map((course) => ({ ...mapCourse(course as never)!, modules: course.modules.map((module) => ({ id: module.id, title: module.title, description: module.description ?? "", lessons: module.lessons.map((lesson) => ({ id: lesson.id, title: lesson.title, summary: lesson.summary ?? "", estimatedMinutes: lesson.estimatedMinutes })) })) }));
    return mapped.length ? mapped : fallbackCourses.filter((course) => !filters?.category || course.category.slug === filters.category).filter((course) => !filters?.query || `${course.name}${course.shortDescription}`.toLowerCase().includes(filters.query.toLowerCase()));
  } catch {
    return fallbackCourses.filter((course) => !filters?.category || course.category.slug === filters.category).filter((course) => !filters?.query || `${course.name}${course.shortDescription}`.toLowerCase().includes(filters.query.toLowerCase()));
  }
}

export async function getPublicCourse(slug: string) {
  try {
    const course = await db.course.findFirst({ where: { slug, publishStatus: "PUBLISHED" }, include: { category: true, modules: { orderBy: { sortOrder: "asc" }, include: { lessons: { orderBy: { sortOrder: "asc" }, where: { publishStatus: "PUBLISHED" } } } } } });
    if (course) return { ...mapCourse(course as never)!, modules: course.modules.map((module) => ({ id: module.id, title: module.title, description: module.description ?? "", lessons: module.lessons.map((lesson) => ({ id: lesson.id, title: lesson.title, summary: lesson.summary ?? "", estimatedMinutes: lesson.estimatedMinutes })) })) };
  } catch {}
  return fallbackCourses.find((course) => course.slug === slug) ?? null;
}

async function getPublishedList(model: "activity" | "achievement" | "teacherProfile" | "campus") {
  try {
    const rows = await (db[model] as { findMany: (args: unknown) => Promise<Array<Record<string, unknown>>> }).findMany({ where: { publishStatus: "PUBLISHED" }, orderBy: { sortOrder: "asc" } });
    if (rows.length) {
      const contentType = model === "activity" ? "activities" : model === "achievement" ? "achievements" : model === "teacherProfile" ? "teachers" : "campuses";
      const galleries = await db.contentMedia.findMany({ where: { contentType, contentId: { in: rows.map((row) => String(row.id)) } }, orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }] });
      const galleryByContent = new Map<string, typeof galleries>(); galleries.forEach((entry) => galleryByContent.set(entry.contentId, [...(galleryByContent.get(entry.contentId) ?? []), entry]));
      const assetIds = [...rows.map((row) => String(row.coverAssetId ?? row.avatarAssetId ?? "")), ...galleries.map((entry) => entry.assetId)].filter(Boolean);
      const assets = assetIds.length ? await db.mediaAsset.findMany({ where: { id: { in: assetIds }, status: "ACTIVE" }, select: { id: true, mimeType: true, captionObjectKey: true, captionLanguage: true } }) : [];
      const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
      return rows.map((row) => { const gallery = (galleryByContent.get(String(row.id)) ?? []).flatMap((entry) => { const asset = assetsById.get(entry.assetId); return asset ? [{ src: publicMediaUrl(asset.id)!, mimeType: asset.mimeType, caption: entry.caption, focalPoint: entry.focalPoint, captionsSrc: asset.captionObjectKey ? publicCaptionUrl(asset.id) : null, captionLanguage: asset.captionLanguage }] : []; }); const assetId = String(row.coverAssetId ?? row.avatarAssetId ?? "") || null; const asset = assetId ? assetsById.get(assetId) : null; const cover = gallery[0]; return { id: String(row.id), slug: String(row.slug ?? row.id), title: String(row.title ?? row.name), summary: String(row.summary ?? row.description ?? ""), content: String(row.content ?? row.bio ?? ""), type: String(row.activityType ?? row.achievementType ?? ""), coverAssetId: cover?.src ?? (asset ? publicMediaUrl(asset.id) : null), coverMimeType: cover?.mimeType ?? asset?.mimeType ?? null, media: gallery, date: row.startsAt instanceof Date ? row.startsAt.toISOString() : null }; });
    }
  } catch {}
  return model === "activity" ? fallbackActivities : model === "achievement" ? fallbackAchievements : model === "teacherProfile" ? fallbackTeachers : fallbackCampuses;
}

export const getPublicCategories = async () => {
  try {
    const categories = await db.courseCategory.findMany({ where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" } });
    if (categories.length) return categories.map((category) => ({ id: category.id, name: category.name, slug: category.slug, description: category.description ?? "", coverAssetId: category.coverAssetId }));
  } catch {}
  return fallbackCategories;
};

export const getPublicActivities = () => getPublishedList("activity");
export const getPublicAchievements = () => getPublishedList("achievement");
export const getPublicTeachers = () => getPublishedList("teacherProfile");
export const getPublicCampuses = () => getPublishedList("campus");
export async function getPublicPartners() {
  try {
    const partners = await db.partnerSchool.findMany({ where: { publishStatus: "PUBLISHED" }, orderBy: { sortOrder: "asc" } });
    return partners.map((partner) => ({ id: partner.id, name: partner.name, description: partner.description ?? "", logoUrl: publicMediaUrl(partner.logoAssetId) }));
  } catch { return []; }
}

export const placeholderMedia = imageAssets;
