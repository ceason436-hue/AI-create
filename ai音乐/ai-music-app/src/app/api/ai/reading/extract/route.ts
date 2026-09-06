import * as mammoth from "mammoth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_BYTES = 50 * 1024 * 1024;
const MAX_CHARACTERS = 50_000;

function extension(name: string) {
  return name.toLowerCase().match(/\.(txt|md|docx|doc)$/)?.[1] ?? "";
}

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "请选择阅读文件。", code: "INVALID_INPUT" }, { status: 400 });
  if (file.size <= 0 || file.size > MAX_FILE_BYTES) return NextResponse.json({ error: "文件必须小于或等于 50 MiB。", code: "FILE_TOO_LARGE" }, { status: 413 });
  const kind = extension(file.name);
  if (kind === "doc") return NextResponse.json({ error: "旧版 DOC 需要 LibreOffice Worker；当前环境未就绪，请转换为 DOCX、TXT 或 MD。", code: "WORKER_UNAVAILABLE" }, { status: 503 });
  if (!(["txt", "md", "docx"] as string[]).includes(kind)) return NextResponse.json({ error: "仅支持 TXT、MD 或 DOCX 文件。", code: "UNSUPPORTED_FORMAT" }, { status: 415 });

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const raw = kind === "docx" ? (await mammoth.extractRawText({ buffer })).value : buffer.toString("utf8");
    const text = raw.replace(/\u0000/g, "").trim();
    if (!text || !/[\u3400-\u9fff]/.test(text)) return NextResponse.json({ error: "文件没有提取到中文正文。", code: "INVALID_CONTENT" }, { status: 422 });
    if (text.length > MAX_CHARACTERS) return NextResponse.json({ error: "提取后的正文不能超过 50,000 个字符。", code: "CONTENT_TOO_LARGE" }, { status: 413 });
    return NextResponse.json({ text, characters: text.length, format: kind.toUpperCase() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "文件解析失败，请确认文件未损坏。", code: "EXTRACTION_FAILED" }, { status: 422 });
  }
}
