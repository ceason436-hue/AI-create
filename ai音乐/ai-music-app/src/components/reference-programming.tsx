"use client";

import { useMemo, useState } from "react";
import {
  Bot,
  Box,
  Braces,
  Check,
  Clock3,
  Code2,
  FileText,
  Footprints,
  Lightbulb,
  MonitorPlay,
  Play,
  RefreshCw,
  Save,
  Square,
  Star,
  Terminal,
  TriangleAlert,
  Undo2,
  Wrench,
} from "lucide-react";
import s from "./reference-programming.module.css";
import { getBrowserToolStorage } from "@/lib/browser-tool-storage";
import { useToolSession } from "@/lib/use-tool-session";

const snippets = {
  HTML: [
    "<!doctype html>",
    '<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>机器人迷宫</title></head>',
    '<body><main><h1>机器人迷宫</h1><p>点击按钮开始探索。</p><button id="start">开始</button><p id="status"></p></main>',
    "<script>document.querySelector('#start').onclick=()=>{document.querySelector('#status').textContent='机器人开始探索！'}</script>",
    "</body></html>",
  ],
};

function Flow() {
  return (
    <svg
      className={s.flow}
      viewBox="0 0 250 310"
      role="img"
      aria-label="机器人寻路逻辑流程图"
    >
      <g fill="none" stroke="#19314f" strokeWidth="1.5">
        <path d="M125 42v28M125 125v32M125 213v35M64 184H25v64M38 284v16h170V98h-25M125 284v16h83" />
        <path d="M125 125h88v58" />
      </g>
      <g fontFamily="Microsoft YaHei" textAnchor="middle">
        <rect
          x="87"
          y="8"
          width="76"
          height="36"
          rx="12"
          fill="#e8f3ff"
          stroke="#1262dd"
        />
        <text x="125" y="31">
          开始
        </text>
        <path d="M125 70l58 28-58 28-58-28z" fill="#e8f9e9" stroke="#19933a" />
        <text x="125" y="102">
          是否到达目标?
        </text>
        <path d="M125 157l53 28-53 28-53-28z" fill="#fff1e7" stroke="#f26a16" />
        <text x="125" y="189">
          前方可前进?
        </text>
        <rect
          x="80"
          y="248"
          width="90"
          height="36"
          rx="8"
          fill="#edf5ff"
          stroke="#1262dd"
        />
        <text x="125" y="271">
          前进一步
        </text>
        <rect
          x="1"
          y="248"
          width="75"
          height="36"
          rx="8"
          fill="#fff6e7"
          stroke="#f27d18"
        />
        <text x="38" y="271">
          转向（右转）
        </text>
        <rect
          x="178"
          y="165"
          width="62"
          height="36"
          rx="12"
          fill="#e8f9e9"
          stroke="#19933a"
        />
        <text x="209" y="188">
          结束
        </text>
        <text x="198" y="91">
          是
        </text>
        <text x="137" y="145">
          否
        </text>
        <text x="189" y="177">
          是
        </text>
        <text x="43" y="176">
          否
        </text>
      </g>
    </svg>
  );
}

type RunState = "ready" | "success" | "error";
type SavedWork = {
  language: keyof typeof snippets;
  source: string;
  savedAt: number;
};
type StableCodePayload = {
  status?: unknown;
  result?: {
    kind?: unknown;
    preview?: { language?: unknown; source?: unknown };
  };
  error?: unknown;
  code?: unknown;
  requestId?: unknown;
};
function payloadError(
  payload: StableCodePayload | null,
  fallback: string,
  requestId: string | null,
) {
  const message = typeof payload?.error === "string" ? payload.error : fallback,
    code = typeof payload?.code === "string" ? ` [${payload.code}]` : "",
    trace = requestId ? ` （请求编号：${requestId}）` : "";
  return `${message}${code}${trace}`;
}

export function ReferenceProgramming() {
  const toolSession = useToolSession(),
    storageIdentity = toolSession.storageIdentity,
    personal = storageIdentity === "PERSONAL";
  const initialDrafts = Object.fromEntries(
    Object.entries(snippets).map(([key, value]) => [key, value.join("\n")]),
  ) as Record<keyof typeof snippets, string>;
  const [language, setLanguage] = useState<keyof typeof snippets>("HTML"),
    [drafts, setDrafts] = useState(initialDrafts),
    [runState, setRunState] = useState<RunState>("ready"),
    [tab, setTab] = useState<"运行结果" | "逻辑流程" | "历史作品">("运行结果"),
    [notice, setNotice] = useState(""),
    [history, setHistory] = useState<SavedWork[]>([]),
    [busy, setBusy] = useState(false),
    [requestId, setRequestId] = useState<string>();
  const source = drafts[language],
    lines = source.split("\n"),
    ran = runState === "success";
  function loadHistory() {
    if (!toolSession.verified) return setNotice("正在验证会话，请稍后重试。");
    try {
      const parsed =
        getBrowserToolStorage("ai-programming", storageIdentity).get<
          SavedWork[]
        >("works") ?? [];
      if (Array.isArray(parsed)) setHistory(parsed);
    } catch {
      setHistory([]);
    }
  }
  const consoleLines = useMemo(
    () =>
      ran
        ? [
            "AI 已返回真实 HTML 代码。",
            "预览在受限 sandbox iframe 中运行；它不能访问本站 Cookie 或同源存储。",
          ]
        : runState === "error"
          ? ["生成或解析失败。", "请根据错误提示修改需求后重试。"]
          : ["尚未调用 AI。", "点击“AI 生成并预览”后才会产生新代码。"],
    [ran, runState],
  );
  async function run() {
    setBusy(true);
    setRunState("ready");
    setNotice("");
    try {
      const response = await fetch("/api/minimax/code", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": crypto.randomUUID(),
          },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: `请基于下面的 HTML 完成一个可交互、适合青少年的机器人迷宫网页。保留单文件 HTML，交互必须真实可运行。\n\n${source}`,
              },
            ],
          }),
        }),
        data = (await response
          .json()
          .catch(() => null)) as StableCodePayload | null,
        trace =
          response.headers.get("x-ai-request-id") ||
          (typeof data?.requestId === "string" ? data.requestId : null),
        preview =
          data?.result?.kind === "CODE" ? data.result.preview : undefined;
      if (!response.ok)
        throw new Error(payloadError(data, "AI 代码生成失败。", trace));
      if (
        data?.status !== "SUCCEEDED" ||
        preview?.language !== "html" ||
        typeof preview.source !== "string" ||
        !preview.source.trim()
      )
        throw new Error(
          payloadError(data, "AI 代码服务返回了无效结果。", trace),
        );
      const html = preview.source.trim();
      if (!html.toLowerCase().includes("<html"))
        throw new Error(payloadError(data, "AI 未返回可预览的 HTML。", trace));
      setDrafts({ ...drafts, HTML: html });
      setRequestId(trace || undefined);
      setRunState("success");
      setTab("运行结果");
      setNotice(
        `真实 AI 代码已生成，并在受限预览中运行。${trace ? ` 请求编号：${trace}` : ""}`,
      );
    } catch (error) {
      setRunState("error");
      setNotice(
        error instanceof Error
          ? error.message
          : "AI 代码生成失败，请稍后重试。",
      );
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (!toolSession.verified) {
      setNotice("正在验证会话，请稍后重试。");
      return;
    }
    const work = { language, source, savedAt: Date.now() };
    if (personal) {
      try {
        const bytes = new TextEncoder().encode(source),
          binary = Array.from(bytes, (b) => String.fromCharCode(b)).join(""),
          response = await fetch("/api/works", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(requestId ? { "x-ai-request-id": requestId } : {}),
            },
            body: JSON.stringify({
              type: "CODE",
              title: "机器人迷宫 HTML",
              mimeType: "text/html",
              contentBase64: btoa(binary),
            }),
          }),
          data = await response.json();
        if (!response.ok) throw new Error(data.error || "云端保存失败");
        getBrowserToolStorage("ai-programming", storageIdentity).remove(
          "works",
        );
        setHistory([]);
        setNotice(`作品已保存到个人云端作品库（${data.work.id}）。`);
        return;
      } catch (error) {
        setNotice(
          `${error instanceof Error ? error.message : "云端保存失败"}，请重试；当前草稿未丢失。`,
        );
        return;
      }
    }
    let stored: SavedWork[] = [];
    try {
      const parsed =
        getBrowserToolStorage("ai-programming", storageIdentity).get<
          SavedWork[]
        >("works") ?? [];
      if (Array.isArray(parsed)) stored = parsed;
    } catch {}
    const next = [
      work,
      ...stored.filter((item) => item && typeof item.savedAt === "number"),
    ].slice(0, 8);
    setHistory(next);
    getBrowserToolStorage("ai-programming", storageIdentity).set("works", next);
    const blob = new Blob([source], { type: "text/html" }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "机器人迷宫.html";
    a.click();
    URL.revokeObjectURL(url);
    setNotice("作品已保存到当前临时工作空间，并下载 HTML 文件。");
  }
  return (
    <main className={s.page} aria-label="AI编程工作台">
      <div className={s.workspace}>
        <section className={s.left}>
          <header>
            <FileText />
            <h1>任务与代码工作区</h1>
          </header>
          <div className={s.task}>
            <h2>
              <i />
              任务描述
            </h2>
            <div className={s.taskBody}>
              <div>
                <p>
                  机器人从起点出发，需要到达目标位置（★）。地图中有墙壁（灰色格子）和陷阱（▲）。
                </p>
                <p>
                  机器人每次只能向上、下、左、右移动一格，不能越界或进入墙壁与陷阱。
                </p>
                <p>请编写程序，帮助机器人安全到达目标位置。</p>
              </div>
              <aside>
                <span>
                  <Bot />
                  起点
                </span>
                <span>
                  <Star />
                  目标
                </span>
                <span>
                  <Square />
                  墙壁
                </span>
                <span>
                  <TriangleAlert />
                  陷阱
                </span>
              </aside>
            </div>
          </div>
          <div className={s.codeArea}>
            <div className={s.languages}>
              <strong>
                <i />
                编程语言
              </strong>
              {(Object.keys(snippets) as (keyof typeof snippets)[]).map((k) => (
                <button
                  key={k}
                  onClick={() => {
                    setLanguage(k);
                    setRunState("ready");
                  }}
                  className={language === k ? s.active : ""}
                >
                  {k}
                </button>
              ))}
            </div>
            <div className={s.editor}>
              <div className={s.editorTools}>
                <Undo2 />
                <span>↪</span>
                <Braces />
              </div>
              <div className={s.editBody}>
                <div className={s.lineNumbers}>
                  {lines.map((_, i) => (
                    <span key={i}>{i + 1}</span>
                  ))}
                </div>
                <textarea
                  aria-label={`${language}代码`}
                  value={source}
                  spellCheck={false}
                  onChange={(e) => {
                    setDrafts({ ...drafts, [language]: e.target.value });
                    setRunState("ready");
                  }}
                />
              </div>
              <footer className={runState === "error" ? s.invalid : ""}>
                {runState === "error" ? <TriangleAlert /> : <Check />}
                {runState === "error"
                  ? "语法检查未通过"
                  : runState === "success"
                    ? "语法检查通过"
                    : "等待运行检查"}
                <span>行 {lines.length}，列 10</span>
              </footer>
            </div>
            <div className={s.leftActions}>
              <button
                onClick={() =>
                  setNotice(
                    "代码通过循环判断前方是否可通行；可通行时移动，受阻时转向。",
                  )
                }
              >
                <FileText />
                代码解释
              </button>
              <button
                onClick={() =>
                  setNotice(
                    runState === "error"
                      ? "请检查循环、移动和转向三个步骤是否齐全。"
                      : "可尝试减少转向次数，并在每次移动前检查边界。",
                  )
                }
              >
                <Lightbulb />
                调试建议
              </button>
              <button className={s.run} disabled={busy} onClick={run}>
                <Play fill="currentColor" />
                {busy ? "AI 生成中…" : "AI 生成并预览"}
              </button>
            </div>
          </div>
        </section>
        <section className={s.right}>
          <header>
            <MonitorPlay />
            <h1>运行与结果工作区</h1>
          </header>
          <div className={s.result}>
            <div className={s.tabs}>
              {(["运行结果", "逻辑流程", "历史作品"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    if (t === "历史作品") loadHistory();
                    setTab(t);
                  }}
                  className={tab === t ? s.active : ""}
                >
                  {t}
                </button>
              ))}
            </div>
            {tab === "运行结果" ? (
              <>
                <div className={s.visual}>
                  <div className={s.mapPanel}>
                    <div className={s.badges}>
                      <b>来源：{ran ? "真实 AI 响应" : "当前草稿"}</b>
                      <strong>
                        状态：
                        {ran
                          ? "受限预览"
                          : runState === "error"
                            ? "生成失败"
                            : "未生成"}
                      </strong>
                    </div>
                    <iframe
                      title="生成网页受限预览"
                      sandbox="allow-scripts"
                      srcDoc={source}
                      style={{
                        width: "100%",
                        minHeight: 250,
                        border: "1px solid #d8e0ea",
                        borderRadius: 12,
                        background: "white",
                      }}
                    />
                    <aside>
                      <h3>运行信息</h3>
                      <p>
                        <Bot />
                        起点：(1,1)
                      </p>
                      <p>
                        <Star />
                        目标：(5,7)
                      </p>
                      <p>
                        <Clock3 />
                        执行环境：浏览器 sandbox
                      </p>
                      <p>
                        <Footprints />
                        源码行数：{lines.length}
                      </p>
                      <p>
                        <Check />
                        AI 响应：{ran ? "已验证 HTML" : "—"}
                      </p>
                    </aside>
                  </div>
                  <div className={s.flowPanel}>
                    <h3>逻辑流程（简图）</h3>
                    <Flow />
                  </div>
                </div>
                <div className={s.feedback}>
                  <div>
                    <h3>控制台输出</h3>
                    <pre>
                      {consoleLines.map((x, i) => (
                        <span className={ran && i > 9 ? s.good : ""} key={i}>
                          {x}
                        </span>
                      ))}
                    </pre>
                  </div>
                  <div>
                    <h3>错误解释 / 调试提示</h3>
                    <article>
                      <strong>
                        {ran ? <Check /> : <TriangleAlert />}
                        {ran
                          ? "运行成功"
                          : runState === "error"
                            ? "需要修改代码"
                            : "等待运行"}
                      </strong>
                      <p>
                        {ran
                          ? "HTML 已通过基础结构检查，并加载到隔离预览。"
                          : runState === "error"
                            ? "AI 请求失败或返回内容不是有效 HTML。"
                            : "点击生成后会调用真实 AI 服务，不会显示固定成功结果。"}
                      </p>
                      <p>
                        {ran
                          ? "请在预览中实际点击交互控件验收。"
                          : "检查提示词、网络与服务开关后重试。"}
                      </p>
                      <p>生成页面只在 sandbox 中运行，无法读取本站 Cookie。</p>
                    </article>
                  </div>
                </div>
              </>
            ) : tab === "逻辑流程" ? (
              <div className={s.singleFlow}>
                <Flow />
                <div>
                  <h2>寻路逻辑</h2>
                  <p>
                    先判断是否到达目标，再检查前方能否前进。遇到阻挡时转向并返回判断，直到找到安全路径。
                  </p>
                </div>
              </div>
            ) : (
              <div className={s.history}>
                <Code2 />
                <h2>机器人迷宫作品</h2>
                {history.length ? (
                  history.map((item, i) => (
                    <button
                      key={item.savedAt}
                      onClick={() => {
                        setLanguage(item.language);
                        setDrafts({ ...drafts, [item.language]: item.source });
                        setRunState("ready");
                        setTab("运行结果");
                      }}
                    >
                      第 {i + 1} 个作品 · {item.language} ·{" "}
                      {new Date(item.savedAt).toLocaleString()}
                    </button>
                  ))
                ) : (
                  <p>尚未保存作品。运行并保存后会出现在这里。</p>
                )}
              </div>
            )}
            <div className={s.resultActions}>
              <button onClick={() => setRunState("ready")}>
                <RefreshCw />
                重置地图
              </button>
              <button
                onClick={() =>
                  setNotice(
                    "当前仅承诺单文件 HTML 的真实浏览器预览；未宣称提供 Python、C++ 或 Scratch 运行时。",
                  )
                }
              >
                <Terminal />
                运行边界
              </button>
              <button className={s.save} onClick={save}>
                <Save />
                保存作品
              </button>
            </div>
          </div>
        </section>
      </div>
      {notice && (
        <div className={s.notice} role="status">
          {notice}
          <button onClick={() => setNotice("")}>关闭</button>
        </div>
      )}
      <section className={s.process}>
        {[
          { icon: Box, title: "拆解问题", copy: "理解题意，明确目标与规则" },
          { icon: Code2, title: "编写步骤", copy: "设计逻辑，编写程序步骤" },
          {
            icon: MonitorPlay,
            title: "运行观察",
            copy: "运行程序，观察执行结果",
          },
          { icon: Wrench, title: "调试改进", copy: "分析问题，优化逻辑与代码" },
        ].map(({ icon: Icon, title, copy }, i) => (
          <article key={title}>
            <b>{i + 1}</b>
            <Icon />
            <div>
              <h2>{title}</h2>
              <p>{copy}</p>
            </div>
            {i < 3 && <span>╌╌╌╌╌</span>}
          </article>
        ))}
      </section>
    </main>
  );
}
