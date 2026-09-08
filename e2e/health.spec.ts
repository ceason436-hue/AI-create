import { expect, test } from "@playwright/test";

test("liveness endpoint responds without caching", async ({ request }) => {
  const response = await request.get("/api/health/live");
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toContain("no-store");
  await expect(response.json()).resolves.toEqual({ status: "ok" });
});

test("readiness reports every dependency and can enforce a fully ready environment", async ({ request }) => {
  test.skip(process.env.KRT_EXPECT_READY !== "true", "Readiness requires the complete database, Redis and storage acceptance stack.");
  const response = await request.get("/api/health/ready");
  const body = await response.json() as { status?: string; checks?: Record<string, unknown> };

  expect(response.status(), JSON.stringify(body)).toBe(200);
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(body.status).toBe("ready");
  expect(body.checks).toEqual({ database: true, redis: true, storage: true });
});
