import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

type State = { invitationCode: string; expiredSessionToken: string; courseId: string; lessonId: string; accounts: Record<string, { loginIdentifier: string; password: string }> };
const state = JSON.parse(readFileSync("D:/.codex/AI-create/acceptance/acceptance-state.json", "utf8")) as State;
const adminGetPaths = ["/api/admin/accounts", "/api/admin/ai-tools", "/api/admin/course-categories", "/api/admin/courses", "/api/admin/media-slots", "/api/admin/site-pages"];

async function pageLogin(page: Page, mode: "admin" | "personal" | "school", key: string) {
  const account = state.accounts[key];
  await page.goto(`/login?mode=${mode}`);
  await page.getByLabel(mode === "admin" ? "管理员账号" : mode === "school" ? "学校账号" : "用户名").fill(account.loginIdentifier);
  await page.getByLabel("密码", { exact: true }).fill(account.password);
  await page.getByLabel(/我已阅读并同意/).check();
  const response = page.waitForResponse((item) => item.url().endsWith("/api/auth/login"));
  await page.getByRole("button", { name: "登录并继续" }).click();
  expect((await response).status()).toBe(200);
  await page.waitForURL(mode === "admin" ? /\/admin/ : /^http:\/\/127\.0\.0\.1:3001\/$/);
}

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Role mutation flow runs once against the shared synthetic dataset.");
});

test("admin, personal and school identities enforce distinct server permissions", async ({ page }) => {
  await pageLogin(page, "admin", "admin");
  for (const path of adminGetPaths) expect(await page.evaluate(async (url) => (await fetch(url)).status, path)).toBe(200);
  await page.evaluate(async () => fetch("/api/auth/logout", { method: "POST" }));

  await pageLogin(page, "personal", "personal");
  expect(await page.evaluate(async () => (await fetch("/api/works")).status)).toBe(200);
  for (const path of adminGetPaths) expect(await page.evaluate(async (url) => (await fetch(url)).status, path)).toBe(403);
  await page.evaluate(async () => fetch("/api/auth/logout", { method: "POST" }));

  await pageLogin(page, "school", "school");
  expect(await page.evaluate(async () => (await fetch("/api/works")).status)).toBe(403);
  for (const path of adminGetPaths) expect(await page.evaluate(async (url) => (await fetch(url)).status, path)).toBe(403);
});

test("suspended and wrong-mode accounts cannot create a session", async ({ request }) => {
  const suspended = state.accounts.suspended;
  expect((await request.post("/api/auth/login", { data: { mode: "personal", loginIdentifier: suspended.loginIdentifier, password: suspended.password } })).status()).toBe(403);
  const school = state.accounts.school;
  expect((await request.post("/api/auth/login", { data: { mode: "personal", loginIdentifier: school.loginIdentifier, password: school.password } })).status()).toBe(401);
});

test("expired sessions are rejected and do not expose account data", async ({ request }) => {
  const response = await request.get("/api/auth/session", { headers: { Cookie: `krt_session=${state.expiredSessionToken}` } });
  expect(response.status()).toBe(200);
  expect((await response.json()).account).toBeNull();
});

test("training invitation registration is transactional and immediately authenticated", async ({ request }) => {
  const candidate = state.accounts.trainingCandidate;
  const response = await request.post("/api/auth/register/training", { data: { loginIdentifier: candidate.loginIdentifier, password: candidate.password, displayName: "合成培训学员", invitationCode: state.invitationCode } });
  expect(response.status()).toBe(201);
  expect((await request.get("/api/auth/session")).status()).toBe(200);
});

test("personal learner sees the synthetic enrolled course and can persist progress", async ({ page }) => {
  await page.goto("/login?mode=personal");
  await page.getByLabel("用户名").fill(state.accounts.personal.loginIdentifier);
  await page.getByLabel("密码", { exact: true }).fill(state.accounts.personal.password);
  await page.getByLabel(/我已阅读并同意/).check();
  const loginResponse = page.waitForResponse((response) => response.url().endsWith("/api/auth/login"));
  await page.getByRole("button", { name: "登录并继续" }).click();
  expect((await loginResponse).status()).toBe(200);
  await page.goto("/learn");
  const courseHeading = page.getByRole("heading", { name: "AUTOMATED_SYNTHETIC_TEST_DATA 机器人项目课", exact: true });
  await expect(courseHeading).toBeVisible();
  await courseHeading.click();
  await expect(page.getByText(/AUTOMATED_SYNTHETIC_TEST_DATA 公告/)).toBeVisible();

  const progress = await page.evaluate(async ({ courseId, lessonId }) => {
    const response = await fetch(`/api/me/courses/${courseId}/lessons/${lessonId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true }),
    });
    return { status: response.status, body: await response.json() as { completed?: boolean; progressPercent?: number; error?: string } };
  }, { courseId: state.courseId, lessonId: state.lessonId });
  expect(progress.status, progress.body.error).toBe(200);
  expect(progress.body).toMatchObject({ completed: true, progressPercent: 100 });
});
