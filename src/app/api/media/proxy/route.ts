import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function isPrivateHost(hostname: string) {
  const host = hostname.toLowerCase();
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host === "[::1]" ||
    host === "169.254.169.254" ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  );
}

export async function GET(request: Request) {
  const rawUrl = new URL(request.url).searchParams.get("url");
  if (!rawUrl) return NextResponse.json({ error: "缺少图片地址。" }, { status: 400 });

  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "图片地址无效。" }, { status: 400 });
  }
  if (target.protocol !== "https:" || isPrivateHost(target.hostname)) {
    return NextResponse.json({ error: "不支持代理该图片地址。" }, { status: 400 });
  }

  try {
    const response = await fetch(target, {
      headers: { Accept: "image/*" },
      cache: "no-store",
    });
    if (!response.ok) return NextResponse.json({ error: "图片读取失败。" }, { status: 502 });
    const contentType = response.headers.get("content-type")?.split(";")[0] || "";
    const contentLength = Number(response.headers.get("content-length") || 0);
    if (!contentType.startsWith("image/") || contentLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "图片格式或大小不受支持。" }, { status: 415 });
    }
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "图片过大。" }, { status: 413 });
    }
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch {
    return NextResponse.json({ error: "图片读取失败。" }, { status: 502 });
  }
}
