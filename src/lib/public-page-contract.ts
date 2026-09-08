import { z } from "zod";
import type { PublishedSection } from "./site-page-payload";

const text = z.string().trim().min(1).max(240);

export const homePageContentSchema = z.object({
  hero: z.object({
    eyebrow: text,
    titleLine1: text,
    titleLine2: text,
    primaryLabel: text,
    secondaryLabel: text,
  }),
  cta: z.object({ title: text, description: text, buttonLabel: text }),
});

export const coursesPageContentSchema = z.object({
  hero: z.object({ titleLine1: text, titleLine2: text, descriptionLine1: text, descriptionLine2: text }),
});

export const toolsPageContentSchema = z.object({
  hero: z.object({ titleLine1: text, titleLine2: text, descriptionLine1: text, descriptionLine2: text }),
});

export type HomePageContent = z.infer<typeof homePageContentSchema>;
export type CoursesPageContent = z.infer<typeof coursesPageContentSchema>;
export type ToolsPageContent = z.infer<typeof toolsPageContentSchema>;

function parseSection<T>(sections: PublishedSection[], sectionType: string, schema: z.ZodType<T>, fallback: T): T {
  const payload = sections.find((section) => section.sectionType === sectionType)?.payload;
  const parsed = schema.safeParse(payload);
  return parsed.success ? parsed.data : fallback;
}

export const DEFAULT_HOME_CONTENT: HomePageContent = {
  hero: { eyebrow: "科创五育 · 创智先行", titleLine1: "让孩子在真实创造中", titleLine2: "理解科技", primaryLabel: "浏览课程", secondaryLabel: "预约咨询" },
  cta: { title: "开启孩子的科创学习之旅", description: "专业课程顾问为您解答，定制学习方案", buttonLabel: "课程咨询" },
};

export const DEFAULT_COURSES_CONTENT: CoursesPageContent = {
  hero: { titleLine1: "从兴趣出发，", titleLine2: "把知识做成作品", descriptionLine1: "六大课程方向，四段成长路径，", descriptionLine2: "在真实项目中持续探索。" },
};

export const DEFAULT_TOOLS_CONTENT: ToolsPageContent = {
  hero: { titleLine1: "把想法变成", titleLine2: "可以听、看、读、运行的作品。", descriptionLine1: "科瑞特 AI 创作空间，融合四大 AI 工具与项目学习流程，", descriptionLine2: "让创意落地，让学习真实发生。" },
};

export function homePageContent(sections: PublishedSection[]): HomePageContent {
  return {
    hero: parseSection(sections, "HERO", homePageContentSchema.shape.hero, DEFAULT_HOME_CONTENT.hero),
    cta: parseSection(sections, "CTA", homePageContentSchema.shape.cta, DEFAULT_HOME_CONTENT.cta),
  };
}

export function coursesPageContent(sections: PublishedSection[]): CoursesPageContent {
  return { hero: parseSection(sections, "HERO", coursesPageContentSchema.shape.hero, DEFAULT_COURSES_CONTENT.hero) };
}

export function toolsPageContent(sections: PublishedSection[]): ToolsPageContent {
  return { hero: parseSection(sections, "HERO", toolsPageContentSchema.shape.hero, DEFAULT_TOOLS_CONTENT.hero) };
}

export function isValidManagedSectionPayload(pageKey: string, sectionType: string, payload: unknown) {
  const schema = pageKey === "home"
    ? sectionType === "HERO" ? homePageContentSchema.shape.hero : sectionType === "CTA" ? homePageContentSchema.shape.cta : null
    : pageKey === "courses" && sectionType === "HERO"
      ? coursesPageContentSchema.shape.hero
      : pageKey === "tools" && sectionType === "HERO"
        ? toolsPageContentSchema.shape.hero
        : null;
  return schema ? schema.safeParse(payload).success : true;
}
