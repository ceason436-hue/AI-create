/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpenText,
  Check,
  ChevronDown,
  ChevronLeft,
  Download,
  Image as ImageIcon,
  PenLine,
  RefreshCw,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import s from "./reference-reading-story.module.css";
import { getBrowserToolStorage } from "@/lib/browser-tool-storage";
import { useToolSession } from "@/lib/use-tool-session";
import { ReferenceAsset } from "./reference-asset";
import type {
  ReadingChatMessage,
  ReadingProject,
  ReadingSegmentWork,
} from "@/lib/reading-projects";
import { emptySegmentWork } from "@/lib/reading-projects";
type ReadingAnalysis = {
  title: string;
  summary: string;
  keywords: string[];
  structure: Array<{ label: string; segmentIndexes: number[] }>;
  segments: Array<{
    text: string;
    question: string;
    evidence: string;
    difficulty: "基础" | "进阶" | "挑战";
  }>;
};
type ReadingAnalysisRecord = {
  analysis: ReadingAnalysis;
  requestId?: string | null;
};
type StableImagePayload = {
  status?: unknown;
  result?: { kind?: unknown; preview?: { image?: unknown } };
  error?: unknown;
  code?: unknown;
  requestId?: unknown;
};
const readingStyles = [
  "写实纪实",
  "科教插画",
  "电影科幻",
  "3D 粘土",
  "日系动漫",
  "水墨国风",
  "水彩绘本",
  "铅笔素描",
  "几何海报",
  "像素艺术",
  "纸雕拼贴",
  "复古孔版",
].map((name, index) => {
  const columns = [10, 368, 727, 1087],
    rows = [10, 367, 725];
  return {
    name,
    src: "/media/site-v3/art/style-reference-atlas-v2.png",
    width: 1448,
    box: `${columns[index % 4]} ${rows[Math.floor(index / 4)]} 350 350`,
  };
});
function payloadError(
  payload: StableImagePayload | null,
  fallback: string,
) {
  const message = typeof payload?.error === "string" ? payload.error : fallback,
    code = typeof payload?.code === "string" ? ` [${payload.code}]` : "",
    trace = "";
  return `${message}${code}${trace}`;
}
export function ReferenceReadingStory() {
  const toolSession = useToolSession(),
    storageIdentity = toolSession.storageIdentity,
    router = useRouter();
  const [index, setIndex] = useState(0),
    [answer, setAnswer] = useState(""),
    [chatHistory, setChatHistory] = useState<ReadingChatMessage[]>([]),
    [prompt, setPrompt] = useState(""),
    [style, setStyle] = useState<string | null>(null),
    [styleApproved, setStyleApproved] = useState(false),
    [styleChoiceMade, setStyleChoiceMade] = useState(false),
    [image, setImage] = useState(""),
    [variants, setVariants] = useState<string[]>([]),
    [compare, setCompare] = useState(false),
    [busy, setBusy] = useState(false),
    [generationProgress, setGenerationProgress] = useState(0),
    [notice, setNotice] = useState(""),
    [analysisLoaded, setAnalysisLoaded] = useState(false),
    [analysisRecord, setAnalysisRecord] =
      useState<ReadingAnalysisRecord | null>(null),
    [project, setProject] = useState<ReadingProject | null>(null),
    [stylesExpanded, setStylesExpanded] = useState(false),
    [styleChoiceOpen, setStyleChoiceOpen] = useState(false),
    [imagePreviewOpen, setImagePreviewOpen] = useState(false),
    [exportOpen, setExportOpen] = useState(false),
    [template, setTemplate] = useState<"classic" | "picture" | "notebook">(
      "classic",
    ),
    exportCanvas = useRef<HTMLDivElement>(null),
    messagesRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!toolSession.verified) return;
    const record = getBrowserToolStorage(
      "ai-reading",
      storageIdentity,
    ).get<ReadingAnalysisRecord>("analysis");
    if (record?.analysis?.segments?.length) {
      setAnalysisRecord(record);
      const savedProject = getBrowserToolStorage(
        "ai-reading",
        storageIdentity,
      ).get<ReadingProject>("active-project");
      if (savedProject?.analysis?.segments?.length) {
        setProject(savedProject);
        setIndex(
          Math.min(
            savedProject.currentIndex || 0,
            savedProject.analysis.segments.length - 1,
          ),
        );
        const work =
          savedProject.segmentWorks[savedProject.currentIndex || 0] ??
          emptySegmentWork();
        setPrompt(work.prompt);
        setStyle(savedProject.style ?? work.style);
        setStyleApproved(Boolean(savedProject.styleApproved));
        setStyleChoiceMade(Boolean(savedProject.styleChoiceMade));
        setImage(work.image);
        setVariants(work.variants || []);
        setChatHistory(work.chatHistory || []);
        if (
          sessionStorage.getItem("krt-reading-open-export") === savedProject.id
        ) {
          sessionStorage.removeItem("krt-reading-open-export");
          setExportOpen(true);
        }
      } else setPrompt("");
    } else
      setNotice("未找到本次有效的阅读分析。请返回导入文章并重新执行智能拆分。");
    setAnalysisLoaded(true);
  }, [storageIdentity, toolSession.verified]);
  const segments = analysisRecord?.analysis.segments ?? [],
    current = segments[index] ?? {
      text: "尚无分析结果。",
      question: "请先完成文章分析。",
      evidence: "尚无原文证据。",
      difficulty: "基础" as const,
    };
  function persistProject(next: ReadingProject) {
    const storage = getBrowserToolStorage("ai-reading", storageIdentity),
      projects = storage.get<ReadingProject[]>("projects") ?? [];
    storage.set("active-project", next);
    storage.set("projects", [
      next,
      ...projects.filter((item) => item.id !== next.id),
    ]);
    setProject(next);
  }
  function currentSnapshot(): ReadingSegmentWork {
    return { prompt, style, image, variants, chatHistory };
  }
  function selectSegment(nextIndex: number) {
    if (!project) return setIndex(nextIndex);
    const saved = {
      ...project,
      currentIndex: nextIndex,
      updatedAt: Date.now(),
      segmentWorks: { ...project.segmentWorks, [index]: currentSnapshot() },
    };
    persistProject(saved);
    const work = saved.segmentWorks[nextIndex] ?? emptySegmentWork();
    setIndex(nextIndex);
    setPrompt(work.prompt);
    setImage(work.image);
    setVariants(work.variants);
    setChatHistory(work.chatHistory || []);
    setStyle(saved.style ?? work.style);
    setStyleApproved(Boolean(saved.styleApproved));
    setStyleChoiceMade(Boolean(saved.styleChoiceMade));
    setCompare(false);
  }
  useEffect(() => {
    const messages = messagesRef.current;
    if (messages) messages.scrollTop = messages.scrollHeight;
  }, [chatHistory]);
  async function generate() {
    if (!analysisRecord) return setNotice("请先完成文章分析后再生成画面。");
    if (!styleChoiceMade) return setStyleChoiceOpen(true);
    setBusy(true);
    setGenerationProgress(12);
    setNotice("");
    const progressTimer = window.setInterval(() => setGenerationProgress((value) => Math.min(88, value + Math.max(2, Math.round((88 - value) / 5)))), 700);
    try {
      const res = await fetch("/api/minimax/image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": crypto.randomUUID(),
          },
          body: JSON.stringify({
            mode: image ? "img2img" : "text2img",
            prompt: `${prompt}\n风格：${style}`,
            ratio: "16:9",
            style,
            ...(image ? { referenceImage: image } : {}),
          }),
        }),
        data = (await res
          .json()
          .catch(() => null)) as StableImagePayload | null,
        generated =
          data?.result?.kind === "IMAGE"
            ? data.result.preview?.image
            : undefined;
      if (!res.ok)
        throw Error(payloadError(data, "绘本画面生成失败。"));
      if (
        data?.status !== "SUCCEEDED" ||
        typeof generated !== "string" ||
        !generated
      )
        throw Error(payloadError(data, "图片服务返回了无效结果。"));
      const nextVariants = [...variants.slice(-3), generated];
      setImage(generated);
      setGenerationProgress(100);
      setVariants(nextVariants);
      if (project) {
        const next = {
          ...project,
          style,
          styleApproved,
          styleChoiceMade,
          updatedAt: Date.now(),
          currentIndex: index,
          segmentWorks: {
            ...project.segmentWorks,
            [index]: {
              prompt,
              style,
              image: generated,
              variants: nextVariants,
              chatHistory,
            },
          },
        };
        persistProject(next);
      }
      setNotice("画面已生成。");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "生成失败，请稍后重试。");
    } finally {
      window.clearInterval(progressTimer);
      setBusy(false);
    }
  }
  function createVariant() {
    if (!prompt.trim())
      return setNotice("先写下你想呈现的画面内容，再生成变体。");
    void generate();
  }
  function continueEdit() {
    setPrompt((value) =>
      value ? `${value}；补充或调整：` : "请补充你希望画面呈现的重点：",
    );
    setNotice("已准备好参考当前画面继续创作；补充修改想法后，下一次生成会以这张图为基础。 ");
  }
  async function askTeacher() {
    if (!analysisRecord)
      return setNotice("请先完成文章分析后再向 AI 老师提问。");
    const question = answer.trim();
    if (!question) return;
    const nextHistory = [...chatHistory, { role: "user" as const, content: question }];
    setChatHistory(nextHistory);
    setAnswer("");
    try {
      const response = await fetch("/api/ai/reading/teacher", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({
          segment: current.text,
          question: current.question,
          messages: nextHistory.slice(-12),
        }),
      });
      const data = (await response.json().catch(() => null)) as {
        text?: unknown;
        error?: unknown;
      } | null;
      if (!response.ok || typeof data?.text !== "string")
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "AI 老师暂时无法回答。",
        );
      setChatHistory((history) => [
        ...history,
        { role: "assistant", content: data.text as string },
      ]);
    } catch (error) {
      setChatHistory((history) => [
        ...history,
        { role: "assistant", content: error instanceof Error ? error.message : "AI 老师暂时无法回答。" },
      ]);
    }
  }
  async function renderBookCanvas() {
    if (!exportCanvas.current) throw new Error("导出画布尚未准备好。");
    const images = Array.from(exportCanvas.current.querySelectorAll("img")),
      originalSources = images.map((item) => ({
        item,
        src: item.getAttribute("src"),
        crossOrigin: item.getAttribute("crossorigin"),
      }));
    await Promise.all(
      images.map(async (item) => {
        const source = item.currentSrc || item.src;
        if (!source) return;
        const resolved = new URL(source, window.location.href);
        if (resolved.origin !== window.location.origin) {
          const response = await fetch(
            `/api/media/proxy?url=${encodeURIComponent(resolved.href)}`,
          );
          if (!response.ok) throw new Error("导出时无法读取绘本图片，请重试。");
          const blob = await response.blob();
          item.src = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error("图片转换失败。"));
            reader.readAsDataURL(blob);
          });
        }
        item.removeAttribute("crossorigin");
        if (typeof item.decode === "function") await item.decode().catch(() => undefined);
      }),
    );
    const html2canvas = (await import("html2canvas")).default;
    try {
      return await html2canvas(exportCanvas.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
      });
    } finally {
      originalSources.forEach(({ item, src, crossOrigin }) => {
        if (src === null) item.removeAttribute("src");
        else item.setAttribute("src", src);
        if (crossOrigin === null) item.removeAttribute("crossorigin");
        else item.setAttribute("crossorigin", crossOrigin);
      });
    }
  }
  async function exportBook(format: "png" | "pdf" | "pptx") {
    setNotice("正在整理绘本文件…");
    try {
      const safeName =
        analysisRecord?.analysis.title.replace(/[\\/:*?"<>|]/g, "-") ||
        "AI绘本";
      if (format === "pptx") {
        const PptxGenJS = (await import("pptxgenjs")).default,
          pptx = new PptxGenJS();
        pptx.layout = "LAYOUT_WIDE";
        pptx.author = "科瑞特 AI";
        pptx.subject = "AI 阅读绘本";
        pptx.title = safeName;
        segments.forEach((segment, segmentIndex) => {
          const slide = pptx.addSlide();
          slide.background = {
            color: template === "notebook" ? "FFF8E8" : "FFFFFF",
          };
          const src = project?.segmentWorks[segmentIndex]?.image;
          if (src)
            slide.addImage({
              path: src.startsWith("/") ? `${location.origin}${src}` : src,
              x: 1.42,
              y: 0.4,
              w: 10.49,
              h: 5.9,
            });
          slide.addText(`${segmentIndex + 1}　${segment.text}`, {
            x: 0.65,
            y: 6.45,
            w: 12,
            h: 0.7,
            fontFace: "Microsoft YaHei",
            fontSize: 15,
            color: "183153",
            margin: 0.05,
            breakLine: false,
          });
        });
        await pptx.writeFile({ fileName: `${safeName}.pptx` });
      } else {
        const canvas = await renderBookCanvas();
        if (format === "png") {
          const link = document.createElement("a");
          link.download = `${safeName}-长图.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
        } else {
          const { jsPDF } = await import("jspdf"),
            pdf = new jsPDF({
              orientation: "portrait",
              unit: "px",
              format: [canvas.width, canvas.height],
              hotfixes: ["px_scaling"],
            });
          pdf.addImage(
            canvas.toDataURL("image/jpeg", 0.92),
            "JPEG",
            0,
            0,
            canvas.width,
            canvas.height,
          );
          pdf.save(`${safeName}.pdf`);
        }
      }
      if (project)
        persistProject({
          ...project,
          template,
          updatedAt: Date.now(),
          currentIndex: index,
          segmentWorks: { ...project.segmentWorks, [index]: currentSnapshot() },
        });
      setNotice(`${format.toUpperCase()} 绘本已导出。`);
    } catch (reason) {
      setNotice(
        reason instanceof Error
          ? `导出失败：${reason.message}`
          : "导出失败，请稍后重试。",
      );
    }
  }
  if (!analysisLoaded)
    return (
      <main className={`${s.page} ${s.analysisState} reference-reading-tool`}>
        <p>正在读取本次文章分析…</p>
      </main>
    );
  if (!analysisRecord)
    return (
      <main className={`${s.page} ${s.analysisState} reference-reading-tool`}>
        <section>
          <h1>还没有可阅读的段落</h1>
          <p>{notice || "请先导入文章并完成智能拆分。"}</p>
          <button onClick={() => router.replace("/tools/ai-reading")}>
            返回导入文章
          </button>
        </section>
      </main>
    );
  return (
    <main className={`${s.page} reference-reading-tool`}>
      <header>
        <button className={s.back} onClick={() => history.back()}>
          <ChevronLeft />
          返回
        </button>
        <h1>
          <BookOpenText />
          <span>
            <small>AI 阅读工作台</small>
            {analysisRecord.analysis.title}
          </span>
          <PenLine />
        </h1>
        <strong>
          第 <b>{segments.length ? index + 1 : 0}</b> / {segments.length} 段
        </strong>
        <span className={s.autoSaved}><Check /> 已自动保存</span>
      </header>
      <div className={s.workspace}>
        <section className={s.segment}>
          <div className={s.segmentHeader}>
            <div>
              <h2>当前段落</h2>
              <p>先理解内容，再想象可以呈现的画面。</p>
            </div>
            <em>{current.difficulty}精读</em>
          </div>
          <div className={s.segmentBody}>
            <div>{current.text}</div>
          </div>
        </section>
        <section className={s.chat}>
          <div className={s.panelTitle}>
            <div>
              <h2>AI 老师引导</h2>
              <p>老师会用问题帮助你发现重点，不会直接给出生图提示词。</p>
            </div>
            <span>可随时提问</span>
          </div>
          <div className={s.messages} ref={messagesRef} aria-live="polite">
            <p>
              <img
                src="/media/site-v3/reading/ai-teacher-cartoon-v1.png"
                alt="卡通 AI 阅读老师"
              />
              {current.question}
            </p>
            {chatHistory.map((message, messageIndex) =>
              message.role === "user" ? (
                <p className={s.student} key={`user-${messageIndex}`}>
                  {message.content}
                  <User />
                </p>
              ) : (
                <p key={`assistant-${messageIndex}`}>
                  <img src="/media/site-v3/reading/ai-teacher-cartoon-v1.png" alt="卡通 AI 阅读老师" />
                  {message.content}
                </p>
              ),
            )}
          </div>
          <div className={s.reply}>
            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="回答问题，描述你心中的画面..."
            />
            <button onClick={() => void askTeacher()}>
              <Send />
              发送
            </button>
          </div>
        </section>
        <section className={s.imagePanel}>
          <div className={s.panelTitle}>
            <div>
              <h2>绘本画面创作</h2>
              <p>把你理解到的内容，转化为自己的画面描述。</p>
            </div>
            <span>本段作品</span>
          </div>
          <div className={s.creationStage}>
          <label>
            画面提示词
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="描述你想呈现的画面，例如人物、动作、环境和氛围……"
            />
          </label>
          <figure>
            {image ? (
              <button className={s.previewImage} onClick={() => setImagePreviewOpen(true)} aria-label="放大查看生成的绘本画面">
                <img src={image} alt="由本段提示词生成的绘本画面，点击可放大查看" />
              </button>
            ) : (
              <div role="status">
                <ImageIcon />
                画面将在这里生成
              </div>
            )}
            {busy && <div className={s.generating} role="progressbar" aria-label="AI 阅读画面生成进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={generationProgress}><div><Sparkles /></div><strong>{generationProgress}%</strong><span>{generationProgress < 45 ? "小画笔正在听你的故事…" : generationProgress < 85 ? "正在把想象变成画面…" : "画面快要完成啦！"}</span></div>}
            <span>16:9</span>
          </figure>
          </div>
          <h3>选择画风</h3>
          <div className={s.styles}>
            {(stylesExpanded ? readingStyles : readingStyles.slice(0, 5)).map(
              ({ name, src, width, box }) => (
                <button
                  className={style === name ? s.chosen : ""}
                  onClick={() => {
                    setStyle(name);
                    if (project)
                      persistProject({
                        ...project,
                        style: name,
                        updatedAt: Date.now(),
                      });
                  }}
                  key={name}
                >
                  <ReferenceAsset
                    src={src}
                    sourceWidth={width}
                    box={box}
                    alt={`${name}参考图`}
                  />
                  <span>{name}</span>
                </button>
              ),
            )}
            <button
              className={s.expandStyles}
              onClick={() => setStylesExpanded((value) => !value)}
            >
              <ChevronDown />{" "}
              <span>{stylesExpanded ? "收起画风" : "展开全部"}</span>
            </button>
          </div>
          <div className={s.generateRow}>
            <label className={s.styleConsent}>
              {styleApproved ? `本绘本将统一使用${style || "所选"}画风` : styleChoiceMade ? "你可以自由选择每段画风" : "首次生成时可选择是否统一画风"}
            </label>
            <button className={s.generate} disabled={busy} onClick={generate}>
              <Sparkles />
              {busy ? "正在生成画面…" : "生成本段画面"}
            </button>
          </div>
          {notice && <p className={s.notice}>{notice}</p>}
          <div className={s.imageActions}>
            <button
              onClick={() => setCompare((value) => !value)}
              disabled={variants.length < 2}
            >
              <Check />
              {compare ? "退出比较" : "比较所选"}
            </button>
            <button onClick={createVariant} disabled={busy}>
              <RefreshCw />
              生成变体
            </button>
            <button onClick={continueEdit}>
              <PenLine />
              继续编辑
            </button>
            {image ? (
              <button
                className={s.next}
                onClick={() =>
                  index >= segments.length - 1
                    ? setExportOpen(true)
                    : selectSegment(index + 1)
                }
              >
                {index >= segments.length - 1
                  ? "本段已完成，去连续绘本导出"
                  : "满意，进入下一段　→"}
              </button>
            ) : null}
          </div>
          {compare && (
            <div className={s.variantGrid} aria-label="生成结果比较">
              {variants.map((src, variantIndex) => (
                <button
                  key={`${src}-${variantIndex}`}
                  className={src === image ? s.selectedVariant : ""}
                  onClick={() => setImage(src)}
                >
                  <img src={src} alt={`第 ${variantIndex + 1} 个生成变体`} />
                  <span>变体 {variantIndex + 1}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
      <section className={s.storyboard}>
        <header>
          <h2>连续绘本场景（{segments.length} 段）</h2>
          <span>作品会自动保存</span>
          <button className={s.exportButton} onClick={() => setExportOpen(true)}><Download /> 导出绘本</button>
        </header>
        <div>
          {segments.map((_, i) => (
            <button
              key={i}
              className={index === i ? s.selected : ""}
              onClick={() => selectSegment(i)}
            >
              {(i === index ? image : project?.segmentWorks[i]?.image) ? (
                <img
                  src={i === index ? image : project?.segmentWorks[i]?.image}
                  alt={`第${i + 1}段绘本缩略图`}
                />
              ) : (
                <ImageIcon />
              )}
              <b>{i + 1}</b>
              <span>
                第 {i + 1} 段　
                {(i === index ? image : project?.segmentWorks[i]?.image)
                  ? "已生成"
                  : "待生成"}
              </span>
            </button>
          ))}
        </div>
      </section>
      <div ref={exportCanvas} className={`${s.exportCanvas} ${s[template]}`}>
        <h1>{analysisRecord.analysis.title}</h1>
        {segments.map((segment, segmentIndex) => (
          <article key={segmentIndex}>
            {project?.segmentWorks[segmentIndex]?.image ? (
              <img src={project.segmentWorks[segmentIndex].image} alt="" />
            ) : (
              <div>第 {segmentIndex + 1} 幅画面尚未生成</div>
            )}
            <section>
              <b>{segmentIndex + 1}</b>
              <p>{segment.text}</p>
            </section>
          </article>
        ))}
      </div>
      {exportOpen && (
        <div
          className={s.exportBackdrop}
          role="dialog"
          aria-modal="true"
          aria-label="导出绘本"
        >
          <section>
            <div>
              <h2>导出完整绘本</h2>
              <button onClick={() => setExportOpen(false)}>关闭</button>
            </div>
            <p>每段课文原文对应一张图片，选择版式与文件格式后保存。</p>
            <div className={s.templates}>
              {[
                { id: "classic", name: "经典图文" },
                { id: "picture", name: "大图绘本" },
                { id: "notebook", name: "成长手记" },
              ].map((item) => (
                <button
                  className={template === item.id ? s.chosenTemplate : ""}
                  onClick={() => setTemplate(item.id as typeof template)}
                  key={item.id}
                >
                  <span></span>
                  <strong>{item.name}</strong>
                </button>
              ))}
            </div>
            <div className={s.exportActions}>
              <button onClick={() => void exportBook("png")}>
                <Download />
                导出长图
              </button>
              <button onClick={() => void exportBook("pdf")}>
                <Download />
                导出 PDF
              </button>
              <button onClick={() => void exportBook("pptx")}>
                <Download />
                导出 PPT
              </button>
            </div>
          </section>
        </div>
      )}
      {styleChoiceOpen && (
        <div className={s.exportBackdrop} role="dialog" aria-modal="true" aria-label="选择绘本画风">
          <section className={s.styleDialog}>
            <h2>让绘本画面保持同一种风格吗？</h2>
            <p>统一画风会让整本绘本看起来更像一个完整的故事。你也可以以后每段自由选择。</p>
            <div><button onClick={() => { setStyleApproved(true); setStyleChoiceMade(true); setStyleChoiceOpen(false); if (project) persistProject({ ...project, style, styleApproved: true, styleChoiceMade: true, updatedAt: Date.now() }); setNotice("已选择统一画风，接下来会保持一致。"); }}>需要，统一画风</button><button onClick={() => { setStyleApproved(false); setStyleChoiceMade(true); setStyleChoiceOpen(false); if (project) persistProject({ ...project, style, styleApproved: false, styleChoiceMade: true, updatedAt: Date.now() }); setNotice("好的，接下来你可以自由更换画风。"); }}>不需要，自由选择</button></div>
          </section>
        </div>
      )}
      {imagePreviewOpen && image && (
        <div className={s.imageLightbox} role="dialog" aria-modal="true" aria-label="放大查看图片" onClick={() => setImagePreviewOpen(false)}>
          <button aria-label="关闭图片预览">关闭 ×</button><img src={image} alt="放大查看绘本画面" />
        </div>
      )}
    </main>
  );
}
