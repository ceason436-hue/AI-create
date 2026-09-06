import { describe, expect, it } from "vitest";
import { mapCourseForPublic } from "./public-content";
import type { PublicMedia } from "./public-media";

const media = (assetId: string): PublicMedia => ({
  assetId,
  src: `/api/media/${assetId}`,
  mimeType: "image/webp",
  altText: assetId,
  sourceType: "REAL",
  captionsSrc: null,
  captionLanguage: null,
});

const course = {
  id: "course-1",
  name: "机器人项目课",
  slug: "robot-project-lab",
  shortDescription: "完成一个可以演示的机器人项目。",
  fullDescription: null,
  targetAudience: null,
  gradeRange: null,
  difficulty: null,
  durationText: null,
  deliveryModes: ["线下"],
  enrollmentStatus: "OPEN",
  coverAssetId: "course-cover",
  category: { id: "category-1", name: "机器人", slug: "robot", description: null, coverAssetId: "category-cover" },
};

describe("public course mapping", () => {
  it("prefers a ready course cover over the category fallback", () => {
    const mapped = mapCourseForPublic(course, new Map([["course-cover", media("course-cover")], ["category-cover", media("category-cover")]]));
    expect(mapped?.cover?.src).toBe("/api/media/course-cover");
    expect(mapped?.category.cover?.src).toBe("/api/media/category-cover");
  });

  it("falls back to the category cover when the course media is unavailable", () => {
    const mapped = mapCourseForPublic(course, new Map([["category-cover", media("category-cover")]]));
    expect(mapped?.cover?.src).toBe("/api/media/category-cover");
  });

  it("uses honest defaults and rejects a course without a category", () => {
    const mapped = mapCourseForPublic({ ...course, coverAssetId: null }, new Map());
    expect(mapped).toMatchObject({ fullDescription: course.shortDescription, gradeRange: "以课程详情为准", cover: null });
    expect(mapCourseForPublic({ ...course, category: null }, new Map())).toBeNull();
  });
});
