import { expect, test } from "@playwright/test";

test("unauthenticated visitors are stopped before the admin shell renders", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login\?mode=admin/);
  await expect(page.locator("body")).not.toContainText("运营管理后台");
});

test("protected APIs reject an unauthenticated browser", async ({ request }) => {
  for (const path of ["/api/works", "/api/admin/accounts", "/api/admin/courses"]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(401);
  }
});

test("learning and work areas expose honest unauthenticated states", async ({ page }) => {
  await page.goto("/learn");
  await expect(page.getByRole("heading", { name: "登录后开始学习" })).toBeVisible();

  await page.goto("/my-works");
  await expect(page).toHaveURL(/\/login\?mode=personal/);
});
