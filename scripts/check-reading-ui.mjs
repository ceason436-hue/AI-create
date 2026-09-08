import { chromium } from "playwright";

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.KRT_REVIEW_BROWSER || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
});
const page = await browser.newPage({ viewport: { width: 1672, height: 941 } });

try {
  await page.goto("http://localhost:3000/tools/ai-reading", { waitUntil: "networkidle" });
  await page.getByText("植物妈妈有办法", { exact: true }).first().waitFor();
  if (await page.getByText("画面拆分预览", { exact: false }).count()) throw new Error("课程预览仍显示已移除的画面拆分预览");

  await page.getByRole("button", { name: "联网查找" }).first().click();
  await page.getByRole("button", { name: "开始 AI 智能拆分" }).waitFor();
  const alternativeTop = await page.locator("details").filter({ hasText: "其他方式获取课文" }).evaluate((element) => element.getBoundingClientRect().top);
  if (alternativeTop > page.viewportSize().height) throw new Error("备用课文入口没有自动滚动到可视区");

  await page.getByText("植物妈妈有办法", { exact: true }).first().click();
  await page.getByRole("button", { name: "开始绘本创作" }).click();
  await page.waitForURL("**/tools/ai-reading/result");
  await page.getByText("AI 老师引导", { exact: true }).waitFor();
  const defaultStyleCount = await page.locator('[class*="styles"] > button').count();
  if (defaultStyleCount !== 6) throw new Error(`默认画风应为 5 个加展开按钮，实际为 ${defaultStyleCount}`);
  await page.getByRole("button", { name: "展开全部" }).click();
  const expandedStyleCount = await page.locator('[class*="styles"] > button').count();
  if (expandedStyleCount !== 13) throw new Error(`展开后应为 12 个画风加收起按钮，实际为 ${expandedStyleCount}`);
  const storyboardVisible = await page.getByText(/连续绘本场景/).isVisible();
  if (!storyboardVisible) throw new Error("分段画面工作条不可见");

  await page.goto("http://localhost:3000/tools/ai-reading", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "创作记录" }).click();
  await page.getByRole("heading", { name: "植物妈妈有办法" }).waitFor();
  await page.getByRole("button", { name: "导出绘本" }).waitFor();
  console.log("AI reading UI check passed");
} finally {
  await browser.close();
}
