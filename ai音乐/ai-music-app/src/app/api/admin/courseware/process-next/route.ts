import { timingSafeEqual } from "crypto";
import { requireAdminResponse } from "@/lib/admin-access";
import { processNextCoursewareJob } from "@/lib/courseware-processor";
import { serviceUnavailable } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 300;

function hasWorkerToken(request: Request) {
  const expected = process.env.COURSEWARE_WORKER_TOKEN?.trim();
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
    return Response.json(await processNextCoursewareJob(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return serviceUnavailable("课件处理队列暂不可用，请检查数据库和存储服务。");
  }
}
