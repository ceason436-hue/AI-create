/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useState } from "react";
import {
  Bot,
  Check,
  ChevronLeft,
  Image as ImageIcon,
  Link2,
  Palette,
  PenLine,
  RefreshCw,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import s from "./reference-reading-story.module.css";
import { getBrowserToolStorage } from "@/lib/browser-tool-storage";
import { useToolSession } from "@/lib/use-tool-session";
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
function payloadError(
  payload: StableImagePayload | null,
  fallback: string,
  requestId: string | null,
) {
  const message = typeof payload?.error === "string" ? payload.error : fallback,
    code = typeof payload?.code === "string" ? ` [${payload.code}]` : "",
    trace = requestId ? ` （请求编号：${requestId}）` : "";
  return `${message}${code}${trace}`;
}
export function ReferenceReadingStory() {
  const toolSession = useToolSession(), storageIdentity = toolSession.storageIdentity, personal = storageIdentity === "PERSONAL";
  const [index, setIndex] = useState(0),
    [answer, setAnswer] = useState(""),
    [submittedAnswer, setSubmittedAnswer] = useState(""),
    [prompt, setPrompt] = useState(""),
    [style, setStyle] = useState("动漫风格"),
    [image, setImage] = useState(""),
    [busy, setBusy] = useState(false),
    [teacherThinking, setTeacherThinking] = useState(false),
    [teacherReply, setTeacherReply] = useState(""),
    [notice, setNotice] = useState(""),
    [analysisRecord, setAnalysisRecord] =
      useState<ReadingAnalysisRecord | null>(null);
  useEffect(() => {
    if (!toolSession.verified) return;
    const record =
      getBrowserToolStorage("ai-reading", storageIdentity).get<ReadingAnalysisRecord>(
        "analysis",
      );
    if (record?.analysis?.segments?.length) {
      setAnalysisRecord(record);
      setPrompt(record.analysis.segments[0].text.slice(0, 160));
    } else setNotice("未找到本次真实阅读分析，请返回导入文章并完成 AI 分析。");
  }, [storageIdentity, toolSession.verified]);
  useEffect(() => {
    if (!teacherThinking) return;
    const timer = window.setTimeout(() => {
      setTeacherThinking(false);
      setTeacherReply("你观察得很仔细！我们一起把这个画面想得更清楚吧。");
    }, 900);
    return () => window.clearTimeout(timer);
  }, [teacherThinking]);
  const segments = analysisRecord?.analysis.segments ?? [],
    current = segments[index] ?? {
      text: "尚无分析结果。",
      question: "请先完成文章分析。",
      evidence: "尚无原文证据。",
      difficulty: "基础" as const,
    };
  async function generate() {
    setBusy(true);
    setNotice("");
    try {
      const res = await fetch("/api/minimax/image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": crypto.randomUUID(),
          },
          body: JSON.stringify({
            mode: "text2img",
            prompt: `${prompt}\n风格：${style}`,
            ratio: "16:9",
            style,
          }),
        }),
        data = (await res
          .json()
          .catch(() => null)) as StableImagePayload | null,
        requestId =
          res.headers.get("x-ai-request-id") ||
          (typeof data?.requestId === "string" ? data.requestId : null),
        generated =
          data?.result?.kind === "IMAGE"
            ? data.result.preview?.image
            : undefined;
      if (!res.ok)
        throw Error(payloadError(data, "绘本画面生成失败。", requestId));
      if (
        data?.status !== "SUCCEEDED" ||
        typeof generated !== "string" ||
        !generated
      )
        throw Error(payloadError(data, "图片服务返回了无效结果。", requestId));
      setImage(generated);
      setNotice(
        requestId ? `画面已生成。请求编号：${requestId}` : "画面已生成。",
      );
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "生成失败，请稍后重试。");
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (!analysisRecord) return setNotice("没有可保存的阅读分析。");
    const payload = {
      ...analysisRecord.analysis,
      progress: { index, prompt, style, image, answer },
    };
    if (!toolSession.verified) return setNotice("正在验证会话，请稍后重试。");
    if (personal) {
      try {
        const raw = JSON.stringify(payload),
          bytes = new TextEncoder().encode(raw),
          binary = Array.from(bytes, (b) => String.fromCharCode(b)).join(""),
          response = await fetch("/api/works", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(analysisRecord.requestId
                ? { "x-ai-request-id": analysisRecord.requestId }
                : {}),
            },
            body: JSON.stringify({
              type: "READING",
              title: analysisRecord.analysis.title,
              mimeType: "application/json",
              contentBase64: btoa(binary),
            }),
          }),
          data = (await response.json().catch(() => null)) as {
            error?: unknown;
            work?: { id?: unknown };
          } | null;
        if (!response.ok)
          throw new Error(
            typeof data?.error === "string" ? data.error : "云端保存失败",
          );
        if (typeof data?.work?.id !== "string")
          throw new Error("作品库返回了无效结果");
        getBrowserToolStorage("ai-reading", storageIdentity).remove("story-progress");
        setNotice(`阅读项目已保存到个人云端作品库（${data.work.id}）。`);
        return;
      } catch (error) {
        setNotice(
          `${error instanceof Error ? error.message : "云端保存失败"}，请重试；当前分析未丢失。`,
        );
        return;
      }
    }
    getBrowserToolStorage("ai-reading", storageIdentity).set("story-progress", payload);
    setNotice("当前段落、回答与画面已保存到课堂临时工作空间。");
  }
  return (
    <main className={s.page}>
      <header>
        <button onClick={() => history.back()}>
          <ChevronLeft />
          返回
        </button>
        <h1>
          ▤　未命名故事　
          <PenLine />
        </h1>
        <strong>
          第 <b>{segments.length ? index + 1 : 0}</b> / {segments.length} 段
        </strong>
        <button onClick={save}>
          <Link2 />
          保存进度
        </button>
      </header>
      <nav>
        {["导入文章", "智能拆分", "逐段阅读", "绘本创作"].map((x, i) => (
          <span className={i < 2 ? s.done : i === 2 ? s.active : ""} key={x}>
            {i < 2 ? <Check /> : <b>{i + 1}</b>}
            {x}
          </span>
        ))}
      </nav>
      <div className={s.workspace}>
        <section className={s.segment}>
          <h2>当前段落</h2>
          <em>重点精读</em>
          <div className={s.segmentBody}>
            <div>{current.text}</div>
          </div>
        </section>
        <section className={s.chat}>
          <h2>AI 老师引导</h2>
          <div className={s.messages}>
            <p>
              <Bot />
              {current.question}
            </p>
              {submittedAnswer ? <p className={s.student}>{submittedAnswer}<User /></p> : null}
              {teacherThinking ? <p className={s.thinking}><Bot /><span>小老师正在想一想</span><i /><i /><i /></p> : teacherReply ? <p><Bot />{teacherReply}</p> : null}
            <p>
              <Bot />
              证据提示：{current.evidence}
            </p>
          </div>
          <div className={s.reply}>
            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="回答问题，描述你心中的画面..."
            />
            <button
              onClick={() => {
                if (answer.trim()) {
                  setSubmittedAnswer(answer);
                  setPrompt(answer);
                  setTeacherReply("");
                  setTeacherThinking(true);
                  setAnswer("");
                }
              }}
            >
              <Send />
              发送
            </button>
          </div>
        </section>
        <section className={s.imagePanel}>
          <h2>生图工具面板</h2>
          <label>
            画面提示词 <small>{prompt.length}/200</small>
            <textarea
              value={prompt}
              maxLength={200}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </label>
          <h3>选择画风</h3>
          <div className={s.styles}>
            {[
              { name: "动漫风格", icon: Palette },
              { name: "水彩绘本", icon: PenLine },
              { name: "3D卡通", icon: ImageIcon },
              { name: "写实摄影", icon: ImageIcon },
            ].map(({ name, icon: Icon }) => (
              <button
                className={style === name ? s.chosen : ""}
                onClick={() => setStyle(name)}
                key={name}
              >
                <Icon />
                {name}
              </button>
            ))}
          </div>
          <button className={s.generate} disabled={busy} onClick={generate}>
            <Sparkles />
            {busy ? "正在生成画面…" : "开始生成画面"}
          </button>
          <figure>
            {image ? (
              <img src={image} alt="由本段提示词真实生成的绘本画面" />
            ) : (
              <div role="status">尚未为本段生成画面</div>
            )}
            <span>16:9</span>
          </figure>
          {notice && <p className={s.notice}>{notice}</p>}
          <div className={s.imageActions}>
            <button onClick={generate}>
              <RefreshCw />
              不满意，修改并重绘
            </button>
            <button
              onClick={() =>
                setIndex(Math.min(Math.max(0, segments.length - 1), index + 1))
              }
            >
              满意，进入下一段　→
            </button>
          </div>
        </section>
      </div>
      <section className={s.storyboard}>
        <header>
          <h2>连续绘本场景（6 段）</h2>
          <span>统一画风将应用于整个绘本</span>
        </header>
        <div>
          {segments.map((_, i) => (
            <button
              key={i}
              className={index === i ? s.selected : ""}
              onClick={() => setIndex(i)}
            >
              {image && i === index ? (
                <img src={image} alt="当前段落绘本缩略图" />
              ) : (
                <ImageIcon />
              )}
              <b>{i + 1}</b>
              <span>
                第 {i + 1} 段　{image && i === index ? "已生成" : "待生成"}
              </span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
