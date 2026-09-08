import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.KRT_REVIEW_BASE_URL || "http://localhost:3000";
const outputDir = path.resolve(".impeccable/review");
const now = Date.now();
const analysis = {
  analysis: {
    title: "植物妈妈有办法",
    summary: "课文介绍了蒲公英、苍耳和豌豆传播种子的办法。",
    keywords: ["旅行", "种子", "观察"],
    structure: [{ label: "植物传播种子的办法", segmentIndexes: [0, 1, 2, 3, 4, 5] }],
    segments: [
      {
        text: "孩子如果已经长大，就得告别妈妈，四海为家。牛马有脚，鸟有翅膀，植物旅行又用什么办法？",
        question: "植物要“旅行”是什么意思？你从哪些词语里发现了线索？",
        evidence: "孩子长大、告别妈妈、四海为家、植物旅行。",
        difficulty: "基础",
      },
      {
        text: "蒲公英妈妈准备了降落伞，把它送给自己的娃娃。只要有风轻轻吹过，孩子们就乘着风纷纷出发。",
        question: "哪些动作最能表现蒲公英种子出发的样子？",
        evidence: "降落伞、轻轻吹过、乘着风、纷纷出发。",
        difficulty: "基础",
      },
      {
        text: "苍耳妈妈有个好办法，她给孩子穿上带刺的铠甲。只要挂住动物的皮毛，孩子们就能去田野、山洼。",
        question: "苍耳借助了谁的力量去远方？",
        evidence: "带刺的铠甲、挂住动物的皮毛。",
        difficulty: "进阶",
      },
      {
        text: "植物妈妈的办法很多很多，不信你就仔细观察。那里有许许多多的知识，粗心的小朋友却得不到它。",
        question: "结尾为什么提醒我们要仔细观察？",
        evidence: "办法很多、仔细观察、许多知识。",
        difficulty: "进阶",
      },
      {
        text: "豌豆妈妈让豆荚晒在太阳底下，啪的一声，豆荚炸开，孩子们蹦着跳着离开妈妈。",
        question: "豌豆种子离开妈妈时，画面中最有力量的动作是什么？",
        evidence: "太阳晒、豆荚炸开、蹦着跳着。",
        difficulty: "进阶",
      },
      {
        text: "只要我们留心观察，就会发现大自然还藏着许多奇妙的办法。",
        question: "读完课文，你还想去观察哪一种植物？为什么？",
        evidence: "留心观察、大自然、奇妙的办法。",
        difficulty: "挑战",
      },
    ],
  },
  requestId: "review-preview",
};
const storageKey = "krt:tool-storage:v1:ANONYMOUS:EPHEMERAL:ai-reading:analysis";

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.KRT_REVIEW_BROWSER || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
});

async function capture(name, viewport, url, seed = false) {
  const context = await browser.newContext({ viewport });
  if (seed) {
    await context.addInitScript(({ key, record, createdAt }) => {
      sessionStorage.setItem(key, JSON.stringify({
        version: 1,
        createdAt,
        expiresAt: createdAt + 86_400_000,
        value: record,
      }));
    }, { key: storageKey, record: analysis, createdAt: now });
  }
  const page = await context.newPage();
  await page.goto(`${baseUrl}${url}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(outputDir, name), fullPage: false });
  await context.close();
}

await capture("reading-import-desktop.png", { width: 1672, height: 941 }, "/tools/ai-reading");
await capture("hero-repro.png", { width: 1672, height: 941 }, "/tools/ai-reading/result", true);
await capture("reading-mobile.png", { width: 598, height: 849 }, "/tools/ai-reading/result", true);
await browser.close();
