import { TEMPORARY_READING_LESSON } from "@/lib/temporary-reading-lesson";

// The temporary deployment intentionally contains only the reviewed preset.
// It is pre-segmented, so selecting it starts picture-book creation immediately.
export const builtinArticles = [{
  id: TEMPORARY_READING_LESSON.id,
  title: TEMPORARY_READING_LESSON.title,
  coverImage: TEMPORARY_READING_LESSON.coverImage,
  content: TEMPORARY_READING_LESSON.article,
  segments: TEMPORARY_READING_LESSON.segments,
}];
