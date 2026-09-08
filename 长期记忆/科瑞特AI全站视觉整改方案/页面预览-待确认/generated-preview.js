const pages = [
  ["home", "首页 · 母版扩展", "锁定母版方向 · 手册 P01 / P10 / P37–42 / P55–67", "01-首页-母版扩展-v1.png"],
  ["courses", "课程体系 · B 编辑式", "手册 P10–54 事实与课程结构参考", "02-课程体系-B编辑式-v1.png"],
  ["ai", "AI 创作空间 · 总览", "手册 P19–20 事实参考", "03-AI创作空间-总览-v1.png"],
  ["music", "AI 音乐 · 工作台", "手册 P19–20 教育内容 · 当前真实功能", "04-AI音乐工作台-v1.png"],
  ["paint", "AI 绘画 · 工作台", "手册 P19–20 教育内容 · 当前真实功能", "05-AI绘画工作台-v1.png"],
  ["code", "AI 编程 · 工作台", "手册 P11–15 / P19–20 · 当前真实功能", "06-AI编程工作台-v1.png"],
  ["read-import", "AI 阅读 · 导入与拆分", "现有导入、教案与智能拆分交互逻辑", "07A-AI阅读-导入与拆分-v2.png"],
  ["read-workspace", "AI 阅读 · 逐段绘本工作台", "现有逐段导读、画面提示与连续绘本交互逻辑", "07B-AI阅读-逐段绘本工作台-v2.png"],
  ["cooperation", "校园合作", "手册 P65–67 事实参考", "08-校园合作-v1.png"],
  ["events", "科创活动", "手册 P55–61 赛事事实参考", "09-科创活动-v1.png"],
  ["growth", "学员成长", "手册 P07–09 / P62–64 事实参考", "10-学员成长-v1.png"],
  ["consult", "课程咨询", "手册 P39–40 / P43–48 / P67 事实参考", "11-课程咨询-v1.png"],
  ["about", "走进科瑞特", "手册 P02–09 / P37–42 / P67 事实参考", "12-走进科瑞特-v1.png"],
  ["auth", "登录 / 注册", "锁定品牌方向 · 产品功能", "13-登录注册-v1.png"]
];

const nav = document.querySelector("#pageNav");
const pageSelect = document.querySelector("#pageSelect");
const artboard = document.querySelector("#artboard");
const title = document.querySelector("#pageTitle");
const source = document.querySelector("#pageSources");
const index = document.querySelector("#pageIndex");

pages.forEach((page, i) => {
  const button = document.createElement("button");
  button.innerHTML = `<span>${String(i + 1).padStart(2, "0")}</span><strong>${page[1]}</strong>`;
  button.addEventListener("click", () => showPage(i));
  nav.appendChild(button);

  const option = document.createElement("option");
  option.value = String(i);
  option.textContent = `${String(i + 1).padStart(2, "0")} · ${page[1]}`;
  pageSelect.appendChild(option);
});

function showPage(i) {
  const page = pages[i];
  title.textContent = page[1];
  source.textContent = page[2];
  index.textContent = `${String(i + 1).padStart(2, "0")} / ${String(pages.length).padStart(2, "0")}`;
  pageSelect.value = String(i);
  artboard.innerHTML = `<figure class="generated-figure"><img class="generated-preview" src="./生成效果图/${page[3]}" alt="${page[1]}生成效果图" /><figcaption>生成效果图 · 用于确认构图、信息密度、板块表现与媒体方向；正式实现将使用准确网页文字和交互组件。</figcaption></figure>`;
  nav.querySelectorAll("button").forEach((button, j) => button.classList.toggle("is-active", i === j));
  document.querySelector(".stage").scrollTo({ top: 0, behavior: "smooth" });
  history.replaceState(null, "", `#${page[0]}`);
}

pageSelect.addEventListener("change", event => showPage(Number(event.target.value)));

document.querySelectorAll(".viewport-switch button").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".viewport-switch button").forEach(b => b.classList.remove("is-active"));
    button.classList.add("is-active");
    artboard.classList.toggle("is-mobile", button.dataset.width === "mobile");
  });
});

const initial = Math.max(0, pages.findIndex(page => `#${page[0]}` === location.hash));
showPage(initial);
