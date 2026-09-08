import type { ReadingAnalysis } from "./reading-analysis";

export type ReadingChatMessage = { role: "user" | "assistant"; content: string };
export type ReadingSegmentWork = { prompt: string; style: string | null; image: string; variants: string[]; chatHistory?: ReadingChatMessage[] };
export type ReadingProject = {
  id: string;
  sourceId?: string;
  title: string;
  analysis: ReadingAnalysis;
  createdAt: number;
  updatedAt: number;
  currentIndex: number;
  segmentWorks: Record<number, ReadingSegmentWork>;
  style?: string | null;
  styleApproved?: boolean;
  styleChoiceMade?: boolean;
  template?: "classic" | "picture" | "notebook";
};

export const emptySegmentWork = (): ReadingSegmentWork => ({ prompt: "", style: null, image: "", variants: [], chatHistory: [] });
