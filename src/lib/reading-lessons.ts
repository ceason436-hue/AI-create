import { z } from "zod";

const difficulty = z.enum(["基础", "进阶", "挑战"]);
export const readingAnalysisSchema = z.object({
  title: z.string().trim().min(1).max(120),
  summary: z.string().trim().min(1).max(600),
  keywords: z.array(z.string().trim().min(1).max(40)).min(1).max(12),
  structure: z.array(z.object({ label: z.string().trim().min(1).max(80), segmentIndexes: z.array(z.number().int().nonnegative()).min(1).max(80) }).strict()).min(1).max(80),
  segments: z.array(z.object({ text: z.string().trim().min(1).max(4_000), question: z.string().trim().min(1).max(500), evidence: z.string().trim().min(1).max(500), difficulty }).strict()).min(1).max(80),
}).strict();

export const readingLessonPayloadSchema = z.object({
  title: z.string().trim().min(1).max(120),
  article: z.string().trim().min(20).max(50_000),
  teacherGuide: z.string().trim().max(10_000).default(""),
  coverImage: z.string().trim().max(3_500_000).default(""),
  grade: z.number().int().min(1).max(6),
  semester: z.enum(["FIRST", "SECOND"]),
  publisher: z.string().trim().max(80).default("统编版"),
  summary: z.string().trim().max(600).default(""),
  analysis: readingAnalysisSchema.optional(),
});

export type ReadingLessonPayload = z.infer<typeof readingLessonPayloadSchema>;
