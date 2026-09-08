export function stripMinimaxThinking(content: string) {
  return content.replace(/<think>[\s\S]*?(<\/think>|$)/gi, "").trim();
}

export function extractMinimaxHtml(content: string) {
  const visible = stripMinimaxThinking(content);
  const fenced = visible.match(/```(?:html)?\s*([\s\S]*?)```/i)?.[1]?.trim();
  const candidate = fenced || visible;
  const doctypeStart = candidate.search(/<!doctype\s+html/i);
  const htmlStart = candidate.search(/<html[\s>]/i);
  const start = doctypeStart >= 0 ? doctypeStart : htmlStart;
  if (start < 0) return null;
  const html = candidate.slice(start).replace(/```\s*$/i, "").trim();
  return /<html[\s>]/i.test(html) ? html : null;
}

export function extractMinimaxJson(content: string) {
  const visible = stripMinimaxThinking(content);
  const fenced = visible.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ?? visible;
  const start = fenced.indexOf("{");
  const end = fenced.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("PROVIDER_INVALID_RESPONSE");
  return JSON.parse(fenced.slice(start, end + 1));
}

export function chunkReadingArticle(article: string, size = 8000) {
  if (!Number.isInteger(size) || size < 1) throw new Error("INVALID_CHUNK_SIZE");
  const chunks: string[] = [];
  for (let offset = 0; offset < article.length; offset += size) chunks.push(article.slice(offset, offset + size));
  return chunks;
}
