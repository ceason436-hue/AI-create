import { timingSafeEqual } from "crypto";
import { requireAdminResponse } from "@/lib/admin-access";
import { serviceUnavailable } from "@/lib/http";
import { processNextMediaJob } from "@/lib/media-processor";

export const runtime = "nodejs";
export const maxDuration = 900;

function hasWorkerToken(request: Request) {
  const expected = process.env.MEDIA_WORKER_TOKEN?.trim();
  const actual = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!expected || !actual) return false;
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}

export async function POST(request: Request) {
  if (!hasWorkerToken(request)) {
    const access = await requireAdminResponse();
    if ("response" in access) return access.response;
  }
  try {
    return Response.json(await processNextMediaJob(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return serviceUnavailable("媒体处理队列暂不可用，请检查数据库、存储服务和 FFmpeg。 ");
  }
}
