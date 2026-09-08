"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Bookmark,
  ChevronLeft,
  CircleHelp,
  FileSearch,
  Info,
  Upload,
} from "lucide-react";
import s from "./reference-reading-import.module.css";
import { getBrowserToolStorage } from "@/lib/browser-tool-storage";
import { useToolSession } from "@/lib/use-tool-session";

type ReadingPreset = {
  id: string;
  title: string;
  article: string;
  teacherGuide: string;
  coverImage: string;
  grade: number;
  semester: "FIRST" | "SECOND";
  publisher: string;
  summary: string;
  analysis?: unknown;
};

export function ReferenceReadingImport() {
  const toolSession = useToolSession(), storageIdentity = toolSession.storageIdentity, router = useRouter(),
    [title, setTitle] = useState("未命名"),
    [article, setArticle] = useState(""),
    [lesson, setLesson] = useState(""),
    [grade, setGrade] = useState(3),
    [presets, setPresets] = useState<ReadingPreset[]>([]),
    [presetNotice, setPresetNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    error = !article.trim();
  useEffect(() => {
    let active = true;
    fetch("/api/ai/reading/presets", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("presets unavailable")))
      .then((data: unknown) => {
        if (!active || !data || typeof data !== "object" || !Array.isArray((data as { presets?: unknown }).presets)) return;
        const next = (data as { presets: unknown[] }).presets.filter((item): item is ReadingPreset => {
          if (!item || typeof item !== "object") return false;
          const value = item as Record<string, unknown>;
          return typeof value.id === "string" && typeof value.title === "string" && typeof value.article === "string";
        });
        setPresets(next);
      })
      .catch(() => { if (active) setPresetNotice("预制课文暂时无法加载，可直接粘贴文章。"); });
    return () => { active = false; };
  }, []);

  function selectPreset(preset: ReadingPreset) {
    setTitle(preset.title);
    setArticle(preset.article);
    setLesson(preset.teacherGuide || "");
    setGrade(preset.grade || 3);
    setNotice(`已载入《${preset.title}》，可以直接开始绘本创作。`);
    if (preset.analysis) {
      getBrowserToolStorage("ai-reading", storageIdentity).set("analysis", { analysis: preset.analysis, requestId: null });
      router.push("/tools/ai-reading/result");
    }
  }
  async function start() {
    if (!toolSession.verified) return setNotice("正在验证会话，请稍后重试。");
    if (error) return;
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/ai/reading/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": crypto.randomUUID(),
          },
          body: JSON.stringify({
            title,
            article,
            grade,
            teacherGuide: lesson || undefined,
          }),
        }),
        data = await response.json();
      if (!response.ok) throw new Error(data.error || "阅读分析失败");
      getBrowserToolStorage("ai-reading", storageIdentity).set("analysis", {
        analysis: data.analysis,
        requestId: response.headers.get("x-ai-request-id"),
      });
      router.push("/tools/ai-reading/result");
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "阅读分析失败，请稍后重试。",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className={s.page}>
      <header>
        <button onClick={() => history.back()}>
          <ChevronLeft />
          返回
        </button>
        <strong>
          <BookOpen />
          科瑞特 AI
        </strong>
        <h1>AI 阅读与绘本创作</h1>
        <ol>
          {["导入文章", "智能拆分", "逐段阅读", "绘本创作"].map((x, i) => (
            <li className={i === 0 ? s.active : ""} key={x}>
              <b>{i + 1}</b>
              {x}
            </li>
          ))}
        </ol>
      </header>
      <section className={s.card}>
        <div className={s.form}>
          <h2>导入文章：{title}</h2>
          {presets.length > 0 && (
            <section className={s.presets} aria-label="预制课文">
              <div className={s.presetsHeading}>
                <h3>三年级上册预制课文</h3>
                <span>点击课文即可进入绘本创作</span>
              </div>
              <div className={s.presetGrid}>
                {presets.map((preset) => (
                  <button type="button" className={s.presetCard} key={preset.id} onClick={() => selectPreset(preset)}>
                    {preset.coverImage ? <img src={preset.coverImage} alt="" loading="lazy" decoding="async" /> : <span className={s.presetFallback}><BookOpen /></span>}
                    <span><strong>{preset.title}</strong><small>{preset.publisher || "语文课文"} · {preset.grade}年级{preset.semester === "FIRST" ? "上册" : "下册"}</small></span>
                  </button>
                ))}
              </div>
            </section>
          )}
          {presetNotice && <p className={s.presetNotice}>{presetNotice}</p>}
          <label>
            适用年级
            <select
              value={grade}
              onChange={(e) => setGrade(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6].map((value) => (
                <option key={value} value={value}>
                  {value} 年级
                </option>
              ))}
            </select>
          </label>
          <label>
            请在下方直接粘贴文章或故事原文<span>*</span>
          </label>
          <div className={s.article}>
            <textarea
              value={article}
              maxLength={50000}
              onChange={(e) => setArticle(e.target.value)}
              placeholder={`请直接粘贴文章或故事原文到此处……\n支持长文本粘贴，AI 将帮助您智能识别并拆分段落。\n例如：一篇记叙文、说明文或故事等。`}
            />
            <small>{article.length} / 50000</small>
          </div>
          {error && (
            <p className={s.error}>
              <Info />
              文章内容不能为空，请粘贴文章或故事原文后再开始智能拆分。
            </p>
          )}
          <h3>导入教师教案（可选）</h3>
          <div className={s.lesson}>
            <label>
              <Upload />
              <strong>上传教案文件</strong>
              <span>
                支持格式：TXT / MD / DOCX（≤50 MiB）；DOC 当前明确不可用
              </span>
              <input
                type="file"
                accept=".txt,.md,.doc,.docx"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.size > 50 * 1024 * 1024) {
                    setNotice("文件不能超过 50 MiB。");
                    return;
                  }
                      const form = new FormData();
                      form.set("file", f);
                      const response = await fetch("/api/ai/reading/extract", { method: "POST", body: form });
                      const result = await response.json().catch(() => null) as { text?: unknown; error?: unknown } | null;
                      if (!response.ok || typeof result?.text !== "string") {
                        setNotice(typeof result?.error === "string" ? result.error : "教案文件解析失败，请改用 TXT、MD 或有效 DOCX 文件。");
                        return;
                      }
                      setLesson(result.text.slice(0, 10_000));
                }}
              />
            </label>
            <i>或</i>
            <div>
              <textarea
                value={lesson}
                onChange={(e) => setLesson(e.target.value)}
                maxLength={10000}
                placeholder="可在此粘贴教案内容（可选）……"
              />
              <small>{lesson.length} / 10000</small>
            </div>
          </div>
          <button className={s.start} disabled={error || busy} onClick={start}>
            {busy ? "正在智能拆分…" : "开始智能拆分"}
          </button>
          <p className={s.hint}>
            <Info />
            {notice || "请先输入文章内容，或上传/粘贴教师教案（可选）"}
          </p>
        </div>
        <aside>
          <h2>接下来，科瑞特 AI 将为您：</h2>
          {[
            {
              icon: FileSearch,
              title: "识别完整情节",
              copy: "理解文章整体脉络，把握故事发展。",
            },
            {
              icon: Bookmark,
              title: "标记重点段落",
              copy: "找出关键内容，为阅读与创作做准备。",
            },
            {
              icon: CircleHelp,
              title: "生成启发问题",
              copy: "结合内容生成思考问题，激发深度理解。",
            },
          ].map(({ icon: Icon, title, copy }, i) => (
            <article key={title}>
              <b>{i + 1}</b>
              <Icon />
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            </article>
          ))}
          <div className={s.loading}>
            <span />
            <strong>AI 正在智能拆分段落…</strong>
          </div>
        </aside>
      </section>
      <footer>
        <BookOpen />
        拆分完成后，将进入逐段阅读与画面创作
      </footer>
    </main>
  );
}
