export type ProgrammingContextMessage = {
  role: "user" | "assistant";
  content: string;
};

export const PROGRAMMING_CONTEXT_LIMIT = 256_000;
export const PROGRAMMING_CONTEXT_TARGET = 196_000;

export function estimateProgrammingTokens(value: string) {
  let ascii = 0;
  let nonAscii = 0;
  for (const character of value) {
    if (character.codePointAt(0)! <= 0x7f) ascii += 1;
    else nonAscii += 1;
  }
  return nonAscii + Math.ceil(ascii / 4);
}

function compactLine(message: ProgrammingContextMessage) {
  const normalized = message.content.replace(/\s+/g, " ").trim();
  const excerpt = normalized.length > 800 ? `${normalized.slice(0, 800)}…` : normalized;
  return `${message.role === "user" ? "用户要求" : "Agent 进展"}：${excerpt}`;
}

export function prepareProgrammingContext(input: {
  messages: ProgrammingContextMessage[];
  currentSource: string;
  summary?: string;
  limit?: number;
  target?: number;
}) {
  const limit = input.limit ?? PROGRAMMING_CONTEXT_LIMIT;
  const target = Math.min(input.target ?? PROGRAMMING_CONTEXT_TARGET, limit);
  const currentSummary = input.summary?.trim() ?? "";
  const totalTokens = estimateProgrammingTokens([
    currentSummary,
    input.currentSource,
    ...input.messages.map((message) => message.content),
  ].join("\n"));

  if (totalTokens <= limit) {
    return { messages: input.messages, summary: currentSummary, compacted: false, estimatedTokens: totalTokens };
  }

  const kept: ProgrammingContextMessage[] = [];
  let keptTokens = estimateProgrammingTokens(input.currentSource);
  for (let index = input.messages.length - 1; index >= 0; index -= 1) {
    const message = input.messages[index];
    const tokens = estimateProgrammingTokens(message.content);
    const ceiling = kept.length === 0 ? limit : target;
    if (kept.length >= 12 || keptTokens + tokens > ceiling) break;
    kept.unshift(message);
    keptTokens += tokens;
  }

  const older = input.messages.slice(0, input.messages.length - kept.length);
  const summaryBudget = Math.max(0, target - estimateProgrammingTokens(input.currentSource) - estimateProgrammingTokens(kept.map((item) => item.content).join("\n")));
  const prioritized = older.length
    ? [
        ...older.filter((message) => message.role === "user").reverse(),
        ...older.filter((message) => message.role === "assistant").reverse(),
      ].map(compactLine)
    : [currentSummary].filter(Boolean);
  const summaryParts: string[] = [];
  let summaryTokens = 0;
  for (const candidate of prioritized) {
    const candidateTokens = estimateProgrammingTokens(candidate);
    if (summaryTokens + candidateTokens > summaryBudget) {
      if (!summaryParts.length && summaryBudget > 0) summaryParts.push(candidate.slice(0, summaryBudget * 2));
      break;
    }
    summaryParts.unshift(candidate);
    summaryTokens += candidateTokens;
  }
  const summary = summaryParts.join("\n");

  return {
    messages: kept,
    summary: summary.trim(),
    compacted: true,
    estimatedTokens: estimateProgrammingTokens([summary, input.currentSource, ...kept.map((item) => item.content)].join("\n")),
  };
}
