import { getRedis } from "@/lib/redis";

function requestIp(request: Request) {
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function enforceRateLimit(request: Request, scope: string, limit: number, windowSeconds: number) {
  try {
    const bucket = Math.floor(Date.now() / (windowSeconds * 1_000));
    const key = `krt:rate:${scope}:${requestIp(request)}:${bucket}`;
    const redis = await getRedis();
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, windowSeconds);
    return count <= limit;
  } catch {
    throw new Error("RATE_LIMIT_UNAVAILABLE");
  }
}
