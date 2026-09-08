"use client";
import { useEffect, useRef, useState } from "react";
import {
  Music2,
  Guitar,
  Keyboard,
  Drum,
  Mic,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Info,
  PlusCircle,
  Pencil,
  RefreshCw,
  Download,
  Heart,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  AudioLines,
  ChevronDown,
  ChartNoAxesColumn,
} from "lucide-react";
import s from "./reference-music.module.css";
import { getBrowserToolStorage } from "@/lib/browser-tool-storage";
import { useToolSession } from "@/lib/use-tool-session";

type Track = {
  id: string;
  title: string;
  audioUrl?: string;
  prompt?: string;
  lyrics?: string;
  status?: string;
  duration?: string;
  tags?: string[];
  cover?: string;
  progress?: number;
  favorite?: boolean;
  version?: number;
};
type StableMusicPayload = {
  status?: unknown;
  result?: {
    kind?: unknown;
    preview?: { text?: unknown; audioUrl?: unknown; traceId?: unknown };
  };
  error?: unknown;
  code?: unknown;
  requestId?: unknown;
};
function payloadError(
  payload: StableMusicPayload | null,
  fallback: string,
  requestId: string | null,
) {
  const message = typeof payload?.error === "string" ? payload.error : fallback,
    code = typeof payload?.code === "string" ? ` [${payload.code}]` : "",
    trace = requestId ? ` （请求编号：${requestId}）` : "";
  return `${message}${code}${trace}`;
}
const initialLyrics =
  "在城市的夜空下，灯火像星星洒落，\n风穿过街道，带来远方的歌。\n我们慢慢走着，把孤单都遗忘，\n明天会更温柔。";
const initialStyle =
  "温暖、治愈、希望的氛围，慢速抒情流行，副歌情绪上扬；\n以钢琴和木吉他为主，加入弦乐铺底，鼓点轻柔，女生清澈人声。";
const genres = [
  "流行 Pop",
  "民谣 Folk",
  "摇滚 Rock",
  "电子 Electronic",
  "R&B",
  "嘻哈 Hip Hop",
];
const instruments = [
  { name: "钢琴", icon: Keyboard },
  { name: "木吉他", icon: Guitar },
  { name: "弦乐", icon: Music2 },
  { name: "鼓组", icon: Drum },
  { name: "贝斯", icon: Guitar },
  { name: "合成器", icon: Keyboard },
  { name: "人声", icon: Mic },
];
const demo: Track = {
  id: "demo-night",
  title: "夜空下的温柔",
  prompt: initialStyle,
  lyrics: initialLyrics,
};
function clock(t: number) {
  return `${Math.floor(t / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(t % 60)
    .toString()
    .padStart(2, "0")}`;
}
export function ReferenceMusic() {
  const toolSession = useToolSession(), storageIdentity = toolSession.storageIdentity, personal = storageIdentity === "PERSONAL";
  const [lyrics, setLyrics] = useState(initialLyrics),
    [style, setStyle] = useState(initialStyle),
    [title, setTitle] = useState(demo.title),
    [genre, setGenre] = useState(genres[0]),
    [selected, setSelected] = useState(["钢琴", "木吉他", "弦乐", "鼓组"]),
    [tab, setTab] = useState("当前作品"),
    [tracks, setTracks] = useState<Track[]>([]),
    [favorites, setFavorites] = useState<Track[]>([]),
    [current, setCurrent] = useState<Track>(demo),
    [busy, setBusy] = useState(false),
    [polishing, setPolishing] = useState(false),
    [notice, setNotice] = useState(""),
    [playing, setPlaying] = useState(false),
    [time, setTime] = useState(0),
    [duration, setDuration] = useState(0),
    [volume, setVolume] = useState(0.7),
    [compare, setCompare] = useState(false),
    [more, setMore] = useState(false);
  const records = useRef<Track[]>([]),
    requestVersion = useRef(0),
    requestAbort = useRef<AbortController | null>(null);
  const audio = useRef<HTMLAudioElement>(null),
    lyricsInput = useRef<HTMLTextAreaElement>(null),
    compareDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!toolSession.verified) return;
    if (personal) {
      void fetch("/api/works")
        .then((response) => (response.ok ? response.json() : Promise.reject()))
        .then((data) => {
          const cloud: Track[] = (data.works || [])
            .filter((work: { type: string }) => work.type === "MUSIC")
            .map(
              (work: {
                id: string;
                title: string;
                favorite: boolean;
                version: number;
              }) => ({
                id: work.id,
                title: work.title,
                audioUrl: `/api/works/${work.id}/download`,
                status: "completed",
                favorite: work.favorite,
                version: work.version,
              }),
            );
          records.current = cloud;
          setTracks(cloud);
          setFavorites(cloud.filter((track) => track.favorite));
        })
        .catch(() => setNotice("云端音乐作品暂时无法加载。"));
      return;
    }
    try {
      const storage = getBrowserToolStorage("ai-music", storageIdentity),
        saved = storage.get<Track[]>("tracks") ?? [];
      if (Array.isArray(saved)) {
        records.current = saved;
        setTracks(saved);
      }
      const fav = storage.get<Track[]>("favorites") ?? [];
      if (Array.isArray(fav)) setFavorites(fav);
    } catch {}
  }, [personal, storageIdentity, toolSession.verified]);
  function saveTracks(value: Track[] | ((previous: Track[]) => Track[])) {
    const next = typeof value === "function" ? value(records.current) : value;
    records.current = next;
    setTracks(next);
    getBrowserToolStorage("ai-music", storageIdentity).set("tracks", next);
  }
  async function favorite(track: Track) {
    if (!track.audioUrl) {
      setNotice("生成作品后可收藏自己的歌曲。");
      return;
    }
    const adding = !favorites.some((t) => t.id === track.id),
      next = adding
        ? [{ ...track, favorite: true }, ...favorites]
        : favorites.filter((t) => t.id !== track.id);
    try {
      if (personal) {
        const response = await fetch(`/api/works/${track.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ favorite: adding }),
          }),
          data = (await response.json().catch(() => null)) as {
            error?: unknown;
          } | null;
        if (!response.ok) {
          setNotice(
            typeof data?.error === "string"
              ? data.error
              : "收藏状态未能写入云端，请重试。",
          );
          return;
        }
        setTracks((previous) =>
          previous.map((item) =>
            item.id === track.id ? { ...item, favorite: adding } : item,
          ),
        );
        setFavorites(next);
        return;
      }
      setFavorites(next);
      getBrowserToolStorage("ai-music", storageIdentity).set("favorites", next);
    } catch {
      setNotice("收藏状态更新失败，请检查网络或存储空间后重试。");
    }
  }
  async function removeTrack(track: Track) {
    try {
      if (personal) {
        const response = await fetch(`/api/works/${track.id}`, {
            method: "DELETE",
          }),
          data = (await response.json().catch(() => null)) as {
            error?: unknown;
          } | null;
        if (!response.ok) {
          setNotice(
            typeof data?.error === "string"
              ? data.error
              : "云端作品删除失败，请重试。",
          );
          return;
        }
        records.current = records.current.filter(
          (item) => item.id !== track.id,
        );
        setTracks(records.current);
        setFavorites((previous) =>
          previous.filter((item) => item.id !== track.id),
        );
        return;
      }
      saveTracks((previous) => previous.filter((item) => item.id !== track.id));
    } catch {
      setNotice("作品删除失败，请检查网络或存储空间后重试。");
    }
  }
  async function polish() {
    setPolishing(true);
    setNotice("");
    try {
      const res = await fetch("/api/minimax/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `请润色以下歌词，保持主题，只输出歌词文本：${lyrics}`,
            },
          ],
        }),
      });
      const data = (await res
          .json()
          .catch(() => null)) as StableMusicPayload | null,
        requestId =
          res.headers.get("x-ai-request-id") ||
          (typeof data?.requestId === "string" ? data.requestId : null),
        text =
          data?.result?.kind === "TEXT" ? data.result.preview?.text : undefined;
      if (!res.ok) throw Error(payloadError(data, "歌词优化失败。", requestId));
      if (
        data?.status !== "SUCCEEDED" ||
        typeof text !== "string" ||
        !text.trim()
      )
        throw Error(payloadError(data, "歌词服务返回了无效结果。", requestId));
      setLyrics((previous) =>
        previous === lyrics ? text.slice(0, 1000) : previous,
      );
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "优化失败，请稍后重试");
    } finally {
      setPolishing(false);
    }
  }
  async function generate() {
    if (busy) return;
    if (!lyrics.trim() && !style.trim()) {
      setNotice("请先输入歌词、主题或风格描述。");
      lyricsInput.current?.focus();
      return;
    }
    const version = ++requestVersion.current;
    const controller = new AbortController();
    requestAbort.current = controller;
    setBusy(true);
    setNotice("");
    setTab("当前作品");
    try {
      const prompt = `${style}\n曲风：${genre}；乐器：${selected.join("、")}`;
      const res = await fetch("/api/minimax/music", {
        signal: controller.signal,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({ prompt, lyrics, songName: title }),
      });
      const data = (await res
        .json()
        .catch(() => null)) as StableMusicPayload | null;
      if (version !== requestVersion.current) return;
      const requestId =
          res.headers.get("x-ai-request-id") ||
          (typeof data?.requestId === "string" ? data.requestId : null),
        preview =
          data?.result?.kind === "MUSIC" ? data.result.preview : undefined,
        audioUrl = preview?.audioUrl;
      if (!res.ok) throw Error(payloadError(data, "音乐生成失败。", requestId));
      if (
        data?.status !== "SUCCEEDED" ||
        typeof audioUrl !== "string" ||
        !audioUrl
      )
        throw Error(payloadError(data, "音乐服务返回了无效结果。", requestId));
      let track: Track = {
        id:
          typeof preview?.traceId === "string"
            ? preview.traceId
            : crypto.randomUUID(),
        title: title || "未命名作品",
        audioUrl,
        prompt,
        lyrics,
        status: "completed",
        duration: "00:00",
        tags: ["AI原创", "最新"],
        cover: "/media/site-v3/music/night-city-cover-v2.png",
        progress: 100,
      };
      if (personal) {
        if (!requestId)
          throw new Error("音乐已生成，但缺少可追溯请求编号，未写入作品库。");
        const imported = await fetch("/api/works/import-audio", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sourceUrl: audioUrl,
              title: track.title,
              requestId,
              parentWorkId:
                current.audioUrl &&
                personal
                  ? current.id
                  : undefined,
            }),
          }),
          saved = (await imported.json().catch(() => null)) as {
            error?: unknown;
            workId?: unknown;
            downloadUrl?: unknown;
          } | null;
        if (!imported.ok)
          throw new Error(
            typeof saved?.error === "string"
              ? `${saved.error} （请求编号：${requestId}）`
              : `音乐已生成，但写入个人作品库失败。（请求编号：${requestId}）`,
          );
        if (
          typeof saved?.workId !== "string" ||
          typeof saved.downloadUrl !== "string"
        )
          throw new Error(`作品库返回了无效结果。（请求编号：${requestId}）`);
        track = { ...track, id: saved.workId, audioUrl: saved.downloadUrl };
        getBrowserToolStorage("ai-music", storageIdentity).clear();
        records.current = [];
        setTracks([track]);
      } else saveTracks((previous) => [track, ...previous]);
      audio.current?.pause();
      setCurrent(track);
      setPlaying(false);
      setTime(0);
      setDuration(0);
    } catch (e) {
      if (version === requestVersion.current && !controller.signal.aborted)
        setNotice(
          e instanceof Error ? e.message : "音乐生成失败，请稍后重试。",
        );
    } finally {
      if (version === requestVersion.current) setBusy(false);
    }
  }
  function edit(track: Track) {
    setTitle(track.title);
    setLyrics(track.lyrics || "");
    setStyle(track.prompt || "");
    lyricsInput.current?.focus();
    lyricsInput.current?.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
  }
  async function play() {
    if (!current.audioUrl) {
      setNotice("这是效果图中的示例结果。请先生成歌曲，再试听完整音频。");
      return;
    }
    if (!audio.current) return;
    try {
      if (playing) audio.current.pause();
      else await audio.current.play();
    } catch {
      setNotice("音频暂时无法播放，请重新生成或稍后重试。");
    }
  }
  function seek(value: number) {
    if (audio.current && duration) {
      audio.current.currentTime = Math.max(0, Math.min(duration, value));
      setTime(audio.current.currentTime);
    }
  }
  function download() {
    if (!current.audioUrl) {
      setNotice("生成作品后可保存音频。");
      return;
    }
    const a = document.createElement("a");
    a.href = current.audioUrl;
    a.download = `${current.title}.mp3`;
    a.target = "_blank";
    a.rel = "noopener";
    a.click();
  }
  function reset() {
    requestAbort.current?.abort();
    requestVersion.current++;
    setBusy(false);
    audio.current?.pause();
    setPlaying(false);
    setLyrics("");
    setStyle("");
    setTitle("");
    setCurrent(demo);
    setTime(0);
    setDuration(0);
    setNotice("");
    setTab("当前作品");
    lyricsInput.current?.focus();
  }
  useEffect(
    () => () => {
      requestAbort.current?.abort();
    },
    [],
  );
  const listed = tab === "收藏" ? favorites : tracks;
  return (
    <main className={s.page} aria-label="AI音乐创作工作台">
      <div className={s.workspace}>
        <section className={s.form} aria-label="音乐创作设置">
          <div className={s.field}>
            <label htmlFor="music-model">
              <b>1</b>选择模型 <Info />
            </label>
            <div className={s.model}>
              <select id="music-model" aria-label="选择音乐模型">
                <option>科瑞特音乐 · MiniMax Music 2.6</option>
              </select>
              <span>推荐</span>
              <small>中文创作 · 高保真</small>
              <ChevronDown />
            </div>
          </div>
          <div className={s.field}>
            <div className={s.labelRow}>
              <label htmlFor="music-lyrics">
                <b>2</b>描述歌词 / 主题 <small>（支持中文）</small>
                <Info />
              </label>
              <div>
                <button onClick={polish} disabled={polishing}>
                  <Sparkles />
                  {polishing ? "优化中" : "AI 优化"}
                </button>
                <button onClick={() => setLyrics("")}>
                  <Trash2 />
                  清空
                </button>
              </div>
            </div>
            <div className={s.inputBox}>
              <textarea
                ref={lyricsInput}
                id="music-lyrics"
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                maxLength={1000}
              />
              <small>{lyrics.length}/1000</small>
            </div>
          </div>
          <div className={s.field}>
            <div className={s.labelRow}>
              <label htmlFor="music-style">
                <b>3</b>音乐风格描述 <small>（情绪、风格、编曲等）</small>
                <Info />
              </label>
              <div>
                <button
                  onClick={() =>
                    setStyle(
                      style === initialStyle
                        ? "轻快、明亮的电子流行，充满少年探索的好奇心；合成器与清脆鼓点交织，适合科学冒险短片。"
                        : initialStyle,
                    )
                  }
                >
                  <Sparkles />
                  随机灵感
                </button>
                <button onClick={() => setStyle("")}>
                  <Trash2 />
                  清空
                </button>
              </div>
            </div>
            <div className={`${s.inputBox} ${s.styleBox}`}>
              <textarea
                id="music-style"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                maxLength={800}
              />
              <small>{style.length}/800</small>
            </div>
          </div>
          <fieldset className={s.field}>
            <legend>
              <b>4</b>风格 / 流派 <Info />
            </legend>
            <div className={s.chips}>
              {[
                ...genres,
                ...(more ? ["爵士 Jazz", "古典 Classical"] : []),
              ].map((g) => (
                <button
                  className={genre === g ? s.active : ""}
                  aria-pressed={genre === g}
                  key={g}
                  onClick={() => setGenre(g)}
                >
                  {g}
                </button>
              ))}
              <button onClick={() => setMore(!more)}>
                更多 <ChevronDown />
              </button>
            </div>
          </fieldset>
          <fieldset className={s.field}>
            <legend>
              <b>5</b>乐器与编制 <small>（可多选）</small>
              <Info />
            </legend>
            <div className={s.chips}>
              {instruments.map(({ name, icon: Icon }) => (
                <button
                  aria-pressed={selected.includes(name)}
                  className={selected.includes(name) ? s.active : ""}
                  key={name}
                  onClick={() =>
                    setSelected(
                      selected.includes(name)
                        ? selected.filter((n) => n !== name)
                        : [...selected, name],
                    )
                  }
                >
                  <Icon />
                  {name}
                </button>
              ))}
            </div>
          </fieldset>
          <div className={s.field}>
            <label htmlFor="music-title">
              <b>6</b>歌曲标题 <small>（可选）</small>
              <Info />
            </label>
            <div className={`${s.inputBox} ${s.titleBox}`}>
              <input
                id="music-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={50}
              />
              <small>{title.length}/50</small>
            </div>
          </div>
          <button className={s.generate} onClick={generate} disabled={busy}>
            <Sparkles />
            {busy ? "正在生成音乐…" : "开始生成"}
          </button>
          <div className={s.progress}>
            <span>生成进度：</span>
            <strong>{busy ? "处理中" : "待开始"}</strong>
            <progress
              aria-label="音乐生成进度"
              {...(busy ? {} : { value: 0, max: 100 })}
            />
            <span>{busy ? "等待音频返回" : "准备创作"}</span>
          </div>
          {notice && (
            <div className={s.notice} role="status">
              {notice}
              <button onClick={() => setNotice("")} aria-label="关闭音乐提示">
                ×
              </button>
            </div>
          )}
        </section>
        <section className={s.results} aria-label="音乐作品">
          <div className={s.tabs}>
            <div role="tablist" aria-label="作品分类">
              {["当前作品", "历史作品", "收藏"].map((t) => (
                <button
                  role="tab"
                  aria-selected={tab === t}
                  className={tab === t ? s.selectedTab : ""}
                  key={t}
                  onClick={() => setTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <button onClick={reset}>
              <PlusCircle />
              新建创作
            </button>
          </div>
          {tab === "当前作品" ? (
            <>
              <div className={s.empty}>
                <svg
                  className={s.emptyWave}
                  viewBox="0 0 740 150"
                  aria-hidden="true"
                >
                  <path d="M0 70H740" stroke="#bdccfb" strokeDasharray="4 7" />
                  {Array.from({ length: 80 }, (_, i) => (
                    <path
                      key={i}
                      d={`M${90 + i * 7} ${(70 - (Math.sin(i * 2.1) * Math.sin(i * 0.21) + 1) * 10).toFixed(3)}v${((Math.sin(i * 2.1) * Math.sin(i * 0.21) + 1) * 20).toFixed(3)}`}
                      stroke="#b8c8f4"
                    />
                  ))}
                  <circle
                    cx="370"
                    cy="60"
                    r="44"
                    fill="#fff"
                    stroke="#284ccc"
                    strokeDasharray="5 7"
                  />
                </svg>
                <Music2 className={s.emptyNote} />
                <Guitar className={s.guitar} />
                <Keyboard className={s.keyboard} />
                <h2>
                  {current.audioUrl ? "你的音乐作品已生成" : "还没有生成作品"}
                </h2>
                <p>
                  {current.audioUrl ? (
                    "试听、比较与修改，让作品更完整。"
                  ) : (
                    <>
                      在左侧输入歌词/主题和风格，点击「开始生成」
                      <br />
                      AI 将为你创作专属音乐
                    </>
                  )}
                </p>
              </div>
              <div className={s.divider}>
                {current.audioUrl ? "当前作品" : "示例结果预览"}
              </div>
              <article className={s.track}>
                <div className={s.trackBody}>
                  <svg
                    className={s.cover}
                    viewBox="0 0 1000 1000"
                    role="img"
                    aria-label="夜空城市音乐封面"
                  >
                    <image
                      href="/media/reference-v4/hd/music-cover.png"
                      width="1000"
                      height="1000"
                    />
                    <text
                      x="500"
                      y="258"
                      fill="white"
                      fontSize={Math.min(
                        90,
                        820 / Math.max(1, current.title.slice(0, 12).length),
                      )}
                      textAnchor="middle"
                      fontFamily="KaiTi, STKaiti, serif"
                      fontStyle="italic"
                      transform="rotate(-7 500 220)"
                    >
                      {current.title.slice(0, 12)}
                    </text>
                  </svg>
                  <div className={s.trackDetails}>
                    <div className={s.trackTitle}>
                      <h2>{current.title}</h2>
                      <span>v1.0</span>
                      <time>
                        {duration
                          ? clock(duration)
                          : current.audioUrl
                            ? "--:--"
                            : "03:42"}
                      </time>
                      <button
                        aria-label="查看作品提示"
                        onClick={() => {
                          setCompare(true);
                          compareDialog.current?.showModal();
                        }}
                      >
                        •••
                      </button>
                    </div>
                    <p className={s.meta}>
                      {current.audioUrl
                        ? "AI 原创音乐"
                        : "流行 · 抒情　 BPM 72　 调性 C Major"}
                      <span>{current.audioUrl ? "生成作品" : "示例预览"}</span>
                    </p>
                    <div className={s.waveform}>
                      <svg
                        viewBox="0 0 540 76"
                        preserveAspectRatio="none"
                        aria-label="音乐波形示意"
                      >
                        {Array.from({ length: 150 }, (_, i) => {
                          const h = Number(
                            (
                              5 +
                              Math.abs(Math.sin(i * 1.3) * Math.cos(i * 0.18)) *
                                57
                            ).toFixed(3),
                          );
                          return (
                            <line
                              key={i}
                              x1={i * 3.6}
                              x2={i * 3.6}
                              y1={38 - h / 2}
                              y2={38 + h / 2}
                              stroke={
                                i < 150 * (duration ? time / duration : 0.47)
                                  ? "#1437b0"
                                  : "#cbd5f7"
                              }
                              strokeWidth="1.8"
                            />
                          );
                        })}
                      </svg>
                      <input
                        type="range"
                        aria-label="播放进度"
                        min="0"
                        max={duration || 222}
                        value={time}
                        onChange={(e) => seek(+e.target.value)}
                        disabled={!current.audioUrl}
                      />
                    </div>
                    <div className={s.times}>
                      <span>{clock(time)}</span>
                      <span>
                        {duration
                          ? clock(duration)
                          : current.audioUrl
                            ? "--:--"
                            : "03:42"}
                      </span>
                    </div>
                    <div className={s.controls}>
                      <button
                        className={s.play}
                        onClick={play}
                        aria-label={playing ? "暂停音乐" : "播放音乐"}
                      >
                        {playing ? <Pause /> : <Play />}
                      </button>
                      <button
                        aria-label="后退10秒"
                        onClick={() => seek(time - 10)}
                      >
                        <SkipBack />
                      </button>
                      <button
                        aria-label="前进10秒"
                        onClick={() => seek(time + 10)}
                      >
                        <SkipForward />
                      </button>
                      <Volume2 />
                      <input
                        type="range"
                        aria-label="音量"
                        min="0"
                        max="1"
                        step=".01"
                        value={volume}
                        onChange={(e) => {
                          setVolume(+e.target.value);
                          if (audio.current)
                            audio.current.volume = +e.target.value;
                        }}
                      />
                      <button
                        className={s.compare}
                        onClick={() => {
                          setCompare(true);
                          compareDialog.current?.showModal();
                        }}
                      >
                        <ChartNoAxesColumn />
                        对比原始提示
                      </button>
                      <button
                        aria-label="收藏作品"
                        aria-pressed={favorites.some(
                          (t) => t.id === current.id,
                        )}
                        onClick={() => favorite(current)}
                      >
                        <Heart
                          fill={
                            favorites.some((t) => t.id === current.id)
                              ? "currentColor"
                              : "none"
                          }
                        />
                      </button>
                    </div>
                  </div>
                </div>
                <div className={s.trackActions}>
                  <button onClick={() => edit(current)}>
                    <Pencil />
                    继续编辑
                  </button>
                  <button onClick={generate} disabled={busy}>
                    <RefreshCw />
                    再次生成
                  </button>
                  <button className={s.save} onClick={download}>
                    <Download />
                    保存作品 <ChevronDown />
                  </button>
                </div>
              </article>
            </>
          ) : (
            <div className={s.history}>
              {listed.length ? (
                listed.map((track) => (
                  <article key={track.id}>
                    <Music2 />
                    <div>
                      <h2>{track.title}</h2>
                      <p>{track.prompt?.slice(0, 60)}</p>
                    </div>
                    <button
                      onClick={() => {
                        audio.current?.pause();
                        setCurrent(track);
                        setPlaying(false);
                        setTime(0);
                        setDuration(0);
                        setTab("当前作品");
                      }}
                    >
                      打开
                    </button>
                    <button
                      aria-label={`删除${track.title}`}
                      onClick={() =>
                        tab === "收藏"
                          ? void favorite(track)
                          : void removeTrack(track)
                      }
                    >
                      <Trash2 />
                    </button>
                  </article>
                ))
              ) : (
                <p>暂无{tab}，生成歌曲后会保存在这里。</p>
              )}
            </div>
          )}
        </section>
      </div>
      <section className={s.process} aria-label="音乐创作流程">
        {[
          { title: "描述情绪", copy: "输入歌词主题与风格需求", icon: Pencil },
          {
            title: "生成试听",
            copy: "AI 生成音乐并在线试听",
            icon: AudioLines,
          },
          {
            title: "修改表达",
            copy: "调整风格与编曲，完善作品",
            icon: SlidersHorizontal,
          },
        ].map(({ title: step, copy, icon: Icon }, i) => (
          <article key={step}>
            <b>{i + 1}</b>
            <div>
              <h2>
                {step}
                <Icon />
              </h2>
              <p>{copy}</p>
            </div>
          </article>
        ))}
      </section>
      <audio
        ref={audio}
        src={current.audioUrl}
        onTimeUpdate={() => setTime(audio.current?.currentTime || 0)}
        onLoadedMetadata={() => {
          setDuration(audio.current?.duration || 0);
          if (audio.current) audio.current.volume = volume;
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
      <dialog ref={compareDialog} className={s.dialog}>
        <h2>作品的原始提示</h2>
        {compare && (
          <>
            <h3>歌词 / 主题</h3>
            <p>{current.lyrics}</p>
            <h3>音乐风格</h3>
            <p>{current.prompt}</p>
          </>
        )}
        <button onClick={() => compareDialog.current?.close()}>关闭</button>
      </dialog>
    </main>
  );
}
