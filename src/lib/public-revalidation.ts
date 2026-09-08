import { revalidatePath } from "next/cache";

const pagePaths: Record<string, string[]> = {
  home: ["/"],
  courses: ["/courses"],
  tools: ["/tools"],
};

export function revalidateSitePage(pageKey: string) {
  for (const path of pagePaths[pageKey] ?? [`/${pageKey}`]) revalidatePath(path, "page");
}

export function revalidateCourses(slug?: string) {
  revalidatePath("/courses", "page");
  revalidatePath("/api/public/courses");
  revalidatePath("/api/public/course-categories");
  if (slug) {
    revalidatePath(`/courses/${slug}`, "page");
    revalidatePath(`/api/public/courses/${slug}`);
  }
}

export function revalidateTools() {
  revalidatePath("/tools", "page");
  revalidatePath("/api/public/ai-tools");
}

export function revalidatePublicContent(kind: "activities" | "achievements") {
  revalidatePath(`/${kind}`, "page");
  revalidatePath(`/api/public/${kind}`);
}

export function revalidatePublicMedia() {
  revalidatePath("/", "layout");
  revalidatePath("/api/media/[assetId]", "page");
}
