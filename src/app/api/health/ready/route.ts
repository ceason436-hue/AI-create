import { db } from "@/lib/db";
import { getRedis } from "@/lib/redis";
import { isTemporaryDeployment } from "@/lib/temporary-deployment";

export async function GET() {
  if (isTemporaryDeployment()) {
    return Response.json({ status: "ready", mode: "temporary-no-database-no-oss", checks: { database: "disabled", redis: "disabled", storage: "browser-local" } }, { headers: { "Cache-Control": "no-store" } });
  }
  const checks = { database: false, redis: false, storage: false };
  try { await db.$queryRaw`SELECT 1`; checks.database = true; } catch { /* reported below */ }
  try { checks.redis = await getRedis().then((redis) => redis.ping()) === "PONG"; } catch { /* reported below */ }
  const driver = (process.env.STORAGE_DRIVER || "LOCAL").toUpperCase();
  checks.storage = driver === "LOCAL" || (driver === "OSS" && Boolean(process.env.OSS_BUCKET && process.env.OSS_ENDPOINT && process.env.OSS_ACCESS_KEY_ID && process.env.OSS_ACCESS_KEY_SECRET));
  const ready = Object.values(checks).every(Boolean);
  return Response.json({ status: ready ? "ready" : "not-ready", checks }, { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
