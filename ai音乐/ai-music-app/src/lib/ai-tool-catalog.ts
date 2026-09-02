export const AI_TOOLS = ["chat", "code", "image", "music", "music_query", "vision"] as const;

export type AiTool = (typeof AI_TOOLS)[number];

export const AI_TOOL_CATALOG: Record<AiTool, { name: string; description: string; category: string; routePath: string; color: string }> = {
  chat: { name: "文本对话", description: "围绕学习任务进行文本创作与交流。", category: "文本创作", routePath: "/tools/ai-reading", color: "#07111f" },
  code: { name: "AI 编程", description: "对话式生成可运行的网页作品。", category: "编程创作", routePath: "/tools/ai-programming", color: "#07111f" },
  image: { name: "AI 绘画", description: "用文字和参考图把想象变成视觉作品。", category: "视觉创作", routePath: "/tools/ai-art", color: "#caf204" },
  music: { name: "AI 音乐", description: "从节奏、音高和旋律开始，完成一首作品。", category: "音乐创作", routePath: "/tools/ai-music", color: "#005bb3" },
  music_query: { name: "音乐查询", description: "查询并管理 AI 音乐生成结果。", category: "音乐创作", routePath: "/tools/ai-music", color: "#005bb3" },
  vision: { name: "AI 阅读与视觉", description: "边读边问边画，做一份自己的绘本。", category: "阅读创作", routePath: "/tools/ai-reading", color: "#ffffff" },
};

export function isAiTool(value: string): value is AiTool {
  return (AI_TOOLS as readonly string[]).includes(value);
}
