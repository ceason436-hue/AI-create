import { expect, test } from "@playwright/test";

const publicPages = [
  { path: "/", heading: /让孩子在真实创造中/ },
  { path: "/courses", heading: /从兴趣出发，把知识做成作品/ },
  { path: "/tools", heading: /把想法变成/ },
  { path: "/login", heading: /进入学校课堂/ },
  { path: "/register", heading: /注册|创建/ },
  { path: "/consult", heading: /咨询|课程/ },
] as const;

for (const item of publicPages) {
  test(`${item.path} renders its production page`, async ({ page }) => {
    const response = await page.goto(item.path, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1").first()).toContainText(item.heading);
    await expect(page.locator("body")).not.toContainText("Application error");

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(8);
  });
}

test("the four governed creation tools have reachable public workspaces", async ({ page }) => {
  for (const path of ["/tools/ai-art", "/tools/ai-music", "/tools/ai-programming", "/tools/ai-reading"]) {
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response?.status(), path).toBe(200);
    await expect(page.locator("main").first(), path).toBeVisible();
    await expect(page.locator("body"), path).not.toContainText("Application error");
  }
});

test("known static course slugs redirect permanently without capturing database courses", async ({ page, request }) => {
  const legacy = await request.get("/courses/programming", { maxRedirects: 0 });
  expect(legacy.status()).toBe(308);
  expect(legacy.headers().location).toBe("/courses/directions/programming");

  const response = await page.goto("/courses/directions/programming");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "编程", exact: true })).toBeVisible();
});
