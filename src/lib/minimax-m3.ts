type LegacyMessage = { role: "system" | "user" | "assistant"; content: string };

export const MINIMAX_M3_MODEL = "MiniMax-M3";

export function minimaxM3Url() {
  return `${(process.env.MINIMAX_ANTHROPIC_BASE_URL || "https://api.minimaxi.com/anthropic").replace(/\/$/, "")}/v1/messages`;
}

export function minimaxM3Headers() {
  const apiKey = process.env.MINIMAX_API_KEY;
  return {
    "x-api-key": apiKey || "",
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  };
}

export function toM3Payload(messages: LegacyMessage[], options: { stream?: boolean; maxTokens?: number; temperature?: number; thinking?: "disabled" | "adaptive" } = {}) {
  const system = messages.filter((message) => message.role === "system").map((message) => message.content).join("\n\n");
  const conversation = messages.filter((message) => message.role !== "system").map((message) => ({
    role: message.role,
    content: [{ type: "text", text: message.content }],
  }));
  return {
    model: MINIMAX_M3_MODEL,
    max_tokens: options.maxTokens ?? 2048,
    temperature: options.temperature ?? 0.7,
    ...(system ? { system } : {}),
    messages: conversation,
    ...(options.stream ? { stream: true } : {}),
    thinking: { type: options.thinking ?? "disabled" },
  };
}

export function extractM3Text(body: unknown) {
  if (!body || typeof body !== "object") return "";
  const content = (body as { content?: unknown }).content;
  if (!Array.isArray(content)) return "";
  return content.flatMap((block) => {
    if (!block || typeof block !== "object") return [];
    const item = block as { type?: unknown; text?: unknown };
    return item.type === "text" && typeof item.text === "string" ? [item.text] : [];
  }).join("").trim();
}
