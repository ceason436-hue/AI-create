/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  CircleHelp,
  FileSearch,
  FileText,
  FolderOpen,
  Globe2,
  History,
  Image as ImageIcon,
  Search,
  Sparkles,
  Upload,
  UserRound,
} from "lucide-react";
import s from "./reference-reading-import.module.css";
import { getBrowserToolStorage } from "@/lib/browser-tool-storage";
import { useToolSession } from "@/lib/use-tool-session";
import type { ReadingAnalysis } from "@/lib/reading-analysis";
import type { ReadingProject } from "@/lib/reading-projects";

type Preset = {
  id: string;
  title: string;
  article: string;
  teacherGuide: string;
  coverImage: string;
  grade: number;
  semester: "FIRST" | "SECOND";
  publisher: string;
  summary: string;
  analysis?: ReadingAnalysis;
  unit?: string;
  sceneImages?: string[];
  mock?: boolean;
};
type SearchCandidate = {
  title: string;
  sourceTitle: string;
  article: string;
  summary: string;
  grade?: number;
  publisher?: string;
};

export function ReferenceReadingImport() {
  const toolSession = useToolSession(),
    storageIdentity = toolSession.storageIdentity,
    router = useRouter(),
    storage = getBrowserToolStorage("ai-reading", storageIdentity);
  const [tab, setTab] = useState<"library" | "records" | "help">("library"),
    [presets, setPresets] = useState<Preset[]>([]),
    [projects, setProjects] = useState<ReadingProject[]>([]),
    [grade, setGrade] = useState(3),
    [semester, setSemester] = useState<"FIRST" | "SECOND">("FIRST"),
    [selectedId, setSelectedId] = useState(""),
    [alternativesOpen, setAlternativesOpen] = useState(false),
    [sourceMode, setSourceMode] = useState<"upload" | "search" | "guide">(
      "upload",
    ),
    [title, setTitle] = useState(""),
    [article, setArticle] = useState(""),
    [guide, setGuide] = useState(""),
    [query, setQuery] = useState(""),
    [searching, setSearching] = useState(false),
    [candidates, setCandidates] = useState<SearchCandidate[]>([]),
    [candidatePreview, setCandidatePreview] = useState<SearchCandidate | null>(null),
    [accountName, setAccountName] = useState("我的账号"),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(0),
    [notice, setNotice] = useState("");
  const articleUpload = useRef<HTMLInputElement>(null),
    guideUpload = useRef<HTMLInputElement>(null),
    alternatives = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    void fetch("/api/ai/reading/presets")
      .then((response) => response.json())
      .then((data: { presets?: Preset[] }) =>
        setPresets(Array.isArray(data.presets) ? data.presets : []),
      )
      .catch(() => setNotice("课文库暂时无法加载。"));
  }, []);
  useEffect(() => {
    void fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (typeof data?.account?.displayName === "string" && data.account.displayName.trim()) setAccountName(data.account.displayName);
      })
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    if (!toolSession.verified) return;
    setProjects(storage.get<ReadingProject[]>("projects") ?? []);
  }, [storageIdentity, toolSession.verified]);
  const filtered = useMemo(
    () =>
      presets.filter(
        (item) => item.grade === grade && item.semester === semester,
      ),
    [presets, grade, semester],
  );
  const selected =
    presets.find(
      (item) =>
        item.id === selectedId &&
        item.grade === grade &&
        item.semester === semester,
    ) ??
    filtered[0] ??
    null;
  const grouped = useMemo(
    () =>
      Object.entries(
        filtered.reduce<Record<string, Preset[]>>((acc, item) => {
          (acc[item.unit || "本学期课文"] ??= []).push(item);
          return acc;
        }, {}),
      ),
    [filtered],
  );
  useEffect(() => {
    if (selected && selected.id !== selectedId) setSelectedId(selected.id);
  }, [selected, selectedId]);
  function openAlternatives(mode: "upload" | "search" | "guide") {
    setSourceMode(mode);
    setAlternativesOpen(true);
    window.setTimeout(
      () =>
        alternatives.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      80,
    );
  }
  async function extract(file: File | undefined, target: "article" | "guide") {
    if (!file) return;
    const form = new FormData();
    form.set("file", file);
    setNotice("");
    try {
      const response = await fetch("/api/ai/reading/extract", {
          method: "POST",
          body: form,
        }),
        data = await response.json();
      if (!response.ok || typeof data.text !== "string")
        throw new Error(data.error || "文件识别失败。");
      if (target === "article") {
        setArticle(data.text.slice(0, 50_000));
        setTitle(file.name.replace(/\.[^.]+$/, ""));
      } else setGuide(data.text.slice(0, 10_000));
      setNotice(
        target === "article"
          ? "课文已导入，可直接开始拆分。"
          : "教师教案已导入。",
      );
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "文件识别失败。");
    }
  }
  async function analyze(
    input: { title: string; article: string; teacherGuide?: string },
    sourceId?: string,
  ) {
    if (!toolSession.verified) throw new Error("正在验证会话，请稍后再试。");
    setBusy(true);
    setProgress(8);
    const timer = window.setInterval(
      () => setProgress((value) => Math.min(92, value + (value < 58 ? 7 : 2))),
      650,
    );
    try {
      const response = await fetch("/api/ai/reading/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": crypto.randomUUID(),
          },
          body: JSON.stringify(input),
        }),
        data = await response.json();
      if (!response.ok || !data?.analysis?.segments?.length)
        throw new Error(data?.error || "课文拆分没有返回可用内容。");
      setProgress(100);
      startProject(
        data.analysis,
        sourceId,
        response.headers.get("x-ai-request-id"),
      );
    } finally {
      window.clearInterval(timer);
      setBusy(false);
    }
  }
  function startProject(
    analysis: ReadingAnalysis,
    sourceId?: string,
    requestId: string | null = null,
  ) {
    const existing = projects.find(
      (project) =>
        project.sourceId === sourceId && project.title === analysis.title,
    );
    const project: ReadingProject = existing ?? {
      id: crypto.randomUUID(),
      sourceId,
      title: analysis.title,
      analysis,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      currentIndex: 0,
      segmentWorks: {},
    };
    const next = [
      project,
      ...projects.filter((item) => item.id !== project.id),
    ];
    storage.set("analysis", { analysis, requestId });
    storage.set("active-project", project);
    storage.set("projects", next);
    router.push("/tools/ai-reading/result");
  }
  async function startPreset() {
    if (!selected) return;
    if (selected.analysis?.segments.length)
      return startProject(selected.analysis, selected.id);
    try {
      await analyze(
        {
          title: selected.title,
          article: selected.article,
          teacherGuide: selected.teacherGuide || undefined,
        },
        selected.id,
      );
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "拆分失败。");
    }
  }
  async function searchLesson(term = query) {
    if (!term.trim()) return setNotice("请输入课文名称。");
    setSearching(true);
    setCandidates([]);
    setNotice("");
    try {
      const response = await fetch("/api/ai/reading/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": crypto.randomUUID(),
          },
          body: JSON.stringify({ title: term.trim(), grade }),
        }),
        data = await response.json();
      if (
        !response.ok ||
        !Array.isArray(data.candidates) ||
        !data.candidates.length
      )
        throw new Error(data.error || "没有找到匹配课文。");
      setCandidates(data.candidates);
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "查询失败。");
    } finally {
      setSearching(false);
    }
  }
  function chooseCandidate(candidate: SearchCandidate) {
    setTitle(candidate.title);
    setArticle(candidate.article);
    setCandidates([candidate]);
    setNotice(`已选择《${candidate.title}》，可以开始 AI 拆分。`);
    setCandidatePreview(null);
  }
  async function startCustom() {
    if (!title.trim()) return setNotice("请填写课文名称。");
    if (!article.trim()) {
      setQuery(title);
      setSourceMode("search");
      await searchLesson(title);
      return;
    }
    try {
      await analyze({ title, article, teacherGuide: guide || undefined });
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "拆分失败。");
    }
  }
  function resume(project: ReadingProject) {
    storage.set("analysis", { analysis: project.analysis, requestId: null });
    storage.set("active-project", project);
    router.push("/tools/ai-reading/result");
  }
  function openExport(project: ReadingProject) {
    storage.set("analysis", { analysis: project.analysis, requestId: null });
    storage.set("active-project", project);
    sessionStorage.setItem("krt-reading-open-export", project.id);
    router.push("/tools/ai-reading/result");
  }
  return (
    <main className={`${s.page} reference-reading-tool`}>
      <header>
        <button onClick={() => history.back()}>
          <ChevronLeft />
          返回
        </button>
        <div className={s.brand}>
          <BookOpen />
          AI 阅读与绘本创作
        </div>
        <nav>
          <button
            className={tab === "records" ? s.activeTop : ""}
            onClick={() => setTab("records")}
          >
            <History />
            创作记录
          </button>
          <button
            className={tab === "help" ? s.activeTop : ""}
            onClick={() => setTab("help")}
          >
            <CircleHelp />
            使用指南
          </button>
          <span>
            <UserRound />
            {accountName}
            <ChevronDown />
          </span>
        </nav>
      </header>
      {tab === "records" ? (
        <section className={s.records}>
          <div>
            <h1>创作记录</h1>
            <p>按课文查看已完成的分段画面，随时返回继续修改或导出绘本。</p>
          </div>
          {projects.length ? (
            <div className={s.recordGrid}>
              {projects.map((project) => {
                const completed = Object.values(project.segmentWorks).filter(
                  (work) => work.image,
                ).length;
                return (
                  <article key={project.id}>
                    {Object.values(project.segmentWorks).find(
                      (work) => work.image,
                    )?.image ? (
                      <img
                        src={
                          Object.values(project.segmentWorks).find(
                            (work) => work.image,
                          )?.image
                        }
                        alt=""
                      />
                    ) : (
                      <div>
                        <ImageIcon />
                      </div>
                    )}
                    <section>
                      <h2>{project.title}</h2>
                      <p>
                        {completed} / {project.analysis.segments.length} 张画面
                        ·{" "}
                        {new Date(project.updatedAt).toLocaleDateString(
                          "zh-CN",
                        )}
                      </p>
                      <div className={s.recordThumbs}>
                        {project.analysis.segments.map((_, segmentIndex) =>
                          project.segmentWorks[segmentIndex]?.image ? (
                            <img
                              src={project.segmentWorks[segmentIndex].image}
                              alt={`第${segmentIndex + 1}段画面`}
                              key={segmentIndex}
                            />
                          ) : (
                            <span key={segmentIndex}>{segmentIndex + 1}</span>
                          ),
                        )}
                      </div>
                      <div className={s.recordActions}>
                        <button onClick={() => resume(project)}>
                          继续创作
                        </button>
                        <button onClick={() => openExport(project)}>
                          导出绘本
                        </button>
                      </div>
                    </section>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={s.noRecords}>
              <FolderOpen />
              <h2>还没有创作记录</h2>
              <button onClick={() => setTab("library")}>选择一篇课文</button>
            </div>
          )}
        </section>
      ) : tab === "help" ? (
        <section className={s.help}>
          <h1>使用指南</h1>
          <ol>
            <li>
              <b>1</b>
              <div>
                <strong>选择课文</strong>
                <p>从课程库选择，或通过备用入口上传和联网查找。</p>
              </div>
            </li>
            <li>
              <b>2</b>
              <div>
                <strong>理解段落</strong>
                <p>跟随 AI 老师的问题找出人物、动作、环境与关键词。</p>
              </div>
            </li>
            <li>
              <b>3</b>
              <div>
                <strong>逐页创作</strong>
                <p>每段原文生成一幅画面，任何时候都能返回修改。</p>
              </div>
            </li>
            <li>
              <b>4</b>
              <div>
                <strong>导出绘本</strong>
                <p>完成后选择模板，导出长图、PDF 或 PPT。</p>
              </div>
            </li>
          </ol>
          <button onClick={() => setTab("library")}>开始创作</button>
        </section>
      ) : (
        <>
          <div className={s.catalog}>
            <aside className={s.guide}>
              <div className={s.guideHead}>
                <strong>教材导航</strong>
                <span>
                  统编版
                  <ChevronDown />
                </span>
              </div>
              <div className={s.gradeSemester}>
                <div>
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <button
                      className={grade === item ? s.currentGrade : ""}
                      onClick={() => {
                        setGrade(item);
                        setSelectedId("");
                      }}
                      key={item}
                    >
                      {item}年级
                    </button>
                  ))}
                </div>
                <section>
                  <button
                    className={semester === "FIRST" ? s.currentTerm : ""}
                    onClick={() => setSemester("FIRST")}
                  >
                    上学期
                  </button>
                  <button
                    className={semester === "SECOND" ? s.currentTerm : ""}
                    onClick={() => setSemester("SECOND")}
                  >
                    下学期
                  </button>
                </section>
              </div>
              <div className={s.backup}>
                <button onClick={() => setAlternativesOpen((value) => !value)}>
                  <strong>备用课文入口</strong>
                  {alternativesOpen ? <ChevronUp /> : <ChevronDown />}
                </button>
                <div>
                  <button onClick={() => openAlternatives("upload")}>
                    <Upload />
                    上传原文
                  </button>
                  <button onClick={() => openAlternatives("search")}>
                    <Globe2 />
                    联网查找
                  </button>
                  <button onClick={() => openAlternatives("guide")}>
                    <FileText />
                    上传教案
                  </button>
                </div>
              </div>
            </aside>
            <section className={s.directory}>
              <h2>课文目录</h2>
              <div className={s.unitList}>
                {grouped.map(([unit, items]) => (
                  <section key={unit}>
                    <h3>
                      {unit}
                      <ChevronUp />
                    </h3>
                    {items.map((item, idx) => (
                      <button
                        className={
                          item.id === selected?.id ? s.currentLesson : ""
                        }
                        onClick={() => setSelectedId(item.id)}
                        key={item.id}
                      >
                        <img src={item.coverImage} alt="" loading="lazy" decoding="async" />
                        <span>
                          <strong>
                            {idx + 1}　{item.title}
                            {item.mock ? <em>演示</em> : null}
                          </strong>
                          <small>{item.summary}</small>
                        </span>
                        <b>{item.analysis?.segments.length ?? "AI"} 个画面</b>
                      </button>
                    ))}
                  </section>
                ))}
                {!grouped.length && (
                  <p className={s.emptyDirectory}>本年级当前学期暂无课程。</p>
                )}
              </div>
            </section>
            <section className={s.preview}>
              <h2>课文预览</h2>
              {selected ? (
                <div className={s.previewBody}>
                  <img
                    className={s.previewCover}
                    src={selected.coverImage}
                    alt={`${selected.title}课程封面`}
                    loading="eager"
                    decoding="async"
                  />
                  <h3>{selected.title}</h3>
                  <p className={s.meta}>
                    {selected.grade}年级　·　
                    {selected.semester === "FIRST" ? "上学期" : "下学期"}　·　
                    {selected.publisher}
                  </p>
                  <div className={s.ready}>
                    <span>✓ 课文已校对</span>
                    <span>✓ 已完成智能拆分</span>
                    {selected.mock ? <span>演示课程</span> : null}
                  </div>
                  <p className={s.summary}>{selected.summary}</p>
                  <div className={s.previewActions}>
                    <button onClick={() => void startPreset()}>
                      <Sparkles />
                      开始绘本创作
                    </button>
                    <button
                      onClick={() => {
                        setTitle(selected.title);
                        setArticle(selected.article);
                        openAlternatives("upload");
                      }}
                    >
                      <FileText />
                      查看课文原文
                    </button>
                  </div>
                </div>
              ) : (
                <div className={s.emptyPreview}>
                  <BookOpen />
                  <p>请选择一篇课文查看详情。</p>
                </div>
              )}
            </section>
          </div>
          <details
            ref={alternatives}
            open={alternativesOpen}
            onToggle={(event) => setAlternativesOpen(event.currentTarget.open)}
            className={s.alternatives}
          >
            <summary>
              <div>
                <FileSearch />
                <strong>其他方式获取课文</strong>
              </div>
              <ChevronDown />
            </summary>
            <div className={s.altTabs}>
              <button
                className={sourceMode === "upload" ? s.activeAlt : ""}
                onClick={() => setSourceMode("upload")}
              >
                <Upload />
                上传课文原文
              </button>
              <button
                className={sourceMode === "search" ? s.activeAlt : ""}
                onClick={() => setSourceMode("search")}
              >
                <Globe2 />
                按名称联网查找
              </button>
              <button
                className={sourceMode === "guide" ? s.activeAlt : ""}
                onClick={() => setSourceMode("guide")}
              >
                <FileText />
                上传教师教案
              </button>
            </div>
            <div className={s.altForm}>
              {sourceMode === "upload" ? (
                <>
                  <button
                    className={s.fileDrop}
                    onClick={() => articleUpload.current?.click()}
                  >
                    <Upload />
                    <strong>选择课文文件</strong>
                    <span>TXT / MD / DOCX</span>
                  </button>
                  <input
                    ref={articleUpload}
                    hidden
                    type="file"
                    accept=".txt,.md,.docx"
                    onChange={(e) =>
                      void extract(e.target.files?.[0], "article")
                    }
                  />
                </>
              ) : sourceMode === "guide" ? (
                <>
                  <button
                    className={s.fileDrop}
                    onClick={() => guideUpload.current?.click()}
                  >
                    <FileText />
                    <strong>选择教师教案</strong>
                    <span>可选，不影响直接拆分</span>
                  </button>
                  <input
                    ref={guideUpload}
                    hidden
                    type="file"
                    accept=".txt,.md,.docx"
                    onChange={(e) => void extract(e.target.files?.[0], "guide")}
                  />
                </>
              ) : (
                <div>
                  <label className={s.lessonName}>
                    <span>课文名称</span>
                    <span>
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="例如：植物妈妈有办法"
                      />
                      <button
                        onClick={() => void searchLesson()}
                        disabled={searching}
                      >
                        <Search />
                        {searching ? "正在查询" : "联网查询"}
                      </button>
                    </span>
                  </label>
                  {candidates.length ? (
                    <div className={s.searchResults}>
                      {candidates.map((candidate) => (
                        <button
                          onClick={() => setCandidatePreview(candidate)}
                          key={`${candidate.sourceTitle}-${candidate.title}`}
                        >
                          <strong>{candidate.title}</strong>
                          <span>{candidate.sourceTitle}</span>
                          <p>{candidate.summary}</p>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
              {sourceMode !== "search" || article ? <label className={s.lessonName}>
                <span>课文名称</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label> : null}
              {sourceMode !== "search" && (
                <label>
                  <span>课文原文</span>
                  <textarea
                    value={article}
                    onChange={(e) => setArticle(e.target.value)}
                    placeholder="可粘贴原文；按名称查询并选择结果后也可直接拆分。"
                  />
                </label>
              )}
              {sourceMode !== "search" || article ? <button
                className={s.customStart}
                onClick={() => void startCustom()}
                disabled={busy || !title.trim()}
              >
                <Sparkles />
                开始 AI 智能拆分
              </button> : null}
            </div>
          </details>
        </>
      )}
      {(busy || progress === 100) && (
        <div className={s.progress}>
          <div>
            <span>正在按绘本画面拆分课文</span>
            <b>{progress}%</b>
          </div>
          <i>
            <span style={{ transform: `scaleX(${progress / 100})` }} />
          </i>
        </div>
      )}
      {notice && <p className={s.notice}>{notice}</p>}
      {candidatePreview && (
        <div className={s.candidateBackdrop} role="dialog" aria-modal="true" aria-label="课文搜索结果详情">
          <section>
            <div><h2>{candidatePreview.title}</h2><button onClick={() => setCandidatePreview(null)}>返回结果</button></div>
            <p className={s.candidateSource}>来源：{candidatePreview.sourceTitle}</p>
            <p className={s.candidateSummary}>{candidatePreview.summary}</p>
            <article>{candidatePreview.article}</article>
            <footer><button onClick={() => setCandidatePreview(null)}>继续查看其他结果</button><button onClick={() => chooseCandidate(candidatePreview)}>确认选择这篇课文</button></footer>
          </section>
        </div>
      )}
    </main>
  );
}
