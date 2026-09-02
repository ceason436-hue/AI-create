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
  coverSourceLabel?: string | null;
  date?: string | null;
  media?: Array<{ src: string; mimeType: string | null; caption: string | null; focalPoint: string | null; captionsSrc?: string | null; captionLanguage?: string | null }>;
};

const imageAssets = {
  scene: "/tu1.jpg",
  art: "/tu2.png",
  poster: "/haibao1.png",
};

const fallbackActivities: PublicListItem[] = [
  { id: "activity-open-lab", slug: "open-lab", title: "AI 科创开放实验室", summary: "用一个下午体验从灵感到作品的完整流程。", content: "活动内容、时间和报名方式将在资料确认后由运营后台发布。", type: "体验活动", date: null },
  { id: "activity-project-day", slug: "project-day", title: "小小项目日", summary: "把课程中的小作品带到真实展示场景里。", content: "这是用于占位的活动介绍，正式发布前会替换为经过确认的活动信息。", type: "作品展示", date: null },
];

const fallbackAchievements: PublicListItem[] = [
  { id: "handbook-awards", slug: "handbook-awards", title: "手册资料中的奖项殊荣", summary: "《AI科瑞特手册》收录青少年科技创新大赛、宋庆龄少年儿童发明奖等成果资料。", content: "该内容来自项目提供的《AI科瑞特手册》第 7 页视觉资料。正式上线前仍需由运营人员确认每项成果的展示范围、名称、时间和授权，并按证书原件补充可核验说明。", type: "手册资料 · 奖项殊荣", coverAssetId: "/handbook/handbook-07.png", coverSourceLabel: "真实资料：《AI科瑞特手册》第 7 页 · [PENDING-CONTENT]" },
  { id: "handbook-robotics", slug: "handbook-robotics", title: "机器人与人工智能竞赛资料", summary: "手册资料页展示世界机器人大会、长三角青少年人工智能奥林匹克挑战赛等证书与成果。", content: "该内容来自项目提供的《AI科瑞特手册》第 8 页视觉资料。当前页面使用手册页作为真实资料展示，不对证书中的个人信息、名次或授权范围做额外推断。", type: "手册资料 · 竞赛成果", coverAssetId: "/handbook/handbook-08.png", coverSourceLabel: "真实资料：《AI科瑞特手册》第 8 页 · [PENDING-CONTENT]" },
  { id: "achievement-project-wall", slug: "project-wall", title: "AI 作品成长墙", summary: "记录从问题、草图到最终作品的过程，而不仅是一张结果图。", content: "当前为品牌占位案例，不代表真实学员或已获奖成果。", type: "作品展示", coverAssetId: imageAssets.art },
  { id: "achievement-school-lab", slug: "school-lab", title: "校园创作工作坊", summary: "围绕课堂任务完成一次团队协作和公开表达。", content: "当前为待补充的合作案例占位内容。", type: "合作案例", coverAssetId: imageAssets.scene },
];

const fallbackTeachers: PublicListItem[] = [{ id: "teacher-xu", slug: "teacher-xu", title: "徐鸿涛 博士", summary: "《AI科瑞特手册》专家顾问资料：砾典微创始人、复旦大学研究员、博导。", content: "信息来源：项目提供的《AI科瑞特手册》第 5 页专家顾问页面。公开展示前请项目负责人确认姓名、职务、照片和授权范围。", type: "手册资料 · 专家顾问", coverAssetId: "/handbook/handbook-05.png", coverSourceLabel: "真实资料：《AI科瑞特手册》第 5 页 · [PENDING-CONTENT]" }, { id: "teacher-placeholder", slug: "teacher-placeholder", title: "更多师资资料待补充", summary: "真实教师资料与公开授权范围确认后展示。", content: "占位内容，不代表真实教师资料。", type: "品牌占位", coverAssetId: imageAssets.poster }];
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
      include: { category: true, modules: { where: { publishStatus: "PUBLISHED" }, orderBy: { sortOrder: "asc" }, include: { lessons: { orderBy: { sortOrder: "asc" }, where: { publishStatus: "PUBLISHED" } } } } },
      orderBy: [{ category: { sortOrder: "asc" } }, { updatedAt: "desc" }],
    });
    const mapped = courses.map((course) => ({ ...mapCourse(course as never)!, modules: course.modules.map((module) => ({ id: module.id, title: module.title, description: module.description ?? "", lessons: module.lessons.map((lesson) => ({ id: lesson.id, title: lesson.title, summary: lesson.summary ?? "", estimatedMinutes: lesson.estimatedMinutes })) })) }));
    return mapped;
  } catch {
    return [];
  }
}

export async function getPublicCourse(slug: string) {
  try {
    const course = await db.course.findFirst({ where: { slug, publishStatus: "PUBLISHED" }, include: { category: true, modules: { where: { publishStatus: "PUBLISHED" }, orderBy: { sortOrder: "asc" }, include: { lessons: { orderBy: { sortOrder: "asc" }, where: { publishStatus: "PUBLISHED" } } } } } });
    if (course) return { ...mapCourse(course as never)!, modules: course.modules.map((module) => ({ id: module.id, title: module.title, description: module.description ?? "", lessons: module.lessons.map((lesson) => ({ id: lesson.id, title: lesson.title, summary: lesson.summary ?? "", estimatedMinutes: lesson.estimatedMinutes })) })) };
  } catch {}
  return null;
}

async function getPublishedList(model: "activity" | "achievement" | "teacherProfile" | "campus") {
  try {
    const rows = await (db[model] as { findMany: (args: unknown) => Promise<Array<Record<string, unknown>>> }).findMany({ where: { publishStatus: "PUBLISHED" }, orderBy: { sortOrder: "asc" } });
    if (rows.length) {
      const contentType = model === "activity" ? "activities" : model === "achievement" ? "achievements" : model === "teacherProfile" ? "teachers" : "campuses";
      const galleries = await db.contentMedia.findMany({ where: { contentType, contentId: { in: rows.map((row) => String(row.id)) } }, orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }] });
      const galleryByContent = new Map<string, typeof galleries>(); galleries.forEach((entry) => galleryByContent.set(entry.contentId, [...(galleryByContent.get(entry.contentId) ?? []), entry]));
      const assetIds = [...rows.map((row) => String(row.coverAssetId ?? row.avatarAssetId ?? "")), ...galleries.map((entry) => entry.assetId)].filter(Boolean);
      const assets = assetIds.length ? await db.mediaAsset.findMany({ where: { id: { in: assetIds }, status: "ACTIVE" }, select: { id: true, mimeType: true, sourceType: true, captionObjectKey: true, captionLanguage: true } }) : [];
      const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
      return rows.map((row) => { const gallery = (galleryByContent.get(String(row.id)) ?? []).flatMap((entry) => { const asset = assetsById.get(entry.assetId); return asset ? [{ src: publicMediaUrl(asset.id)!, mimeType: asset.mimeType, caption: entry.caption, focalPoint: entry.focalPoint, captionsSrc: asset.captionObjectKey ? publicCaptionUrl(asset.id) : null, captionLanguage: asset.captionLanguage }] : []; }); const assetId = String(row.coverAssetId ?? row.avatarAssetId ?? "") || null; const asset = assetId ? assetsById.get(assetId) : null; const cover = gallery[0]; const coverSourceLabel = asset?.sourceType === "HANDBOOK" ? "真实资料：《AI科瑞特手册》· [PENDING-CONTENT]" : asset?.sourceType === "REAL" ? "已授权真实素材" : asset?.sourceType === "GENERATED" ? "生成概念图" : asset ? "品牌占位素材 · 待替换" : null; return { id: String(row.id), slug: String(row.slug ?? row.id), title: String(row.title ?? row.name), summary: String(row.summary ?? row.description ?? ""), content: String(row.content ?? row.bio ?? ""), type: String(row.activityType ?? row.achievementType ?? ""), coverAssetId: cover?.src ?? (asset ? publicMediaUrl(asset.id) : null), coverMimeType: cover?.mimeType ?? asset?.mimeType ?? null, coverSourceLabel, media: gallery, date: row.startsAt instanceof Date ? row.startsAt.toISOString() : null }; });
    }
  } catch {}
  return model === "activity" ? fallbackActivities : model === "achievement" ? fallbackAchievements : model === "teacherProfile" ? fallbackTeachers : fallbackCampuses;
}

export const getPublicCategories = async () => {
  try {
    const categories = await db.courseCategory.findMany({ where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" } });
    if (categories.length) return categories.map((category) => ({ id: category.id, name: category.name, slug: category.slug, description: category.description ?? "", coverAssetId: category.coverAssetId }));
  } catch {}
  return [];
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
