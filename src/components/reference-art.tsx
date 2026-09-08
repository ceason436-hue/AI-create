/* eslint-disable @next/next/no-img-element -- generated data URLs and selected local artwork need native image rendering */
"use client";
import { useEffect, useRef, useState } from "react";
import {
  Type,
  Image as ImageIcon,
  Plus,
  Sparkles,
  Settings,
  Scale,
  Box,
  Pencil,
  Download,
  MessageSquare,
  Scan,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Monitor,
  Check,
  X,
} from "lucide-react";
import { ReferenceAsset } from "./reference-asset";
import s from "./reference-art.module.css";
import { getBrowserToolStorage } from "@/lib/browser-tool-storage";
import { useToolSession } from "@/lib/use-tool-session";
type Work = {
  id: string;
  url: string;
  prompt: string;
  createdAt: number;
  demo?: number;
};
type StableAiPayload = {
  status?: unknown;
  result?: { kind?: unknown; preview?: { image?: unknown } };
  error?: unknown;
  code?: unknown;
  requestId?: unknown;
};
function payloadError(
  payload: StableAiPayload | null,
  fallback: string,
  requestId: string | null,
) {
  const message = typeof payload?.error === "string" ? payload.error : fallback,
    code = typeof payload?.code === "string" ? ` [${payload.code}]` : "",
    trace = requestId ? ` （请求编号：${requestId}）` : "";
  return `${message}${code}${trace}`;
}
const initialPrompt =
  "未来的智慧教室，宽敞明亮，学生佩戴 AR 眼镜与 AI 助教互动，\n全息投影展示 3D 模型与数据可视化图表，桌面有平板电脑和笔记本，\n氛围科技感、教育感、积极向上。";
const demoWorks: Work[] = Array.from({ length: 4 }, (_, i) => ({
  id: `demo-${i}`,
  url: `/media/reference-v4/hd/art-classroom-${i + 1}.webp`,
  prompt: initialPrompt,
  createdAt: 0,
  demo: i,
}));
const styleOptions = [
  {
    name: "科教科技",
    src: "/media/reference-v4/hd/art-styles.webp",
    width: 2000,
    box: "10 30 980 680",
  },
  {
    name: "清新明亮",
    src: "/media/reference-v4/hd/art-styles.webp",
    width: 2000,
    box: "1010 30 980 680",
  },
  {
    name: "写实摄影",
    src: "/media/reference-v4/hd/art-styles.webp",
    width: 2000,
    box: "10 790 980 680",
  },
  {
    name: "线稿插画",
    src: "/media/reference-v4/hd/art-styles.webp",
    width: 2000,
    box: "1010 790 980 680",
  },
];
const compositions = [
  { name: "横向广角", copy: "场景开阔，信息丰富" },
  { name: "中心构图", copy: "主体居中，突出重点" },
  { name: "三分构图", copy: "画面平衡，层次分明" },
  { name: "引导线构图", copy: "视线引导，纵深感强" },
  { name: "对称构图", copy: "稳定平衡，秩序感强" },
];
const ratios = [
  { name: "1:1", copy: "正方形", icon: Square },
  { name: "16:9", copy: "横向宽屏", icon: RectangleHorizontal },
  { name: "9:16", copy: "竖向屏", icon: RectangleVertical },
  { name: "4:3", copy: "标准屏", icon: Monitor },
];
function Artwork({ work, className = "" }: { work: Work; className?: string }) {
  return <img src={work.url} alt={work.prompt} className={className} />;
}
export function ReferenceArt() {
  const toolSession = useToolSession(),
    storageIdentity = toolSession.storageIdentity,
    personal = storageIdentity === "PERSONAL";
  const [mode, setMode] = useState<"text2img" | "img2img">("text2img"),
    [prompt, setPrompt] = useState(initialPrompt),
    [style, setStyle] = useState("科教科技"),
    [composition, setComposition] = useState("横向广角"),
    [ratio, setRatio] = useState("16:9"),
    [reference, setReference] = useState<string | null>(null),
    [tab, setTab] = useState("当前生成"),
    [works, setWorks] = useState<Work[]>([]),
    [results, setResults] = useState(demoWorks),
    [selected, setSelected] = useState(0),
    [compareMode, setCompareMode] = useState(false),
    [checked, setChecked] = useState<string[]>([]),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [count, setCount] = useState(1),
    [avoid, setAvoid] = useState("");
  const upload = useRef<HTMLInputElement>(null),
    promptInput = useRef<HTMLTextAreaElement>(null),
    settings = useRef<HTMLDialogElement>(null),
    comparison = useRef<HTMLDialogElement>(null),
    records = useRef<Work[]>([]),
    controller = useRef<AbortController | null>(null);
  const current = results[selected] || results[0];
  useEffect(() => {
    if (!toolSession.verified) return;
    try {
      const parsed =
        getBrowserToolStorage("ai-art", storageIdentity).get<Work[]>("works") ??
        [];
      if (Array.isArray(parsed)) {
        const saved = parsed.filter(
          (w) =>
            w &&
            typeof w.id === "string" &&
            typeof w.url === "string" &&
            typeof w.prompt === "string" &&
            typeof w.createdAt === "number",
        );
        records.current = saved;
        setWorks(saved);
      }
    } catch {}
    return () => controller.current?.abort();
  }, [storageIdentity, toolSession.verified]);
  function persist(next: Work[]) {
    records.current = next;
    setWorks(next);
    try {
      getBrowserToolStorage("ai-art", storageIdentity).set("works", next);
    } catch {
      setNotice("浏览器存储空间不足，请下载作品保存。");
    }
  }
  async function dataUrl(url: string) {
    if (url.startsWith("data:")) return url;
    const res = await fetch(url);
    if (!res.ok) throw Error("无法读取参考图片。");
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(Error("图片读取失败"));
      reader.readAsDataURL(blob);
    });
  }
  async function cloudSave(work: Work, requestId: string | null) {
    if (!personal) return work;
    const match = work.url.match(
        /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/,
      ),
      trace = requestId ? ` （请求编号：${requestId}）` : "";
    if (!match)
      throw new Error(`画面已生成，但返回格式不能写入作品库。${trace}`);
    const response = await fetch("/api/works", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(requestId ? { "x-ai-request-id": requestId } : {}),
        },
        body: JSON.stringify({
          type: "IMAGE",
          title: work.prompt.slice(0, 200),
          mimeType: match[1],
          contentBase64: match[2],
        }),
      }),
      data = (await response.json().catch(() => null)) as {
        error?: unknown;
        work?: { id?: unknown };
      } | null;
    if (!response.ok)
      throw new Error(
        `${typeof data?.error === "string" ? data.error : "画面已生成，云端保存失败，请重试。"}${trace}`,
      );
    if (typeof data?.work?.id !== "string")
      throw new Error(`作品库返回了无效结果。${trace}`);
    return {
      ...work,
      id: data.work.id,
      url: `/api/works/${data.work.id}/download`,
    };
  }
  async function currentReference() {
    return dataUrl(current.url);
  }
  async function generate(variant = false) {
    if (busy) return;
    if (!toolSession.verified) {
      setNotice("正在验证会话，请稍后重试。");
      return;
    }
    if (!prompt.trim()) {
      setNotice("请填写创作描述。");
      promptInput.current?.focus();
      return;
    }
    if (mode === "img2img" && !reference && !variant) {
      setNotice("请先上传参考图片。");
      upload.current?.click();
      return;
    }
    setBusy(true);
    setNotice("");
    const abort = new AbortController();
    controller.current = abort;
    try {
      const ref = variant ? await currentReference() : reference;
      if (ref && ref.length > 3500000)
        throw Error("参考图片过大，请上传2MB以内的图片。");
      const generated: Work[] = [];
      for (let i = 0; i < count; i++) {
        const response = await fetch("/api/minimax/image", {
          signal: abort.signal,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": crypto.randomUUID(),
          },
          body: JSON.stringify({
            mode: variant ? "img2img" : mode,
            prompt: `${prompt}\n构图：${composition}${avoid ? `。避免：${avoid}` : ""}`,
            ratio,
            style,
            referenceImage: variant || mode === "img2img" ? ref : undefined,
          }),
        });
        const data = (await response
            .json()
            .catch(() => null)) as StableAiPayload | null,
          requestId =
            response.headers.get("x-ai-request-id") ||
            (typeof data?.requestId === "string" ? data.requestId : null),
          image =
            data?.result?.kind === "IMAGE"
              ? data.result.preview?.image
              : undefined;
        if (!response.ok)
          throw Error(payloadError(data, "图片生成失败，请重试。", requestId));
        if (data?.status !== "SUCCEEDED" || typeof image !== "string" || !image)
          throw Error(
            payloadError(data, "图片服务返回了无效结果。", requestId),
          );
        const work = await cloudSave(
          {
            id: crypto.randomUUID(),
            url: image,
            prompt,
            createdAt: Date.now(),
          },
          requestId,
        );
        generated.push(work);
        if (personal) {
          records.current = [];
          setWorks([]);
          getBrowserToolStorage("ai-art", storageIdentity).clear();
        } else persist([work, ...records.current]);
        setResults([...generated]);
        setChecked([]);
        setSelected(0);
        setTab("当前生成");
      }
      setChecked([]);
    } catch (e) {
      if (!abort.signal.aborted)
        setNotice(e instanceof Error ? e.message : "生成失败，请稍后重试。");
    } finally {
      setBusy(false);
    }
  }
  function uploadFile(file?: File) {
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      setNotice("请选择2MB以内的PNG、JPEG或WebP图片。");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setReference(String(reader.result));
      setMode("img2img");
      setNotice("");
    };
    reader.readAsDataURL(file);
  }
  function choose(index: number) {
    if (compareMode) {
      const id = results[index].id;
      setChecked((previous) =>
        previous.includes(id)
          ? previous.filter((x) => x !== id)
          : previous.length < 4
            ? [...previous, id]
            : previous,
      );
    } else setSelected(index);
  }
  function compare() {
    if (results.filter((w) => checked.includes(w.id)).length < 2) {
      setCompareMode(true);
      setNotice("请选择2–4张结果进行对比。");
      return;
    }
    comparison.current?.showModal();
  }
  async function edit() {
    try {
      setReference(await currentReference());
      setMode("img2img");
      setPrompt(current.prompt);
      promptInput.current?.focus();
      promptInput.current?.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
      setNotice("修改描述后生成，将参考当前画面继续创作。");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "无法打开参考图片");
    }
  }
  function save() {
    if (current.demo !== undefined) {
      setNotice("当前为效果图示例，请生成自己的作品后保存。");
      return;
    }
    const a = document.createElement("a");
    a.href = current.url;
    a.download = `AI绘画-${current.id}.${current.url.startsWith("data:image/jpeg") ? "jpg" : current.url.startsWith("data:image/webp") ? "webp" : "png"}`;
    a.target = "_blank";
    a.rel = "noopener";
    a.click();
    setNotice("已打开图片下载；历史作品与云端保存状态以实际结果为准。");
  }
  return (
    <main className={s.page} aria-label="AI绘画创作工作台">
      <div className={s.workspace}>
        <section className={s.form} aria-label="绘画创作设置">
          <div className={s.mode} role="tablist" aria-label="绘画模式">
            <button
              role="tab"
              aria-selected={mode === "text2img"}
              className={mode === "text2img" ? s.active : ""}
              onClick={() => setMode("text2img")}
            >
              <Type />
              文生图
            </button>
            <button
              role="tab"
              aria-selected={mode === "img2img"}
              className={mode === "img2img" ? s.active : ""}
              onClick={() => setMode("img2img")}
            >
              <ImageIcon />
              图生图
            </button>
          </div>
          <input
            ref={upload}
            hidden
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => uploadFile(e.target.files?.[0])}
          />
          {mode === "img2img" && (
            <div className={s.uploadStage}>
              {reference ? (
                <>
                  <img src={reference} alt="已上传参考图" />
                  <button
                    className={s.removeReference}
                    onClick={() => setReference(null)}
                    aria-label="移除参考图"
                  >
                    <X />
                  </button>
                  <button
                    className={s.replaceReference}
                    onClick={() => upload.current?.click()}
                  >
                    更换图片
                  </button>
                </>
              ) : (
                <button
                  className={s.uploadSquare}
                  onClick={() => upload.current?.click()}
                >
                  <Plus />
                  <strong>上传图片</strong>
                  <span>点击或拖放参考图</span>
                  <small>PNG / JPG / WebP，≤ 2MB</small>
                </button>
              )}
            </div>
          )}
          <div className={s.field}>
            <div className={s.label}>
              <label htmlFor="art-prompt">创作描述</label>
              <button onClick={() => setPrompt("")}>清空</button>
            </div>
            <div className={s.prompt}>
              <textarea
                id="art-prompt"
                ref={promptInput}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                maxLength={500}
              />
              <small>{prompt.length} / 500</small>
            </div>
          </div>
          <fieldset className={s.field}>
            <legend>风格 / 参考</legend>
            <div className={s.styleList}>
              {styleOptions.map((option) => (
                <button
                  key={option.name}
                  aria-pressed={style === option.name}
                  className={style === option.name ? s.chosen : ""}
                  onClick={() => setStyle(option.name)}
                >
                  <ReferenceAsset
                    src={option.src}
                    sourceWidth={option.width}
                    box={option.box}
                    alt={option.name}
                  />
                  <span>{option.name}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className={s.field}>
            <legend>构图指南</legend>
            <div className={s.compositions}>
              {compositions.map((c, i) => (
                <button
                  className={composition === c.name ? s.chosen : ""}
                  aria-pressed={composition === c.name}
                  onClick={() => setComposition(c.name)}
                  key={c.name}
                >
                  <svg viewBox="0 0 60 38" aria-hidden="true">
                    <rect
                      x="2"
                      y="2"
                      width="56"
                      height="34"
                      fill={i === 0 ? "#e5eeff" : "#f4f5f8"}
                      stroke="currentColor"
                      strokeWidth=".8"
                    />
                    {i === 0 ? (
                      <>
                        <path
                          d="M2 2L58 36M58 2L2 36"
                          stroke="currentColor"
                          strokeWidth=".6"
                        />
                        <rect
                          x="2"
                          y="11"
                          width="56"
                          height="16"
                          fill="#99b8f7"
                        />
                      </>
                    ) : i === 1 ? (
                      <>
                        <circle
                          cx="30"
                          cy="19"
                          r="6"
                          stroke="currentColor"
                          fill="#d8dfed"
                        />
                        <path
                          d="M2 2L30 19L58 2M2 36L30 19L58 36"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth=".6"
                        />
                      </>
                    ) : i === 2 ? (
                      <path
                        d="M20 2V36M40 2V36M2 13H58M2 25H58"
                        stroke="currentColor"
                        strokeWidth=".7"
                      />
                    ) : (
                      <path
                        d="M2 2L58 36M58 2L2 36M30 2V36M2 19H58M15 2V36M45 2V36"
                        stroke="currentColor"
                        strokeWidth=".6"
                      />
                    )}
                  </svg>
                  <strong>{c.name}</strong>
                  <small>{c.copy}</small>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className={s.field}>
            <legend>生成比例</legend>
            <div className={s.ratios}>
              {ratios.map(({ name, copy, icon: Icon }) => (
                <button
                  className={ratio === name ? s.chosen : ""}
                  aria-pressed={ratio === name}
                  onClick={() => setRatio(name)}
                  key={name}
                >
                  <Icon />
                  <span>
                    <strong>{name}</strong>
                    <small>{copy}</small>
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
          <div className={s.generateRow}>
            <button
              className={s.generate}
              onClick={() => generate()}
              disabled={busy}
            >
              <Sparkles />
              {busy ? "正在生成画面…" : "生成画面"}
            </button>
            <button
              className={s.settings}
              onClick={() => settings.current?.showModal()}
            >
              <Settings />
              高级设置
            </button>
          </div>
          {notice && (
            <p className={s.notice} role="status">
              {notice}
            </p>
          )}
        </section>
        <section className={s.results} aria-label="绘画结果">
          <div className={s.tabs} role="tablist" aria-label="作品分类">
            {["当前生成", "历史作品"].map((t) => (
              <button
                role="tab"
                aria-selected={tab === t}
                className={tab === t ? s.selectedTab : ""}
                onClick={() => setTab(t)}
                key={t}
              >
                {t}
              </button>
            ))}
          </div>
          {tab === "当前生成" ? (
            <>
              <div className={s.canvas}>
                <Artwork work={current} />
                {busy && (
                  <div className={s.generating}>AI 正在绘制画面，请稍候…</div>
                )}
              </div>
              <div className={s.resultLabel}>
                <strong>
                  生成结果{" "}
                  <span>
                    （共 {results.length} 张
                    {current.demo !== undefined ? "示例" : ""}）
                  </span>
                </strong>
                <label>
                  <input
                    type="checkbox"
                    checked={compareMode}
                    onChange={(e) => {
                      setCompareMode(e.target.checked);
                      setChecked([]);
                    }}
                  />{" "}
                  对比模式（选择 2–4 张）
                </label>
              </div>
              <div className={s.thumbnails}>
                {results.map((work, i) => (
                  <button
                    className={
                      (compareMode ? checked.includes(work.id) : selected === i)
                        ? s.selectedImage
                        : ""
                    }
                    aria-label={`选择方案${i + 1}`}
                    aria-pressed={
                      compareMode ? checked.includes(work.id) : selected === i
                    }
                    onClick={() => choose(i)}
                    key={work.id}
                  >
                    <Artwork work={work} />
                    <span>{i + 1}</span>
                    {(compareMode
                      ? checked.includes(work.id)
                      : selected === i) && <Check />}
                  </button>
                ))}
              </div>
              <div className={s.actions}>
                <button onClick={compare}>
                  <Scale />
                  <span>
                    <strong>比较所选</strong>
                    <small>对比差异</small>
                  </span>
                </button>
                <button onClick={() => generate(true)} disabled={busy}>
                  <Box />
                  <span>
                    <strong>生成变体</strong>
                    <small>基于所选图生成</small>
                  </span>
                </button>
                <button onClick={edit} disabled={busy}>
                  <Pencil />
                  <span>
                    <strong>继续编辑</strong>
                    <small>在当前图基础上修改</small>
                  </span>
                </button>
                <button className={s.save} onClick={save}>
                  <Download />
                  <span>
                    <strong>保存作品</strong>
                    <small>下载到本地</small>
                  </span>
                </button>
              </div>
            </>
          ) : (
            <div className={s.history}>
              {works.length ? (
                works.map((work) => (
                  <article key={work.id}>
                    <button
                      onClick={() => {
                        setResults([work]);
                        setChecked([]);
                        setSelected(0);
                        setTab("当前生成");
                      }}
                    >
                      <Artwork work={work} />
                      <p>{work.prompt}</p>
                    </button>
                    <button
                      onClick={() =>
                        persist(records.current.filter((w) => w.id !== work.id))
                      }
                    >
                      删除
                    </button>
                  </article>
                ))
              ) : (
                <p>还没有历史作品，开始创作你的第一张画面。</p>
              )}
            </div>
          )}
        </section>
      </div>
      <section className={s.process} aria-label="绘画创作流程">
        {[
          {
            title: "描述主体",
            copy: "清晰描述想要的画面内容",
            icon: MessageSquare,
          },
          { title: "确定构图", copy: "选择合适的构图与比例", icon: Scan },
          {
            title: "比较结果",
            copy: "对比多张生成结果，选择最佳",
            icon: Scale,
          },
          { title: "继续修改", copy: "生成变体或编辑细化细节", icon: Pencil },
        ].map(({ title, copy, icon: Icon }, i) => (
          <article key={title}>
            <Icon />
            <div>
              <h2>{title}</h2>
              <p>{copy}</p>
            </div>
            {i < 3 && <span>╌╌╌╌╌➤</span>}
          </article>
        ))}
      </section>
      <dialog ref={settings} className={s.dialog}>
        <h2>高级设置</h2>
        <label>
          生成数量
          <select value={count} onChange={(e) => setCount(+e.target.value)}>
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n} 张
              </option>
            ))}
          </select>
        </label>
        <label>
          避免出现的内容
          <textarea
            value={avoid}
            onChange={(e) => setAvoid(e.target.value)}
            maxLength={300}
            placeholder="例如：模糊、变形的物体"
          />
        </label>
        <button onClick={() => settings.current?.close()}>应用设置</button>
      </dialog>
      <dialog ref={comparison} className={`${s.dialog} ${s.compareDialog}`}>
        <div>
          <h2>比较所选画面</h2>
          <button onClick={() => comparison.current?.close()}>关闭 ×</button>
        </div>
        <section>
          {results
            .filter((w) => checked.includes(w.id))
            .map((work) => (
              <figure key={work.id}>
                <Artwork work={work} />
                <figcaption>方案 {results.indexOf(work) + 1}</figcaption>
              </figure>
            ))}
        </section>
      </dialog>
    </main>
  );
}
