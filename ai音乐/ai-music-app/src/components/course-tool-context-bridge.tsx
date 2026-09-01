"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function CourseToolContextBridge() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");
  const lessonId = searchParams.get("lessonId");

  useEffect(() => {
    if (!pathname.startsWith("/tools/") || !courseId || !lessonId) return;
    const nativeFetch = window.fetch;
    window.fetch = (input, init) => {
      const requestUrl = typeof input === "string" ? input : input instanceof URL ? input.pathname : input.url;
      if (!requestUrl.startsWith("/api/minimax/")) return nativeFetch(input, init);
      const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
      headers.set("x-krt-course-id", courseId);
      headers.set("x-krt-lesson-id", lessonId);
      return nativeFetch(input, { ...init, headers });
    };
    return () => { window.fetch = nativeFetch; };
  }, [courseId, lessonId, pathname]);

  return null;
}
