export type ReadingDifficulty = "基础" | "进阶" | "挑战";

export type ReadingSegment = {
  text: string;
  question: string;
  evidence: string;
  difficulty: ReadingDifficulty;
};

export type ReadingAnalysis = {
  title: string;
  summary: string;
  keywords: string[];
  structure: Array<{ label: string; segmentIndexes: number[] }>;
  segments: ReadingSegment[];
};

const MAX_SCENE_CHARS = 180;
const TARGET_SCENE_CHARS = 90;
const SCENE_TRANSITION = /^(?:蒲公英|苍耳|豌豆|春季|夏季|秋季|冬季|一路上|最后|后来|突然|第二天|清晨|早晨|中午|傍晚|夜晚)/;

function sentences(text: string) {
  return text.match(/[^。！？；!?]+[。！？；!?]?/g)?.map((item) => item.trim()).filter(Boolean) ?? [];
}

/** Split by a single drawable moment: paragraph boundaries first, then sentence groups. */
export function splitReadingScenes(article: string) {
  const result: string[] = [];
  const paragraphs = article.replace(/\r/g, "").split(/\n\s*\n+|\n+/).map((item) => item.replace(/\s+/g, " ").trim()).filter(Boolean);
  for (const paragraph of paragraphs) {
    const units = sentences(paragraph);
    if (!units.length) continue;
    let current = "";
    let sentenceCount = 0;
    for (const unit of units) {
      if (unit.length > MAX_SCENE_CHARS) {
        if (current) result.push(current);
        current = "";
        for (let offset = 0; offset < unit.length; offset += TARGET_SCENE_CHARS) result.push(unit.slice(offset, offset + TARGET_SCENE_CHARS));
        continue;
      }
      const next = current + unit;
      const beginsNewScene = SCENE_TRANSITION.test(unit);
      if (current && (next.length > MAX_SCENE_CHARS || current.length >= TARGET_SCENE_CHARS || sentenceCount >= 2 || beginsNewScene)) {
        result.push(current);
        current = unit;
        sentenceCount = 1;
      } else {
        current = next;
        sentenceCount += 1;
      }
    }
    if (current) result.push(current);
  }
  return (result.length ? result : [article.slice(0, MAX_SCENE_CHARS)]).slice(0, 80);
}

function segmentFor(text: string, index: number): ReadingSegment {
  return {
    text,
    question: index === 0 ? "这一幅画面里最重要的人物、动作或变化是什么？" : "这一段与上一幅画面相比，发生了什么新的变化？",
    evidence: text.slice(0, 140),
    difficulty: index < 2 ? "基础" : index % 4 === 0 ? "挑战" : "进阶",
  };
}

export function localReadingAnalysis(title: string, article: string, teacherGuide?: string): ReadingAnalysis {
  const segments = splitReadingScenes(article).map(segmentFor);
  const keywordSource = `${title} ${teacherGuide || ""} ${article}`.match(/[\u3400-\u9fff]{2,6}/g) ?? [];
  const keywords = [...new Set(keywordSource.filter((word) => word !== "教师教案"))].slice(0, 8);
  return {
    title,
    summary: article.replace(/\s+/g, " ").slice(0, 220) + (article.length > 220 ? "…" : ""),
    keywords: keywords.length ? keywords : ["阅读理解"],
    structure: [{ label: "课文场景", segmentIndexes: segments.map((_, index) => index) }],
    segments,
  };
}

/** Provider output is accepted only while every segment remains drawable as one scene. */
export function normalizeReadingAnalysis(candidate: ReadingAnalysis, article: string) {
  const locallySplit = splitReadingScenes(article);
  const needsResplit = candidate.segments.some((segment) => segment.text.length > MAX_SCENE_CHARS)
    || (candidate.segments.length === 1 && locallySplit.length > 1)
    || candidate.segments.length < Math.floor(locallySplit.length / 2);
  if (!needsResplit) return candidate;
  const split = locallySplit.map(segmentFor);
  return { ...candidate, structure: [{ label: "课文场景", segmentIndexes: split.map((_, index) => index) }], segments: split };
}
