"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot, ChevronDown, ChevronLeft, Code2, Copy, Download, FilePlus2, FolderPlus,
  GripVertical, LayoutPanelTop, LoaderCircle, MessageSquarePlus, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Paperclip, Play,
  Maximize2, Minimize2, Send, Sparkles, X,
} from "lucide-react";
import s from "./reference-programming.module.css";
import { getBrowserToolStorage } from "@/lib/browser-tool-storage";
import { estimateProgrammingTokens, prepareProgrammingContext, PROGRAMMING_CONTEXT_LIMIT } from "@/lib/programming-context";
import { useToolSession } from "@/lib/use-tool-session";

type Attachment = { name: string; type: string; text?: string };
type Message = { id: string; role: "user" | "assistant"; content: string };
type Conversation = { id: string; title: string; messages: Message[]; source: string; contextSummary?: string; updatedAt: number };
type Project = { id: string; title: string; conversations: Conversation[] };
type StoredState = { projects: Project[]; activeProjectId?: string; activeConversationId?: string };
type StreamEvent = { type: string; text?: string; label?: string; source?: string; message?: string };

const blankConversation = (): Conversation => ({
  id: crypto.randomUUID(), title: "新任务", messages: [], source: "", updatedAt: Date.now(),
});
const blankProject = (): Project => ({ id: crypto.randomUUID(), title: "未命名项目", conversations: [blankConversation()] });

function parseNdjson(value: string): StreamEvent[] {
  return value.split("\n").flatMap((line) => {
    try { return line.trim() ? [JSON.parse(line) as StreamEvent] : []; } catch { return []; }
  });
}
function withoutSource(text: string) { return text.includes("```") ? text.slice(0, text.indexOf("```")).trimEnd() : text; }

export function ReferenceProgramming() {
  const toolSession = useToolSession();
  const storageIdentity = toolSession.storageIdentity;
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState("");
  const [activeConversationId, setActiveConversationId] = useState("");
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [stages, setStages] = useState<string[]>([]);
  const [tab, setTab] = useState<"preview" | "source">("preview");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [previewVisible, setPreviewVisible] = useState(true);
  const [previewFullscreen, setPreviewFullscreen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [previewWidth, setPreviewWidth] = useState(460);
  const uploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = getBrowserToolStorage("ai-programming-agent", storageIdentity).get<StoredState>("workspace");
      if (saved?.projects?.length) {
        setProjects(saved.projects); setActiveProjectId(saved.activeProjectId || saved.projects[0].id);
        setActiveConversationId(saved.activeConversationId || saved.projects[0].conversations[0]?.id || "");
      }
    } catch { /* a fresh local workspace is safe */ }
  }, [storageIdentity]);
  useEffect(() => {
    if (!projects.length) return;
    try {
      getBrowserToolStorage("ai-programming-agent", storageIdentity).set("workspace", { projects, activeProjectId, activeConversationId });
    } catch {
      setNotice("本地工作区存储已满，请先下载源码备份。");
    }
  }, [projects, activeProjectId, activeConversationId, storageIdentity]);
  useEffect(() => {
    if (!previewFullscreen) return;
    const previousOverflow = document.body.style.overflow;
    const leaveFullscreen = (event: KeyboardEvent) => { if (event.key === "Escape") setPreviewFullscreen(false); };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", leaveFullscreen);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", leaveFullscreen);
    };
  }, [previewFullscreen]);

  const activeProject = projects.find((project) => project.id === activeProjectId);
  const activeConversation = activeProject?.conversations.find((item) => item.id === activeConversationId);
  const messages = useMemo(() => activeConversation?.messages ?? [], [activeConversation?.messages]);
  const source = activeConversation?.source ?? "";
  function beginResize(kind: "sidebar" | "preview", event: React.PointerEvent<HTMLButtonElement>) {
    const start = event.clientX, initial = kind === "sidebar" ? sidebarWidth : previewWidth;
    const move = (pointer: PointerEvent) => {
      const delta = pointer.clientX - start;
      if (kind === "sidebar") setSidebarWidth(Math.min(420, Math.max(190, initial + delta)));
      else setPreviewWidth(Math.min(760, Math.max(340, initial - delta)));
    };
    const stop = () => { document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", stop); };
    document.addEventListener("pointermove", move); document.addEventListener("pointerup", stop);
  }

  function updateConversation(updater: (conversation: Conversation) => Conversation) {
    setProjects((items) => items.map((project) => project.id !== activeProjectId ? project : {
      ...project, conversations: project.conversations.map((conversation) => conversation.id === activeConversationId ? updater(conversation) : conversation),
    }));
  }
  function createProject() {
    const project = blankProject();
    setProjects((items) => [project, ...items]); setActiveProjectId(project.id); setActiveConversationId(project.conversations[0].id);
  }
  function createConversation(projectId = activeProjectId) {
    const conversation = blankConversation();
    setProjects((items) => items.map((project) => project.id === projectId ? { ...project, conversations: [conversation, ...project.conversations] } : project));
    setActiveProjectId(projectId); setActiveConversationId(conversation.id);
  }
  function selectConversation(projectId: string, conversationId: string) {
    setActiveProjectId(projectId); setActiveConversationId(conversationId); setDraft(""); setAttachments([]); setStages([]); setNotice("");
  }
  async function addFiles(files: FileList | null) {
    if (!files) return;
    const loaded = await Promise.all(Array.from(files).slice(0, 12).map(async (file): Promise<Attachment> => {
      const isText = file.type.startsWith("text/") || /\.(md|json|html?|css|js|ts|tsx|jsx|csv)$/i.test(file.name);
      if (!isText || file.size > 500_000) return { name: file.name, type: file.type || "file" };
      return { name: file.name, type: file.type || "text/plain", text: await file.text() };
    }));
    setAttachments((items) => [...items, ...loaded].slice(0, 12));
  }
  async function send() {
    const prompt = draft.trim();
    if (!prompt || busy) return;
    let projectId = activeProjectId, conversationId = activeConversationId;
    if (!projectId || !conversationId) {
      const project = blankProject(); projectId = project.id; conversationId = project.conversations[0].id;
      setProjects((items) => [project, ...items]); setActiveProjectId(projectId); setActiveConversationId(conversationId);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    const user: Message = { id: crypto.randomUUID(), role: "user", content: prompt };
    const assistant: Message = { id: crypto.randomUUID(), role: "assistant", content: "" };
    const preparedContext = prepareProgrammingContext({
      messages: [...messages, user].map(({ role, content }) => ({ role, content })),
      currentSource: source,
      summary: activeConversation?.contextSummary,
    });
    setDraft(""); setBusy(true); setNotice(""); setStages(["正在理解你的需求"]);
    const apply = (fn: (conversation: Conversation) => Conversation) => {
      setProjects((items) => items.map((project) => project.id !== projectId ? project : {
        ...project, title: project.title === "未命名项目" ? prompt.slice(0, 20) : project.title,
        conversations: project.conversations.map((conversation) => conversation.id === conversationId ? fn(conversation) : conversation),
      }));
    };
    apply((conversation) => ({
      ...conversation,
      title: conversation.messages.length ? conversation.title : prompt.slice(0, 24),
      messages: [...conversation.messages, user, assistant],
      contextSummary: preparedContext.summary,
      updatedAt: Date.now(),
    }));
    if (preparedContext.compacted) setNotice("历史上下文已自动压缩，当前源码、关键要求和最近任务已保留。");
    try {
      const response = await fetch("/api/minimax/code/stream", {
        method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({
          messages: preparedContext.messages,
          contextSummary: preparedContext.summary,
          currentSource: source,
          attachments,
        }),
      });
      if (!response.ok || !response.body) throw new Error((await response.json().catch(() => null))?.error || "AI 编程服务暂时无法响应。");
      const reader = response.body.getReader(), decoder = new TextDecoder(); let buffer = "";
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const complete = buffer.lastIndexOf("\n"); if (complete < 0) continue;
        const events = parseNdjson(buffer.slice(0, complete)); buffer = buffer.slice(complete + 1);
        for (const event of events) {
          if (event.type === "stage" && event.label) setStages((items) => [...items, event.label!]);
          if (event.type === "delta" && event.text) apply((conversation) => ({ ...conversation, messages: conversation.messages.map((item) => item.id === assistant.id ? { ...item, content: withoutSource(item.content + event.text!) } : item) }));
          if (event.type === "result" && event.source) apply((conversation) => ({ ...conversation, source: event.source!, messages: conversation.messages.map((item) => item.id === assistant.id ? { ...item, content: event.message || item.content || "成品已经完成，可以在右侧预览中体验。" } : item), updatedAt: Date.now() }));
          if (event.type === "error") throw new Error(event.message || "生成失败，请重试。");
        }
      }
      setTab("preview");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "生成失败，请重试。");
      apply((conversation) => ({ ...conversation, messages: conversation.messages.filter((item) => item.id !== assistant.id) }));
    } finally { setBusy(false); setAttachments([]); }
  }
  const empty = !activeConversation;
  const workspaceTitle = useMemo(() => activeProject?.title || "AI 编程 Agent", [activeProject?.title]);
  const contextTokens = useMemo(() => estimateProgrammingTokens([
    activeConversation?.contextSummary ?? "",
    source,
    ...messages.map((message) => message.content),
  ].join("\n")), [activeConversation?.contextSummary, messages, source]);
  const contextLabel = contextTokens >= 1_000 ? `${Math.round(contextTokens / 1_000)}k` : String(contextTokens);
  return <main className={`${s.page} ${!sidebarVisible ? s.sidebarClosed : ""} ${!previewVisible ? s.previewClosed : ""}`} style={{ gridTemplateColumns: `${sidebarVisible ? `${sidebarWidth}px` : "46px"} minmax(360px, 1fr) ${previewVisible ? `${previewWidth}px` : "46px"}` }} aria-label="AI 编程 Agent 工作台">
    <aside className={s.sidebar}>
      <div className={s.brand}><button className={s.back} aria-label="返回" onClick={() => history.back()}><ChevronLeft /></button>{sidebarVisible && <><Sparkles /><span>AI 编程</span></>}<button aria-label="新建项目" onClick={createProject}><FolderPlus /></button></div>
      <button className={s.collapse} aria-label={sidebarVisible ? "收起项目框" : "展开项目框"} onClick={() => setSidebarVisible((value) => !value)}>{sidebarVisible ? <PanelLeftClose /> : <PanelLeftOpen />}</button>
      {sidebarVisible && <>
      <p className={s.sideLabel}>项目与任务</p>
      <div className={s.projectList}>{projects.length ? projects.map((project) => <section key={project.id}>
        <div className={s.projectRow}><button onClick={() => setActiveProjectId(project.id)}><ChevronDown />{project.title}</button><button aria-label="在项目中创建新任务" onClick={() => createConversation(project.id)}><MessageSquarePlus /></button></div>
        {project.conversations.map((conversation) => <button key={conversation.id} className={conversation.id === activeConversationId ? s.selected : s.conversation} onClick={() => selectConversation(project.id, conversation.id)}>{conversation.title || "新任务"}</button>)}
      </section>) : <div className={s.sidebarEmpty}>创建一个项目，和 AI 一起把想法做成网页或小游戏。</div>}</div>
      <button className={s.newChat} onClick={() => activeProjectId ? createConversation() : createProject()}><MessageSquarePlus />新建任务</button>
      </>}
      {sidebarVisible && <button className={s.resizer} aria-label="拖拽调整项目框宽度" onPointerDown={(event) => beginResize("sidebar", event)}><GripVertical /></button>}
    </aside>
    <section className={s.chatPanel}>
      <header><div><p>当前项目</p><h1>{workspaceTitle}</h1></div><span title="超过 256k 时自动压缩历史，保留当前源码、关键要求与最近任务"><Bot />Agent 在线 · 上下文 {contextLabel}/{PROGRAMMING_CONTEXT_LIMIT / 1_000}k</span></header>
      <div className={s.messages}>
        {empty ? <div className={s.welcome}><Sparkles /><h2>把你的想法交给 AI</h2><p>例如：“制作一个让小学生练习乘法的闯关小游戏，画面明亮，答对有动画奖励。”</p><p>支持上传需求文档、代码、图片或其他参考资料。</p></div> : messages.map((message) => <article key={message.id} className={message.role === "user" ? s.userMessage : s.agentMessage}><span>{message.role === "user" ? "你" : <Bot />}</span><div>{message.content || (busy && message.role === "assistant" ? <em>正在组织可运行的成品…</em> : "")}</div></article>)}
        {stages.length > 0 && <div className={s.stages} aria-live="polite">{stages.map((stage, index) => <details key={`${stage}-${index}`} open={busy && index === stages.length - 1} className={index === stages.length - 1 && busy ? s.running : ""}><summary>{index + 1}. {stage}</summary>{busy && index === stages.length - 1 && <p>正在执行此阶段；完成后将自动折叠。</p>}</details>)}</div>}
      </div>
      <div className={s.composer}>
        {attachments.length > 0 && <div className={s.attachments}>{attachments.map((file, index) => <span key={`${file.name}-${index}`}><FilePlus2 />{file.name}<button aria-label={`移除 ${file.name}`} onClick={() => setAttachments((items) => items.filter((_, i) => i !== index))}><X /></button></span>)}</div>}
        <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder="描述你想制作的网页、小游戏或功能…" aria-label="编程需求" />
        <div><input ref={uploadRef} type="file" multiple hidden onChange={(event) => void addFiles(event.target.files)} /><button onClick={() => uploadRef.current?.click()}><Paperclip />上传参考</button><small>Enter 发送 · Shift + Enter 换行</small><button className={s.send} disabled={!draft.trim() || busy} onClick={() => void send()}>{busy ? <LoaderCircle className={s.spin} /> : <Send />}发送</button></div>
      </div>
    </section>
    <section className={`${s.previewPanel} ${previewFullscreen ? s.previewFullscreen : ""}`}>
      {!previewVisible && <button className={s.collapse} aria-label="展开预览框" onClick={() => setPreviewVisible(true)}><PanelRightOpen /></button>}
      {previewVisible && <>
      <header><div className={s.previewTabs}><button className={tab === "preview" ? s.active : ""} onClick={() => setTab("preview")}><LayoutPanelTop />页面预览</button><button className={tab === "source" ? s.active : ""} onClick={() => setTab("source")}><Code2 />源码</button></div><div className={s.previewActions}><button aria-label={previewFullscreen ? "退出全屏预览" : "全屏预览"} title={previewFullscreen ? "退出全屏（Esc）" : "全屏预览"} onClick={() => setPreviewFullscreen((value) => !value)}>{previewFullscreen ? <Minimize2 /> : <Maximize2 />}</button><button aria-label="复制源码" title="复制源码" disabled={!source} onClick={() => navigator.clipboard.writeText(source).then(() => setNotice("源码已复制。"))}><Copy /></button><button aria-label="下载源码" title="下载源码" disabled={!source} onClick={() => { const url = URL.createObjectURL(new Blob([source], { type: "text/html" })); const a = document.createElement("a"); a.href = url; a.download = "ai-agent-page.html"; a.click(); URL.revokeObjectURL(url); }}><Download /></button><button aria-label="收起预览框" title="收起预览框" onClick={() => { setPreviewFullscreen(false); setPreviewVisible(false); }}><PanelRightClose /></button></div></header>
      {source ? tab === "preview" ? <iframe title="AI 生成网页的安全预览" sandbox="allow-scripts allow-forms allow-modals" srcDoc={source} /> : <div className={s.sourceWorkspace}><label><span>可编辑源码</span><textarea className={s.sourceEditor} value={source} onChange={(event) => updateConversation((conversation) => ({ ...conversation, source: event.target.value, updatedAt: Date.now() }))} aria-label="可编辑的 HTML 源码" spellCheck={false} /></label><div><span>实时预览</span><iframe title="源码实时预览" sandbox="allow-scripts allow-forms allow-modals" srcDoc={source} /></div></div> : <div className={s.previewEmpty}><Play /><h2>预览会在这里出现</h2><p>开始一个工作任务后，Agent 会在这里持续更新可运行成品。</p></div>}
      </>}
      {previewVisible && !previewFullscreen && <button className={`${s.resizer} ${s.previewResizer}`} aria-label="拖拽调整预览框宽度" onPointerDown={(event) => beginResize("preview", event)}><GripVertical /></button>}
    </section>
    {notice && <div className={s.notice} role="status">{notice}<button onClick={() => setNotice("")}>关闭</button></div>}
  </main>;
}
