"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Send, Code2, MonitorPlay, Smartphone, Tablet, Monitor, 
  Copy, Download, History, Sparkles, AlertCircle, Maximize2, Minimize2
} from "lucide-react";

type Message = {
  role: "user" | "ai";
  content: string;
};

export default function AIProgrammingPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "你好！我是AI编程助手。你可以告诉我你想做什么网页，比如：“帮我写一个带动画效果的登录页面”或者“写一个待办事项应用”。\n\n我可以帮你：\n1. 从零生成包含复杂交互的网页\n2. 为现有的页面添加新功能\n3. 修改样式和布局" }
  ]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const loadingSteps = [
    "🤔 正在理解您的需求并构思逻辑...",
    "🎨 正在设计界面与交互细节...",
    "⚙️ 正在编写高质量的前端代码...",
    "✨ 正在组装并进行最终优化..."
  ];

  // 初始默认占位代码
  const [code, setCode] = useState(`<!-- 生成的代码将显示在这里 -->
<div style="display: flex; height: 100%; align-items: center; justify-content: center; font-family: sans-serif; flex-direction: column; background: #f8fafc;">
  <h1 style="color: #4F46E5; margin-bottom: 8px;">欢迎使用 AI 编程</h1>
  <p style="color: #64748b;">在左侧输入你的需求，我将为你生成可运行的代码！</p>
</div>`);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating, loadingStepIndex]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      setLoadingStepIndex(0);
      interval = setInterval(() => {
        setLoadingStepIndex(prev => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 2500); // 每 2.5 秒切换一次状态
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  useEffect(() => {
    // 当处于全屏状态时，强制隐藏全局导航栏，防止 z-index 冲突遮挡退出按钮
    const header = document.querySelector('header');
    if (header) {
      if (isFullscreen) {
        header.style.display = 'none';
        document.body.style.overflow = 'hidden'; // 防止全屏时背景还能滚动
      } else {
        header.style.display = '';
        document.body.style.overflow = '';
      }
    }
    return () => {
      if (header) header.style.display = '';
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  const extractHtml = (text: string) => {
    // 尝试提取 markdown 代码块中的 HTML (处理不区分大小写的 html 标签，以及可选的额外空格)
    const htmlMatch = text.match(/```(?:html|HTML)?\s*([\s\S]*?)```/);
    if (htmlMatch && htmlMatch[1]) {
      return htmlMatch[1].trim();
    }
    
    // 回退机制1：尝试匹配 <html> 到 </html> 之间的内容
    const rawHtmlMatch = text.match(/(<!DOCTYPE html>[\s\S]*?<\/html>)/i);
    if (rawHtmlMatch && rawHtmlMatch[1]) {
      return rawHtmlMatch[1].trim();
    }

    // 回退机制2：如果没有用代码块包裹，检查是否包含 <html 或 <div 标签，且尝试暴力清理首尾
    if (text.includes("<html") || text.includes("<div")) {
      let cleanedText = text.replace(/^[\s\S]*?(?=<!DOCTYPE|<html|<div)/i, ''); // 截断开头的乱七八糟文字
      cleanedText = cleanedText.replace(/(<\/html>|<\/div>)(?![\s\S]*(<\/html>|<\/div>))[\s\S]*$/i, '$1'); // 截断结尾的乱七八糟文字
      return cleanedText.trim();
    }
    
    return null;
  };

  const handleSend = async (forcedInput?: string) => {
    const userMsg = forcedInput || input;
    if (!userMsg.trim() || isGenerating) return;
    
    // 更新 UI
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    if (!forcedInput) setInput("");
    setIsGenerating(true);
    setError(null);

    try {
      // 准备发给 API 的消息历史
      const apiMessages = messages
        .filter(m => m.role === "user" || m.content.includes("```html")) // 简化上下文，主要带上用户的需求和含有代码的AI回复
        .map(m => ({
          role: m.role === "ai" ? "assistant" : "user",
          name: m.role === "ai" ? "assistant" : "user",
          content: m.content
        }));
      
      apiMessages.push({ role: "user", name: "user", content: userMsg });

      const response = await fetch('/api/minimax/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '生成失败');
      }

      const aiReply = data.choices?.[0]?.message?.content || "";
      
      const newHtml = extractHtml(aiReply);
      
      // 不管是否提取到 HTML，都将完整的带思考过程的回复保存下来，前端渲染时再处理
      setMessages(prev => [...prev, { role: "ai", content: aiReply }]);

      if (newHtml) {
        setCode(newHtml);
      }

    } catch (err: any) {
      console.error("Generate error:", err);
      setError(err.message || "请求发生错误");
      setMessages(prev => [...prev, { role: "ai", content: "抱歉，代码生成失败了，请重试。" }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated-page.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderMessageContent = (content: string, role: string) => {
    if (role === "user") {
      return content;
    }
    
    // 如果是 AI 回复，过滤掉包裹的代码块，并替换为美观的提示卡片
    const codeBlockRegex = /```(?:html|HTML)?\s*[\s\S]*?```/g;
    if (codeBlockRegex.test(content)) {
      const parts = content.split(codeBlockRegex);
      return (
        <div className="flex flex-col gap-2">
          {parts.map((part, index) => {
            const trimmed = part.trim();
            if (!trimmed) return null;
            return <div key={`text-${index}`} className="whitespace-pre-wrap">{trimmed}</div>;
          }).reduce((prev, curr, index) => {
            if (!prev && !curr) return null;
            if (!prev) return [
              <div key={`badge-${index}`} className="bg-blue-50 text-blue-700 px-3 py-2.5 rounded-xl text-xs font-bold my-1 border border-blue-200 flex items-center gap-2 shadow-sm w-fit">
                <div className="bg-blue-600 p-1.5 rounded-lg text-white">
                  <Code2 className="w-3.5 h-3.5" />
                </div>
                网页代码已生成并更新至右侧预览区 ✨
              </div>,
              curr
            ];
            if (!curr) return [
              prev,
              <div key={`badge-${index}`} className="bg-blue-50 text-blue-700 px-3 py-2.5 rounded-xl text-xs font-bold my-1 border border-blue-200 flex items-center gap-2 shadow-sm w-fit">
                <div className="bg-blue-600 p-1.5 rounded-lg text-white">
                  <Code2 className="w-3.5 h-3.5" />
                </div>
                网页代码已生成并更新至右侧预览区 ✨
              </div>
            ];
            return [
              prev,
              <div key={`badge-${index}`} className="bg-blue-50 text-blue-700 px-3 py-2.5 rounded-xl text-xs font-bold my-1 border border-blue-200 flex items-center gap-2 shadow-sm w-fit">
                <div className="bg-blue-600 p-1.5 rounded-lg text-white">
                  <Code2 className="w-3.5 h-3.5" />
                </div>
                网页代码已生成并更新至右侧预览区 ✨
              </div>,
              curr
            ];
          }, null as any)}
        </div>
      );
    }
    
    // 回退机制：如果直接包含了 <!DOCTYPE html>
    const rawHtmlRegex = /(<!DOCTYPE html>[\s\S]*?<\/html>)/i;
    if (rawHtmlRegex.test(content)) {
      const parts = content.split(rawHtmlRegex);
      return (
        <div className="flex flex-col gap-2">
          {parts[0] && parts[0].trim() && <div className="whitespace-pre-wrap">{parts[0].trim()}</div>}
          <div className="bg-blue-50 text-blue-700 px-3 py-2.5 rounded-xl text-xs font-bold my-1 border border-blue-200 flex items-center gap-2 shadow-sm w-fit">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white">
              <Code2 className="w-3.5 h-3.5" />
            </div>
            网页代码已生成并更新至右侧预览区 ✨
          </div>
          {parts[2] && parts[2].trim() && <div className="whitespace-pre-wrap">{parts[2].trim()}</div>}
        </div>
      );
    }

    return <div className="whitespace-pre-wrap">{content}</div>;
  };

  const getPreviewCode = () => {
    let finalCode = code;
    // 注入 viewport meta 标签，确保在不同设备尺寸下能够完美自适应和缩放
    if (!finalCode.includes('<meta name="viewport"')) {
      const viewportTag = '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">';
      if (finalCode.includes('<head>')) {
        finalCode = finalCode.replace('<head>', `<head>\n  ${viewportTag}`);
      } else if (finalCode.includes('<html>')) {
        finalCode = finalCode.replace('<html>', `<html>\n<head>\n  ${viewportTag}\n</head>`);
      } else {
        finalCode = `${viewportTag}\n${finalCode}`;
      }
    }
    
    // 注入 CSS 确保 body 高度能被正常滚动
    const scrollFixStyles = `<style>html, body { min-height: 100%; height: auto !important; overflow: auto !important; }</style>`;
    if (finalCode.includes('</head>')) {
      finalCode = finalCode.replace('</head>', `  ${scrollFixStyles}\n</head>`);
    } else {
      finalCode = `${scrollFixStyles}\n${finalCode}`;
    }

    return finalCode;
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)] gap-6 w-full relative">
      {/* 左侧：对话区域 */}
      <div className="w-full md:w-1/3 flex flex-col bg-white rounded-3xl shadow-sm border border-black/5 overflow-hidden">
        <div className="p-4 border-b border-black/5 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <h2 className="font-bold text-gray-800">需求对话</h2>
          </div>
        </div>
        
        {/* 聊天记录 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                msg.role === "user" 
                  ? "bg-blue-600 text-white rounded-tr-sm" 
                  : "bg-gray-100 text-gray-800 rounded-tl-sm leading-relaxed"
              }`}>
                {renderMessageContent(msg.content, msg.role)}
              </div>
            </div>
          ))}
          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 p-3 rounded-2xl rounded-tl-sm text-sm flex flex-col gap-2 min-w-[200px]">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-gray-600 font-medium animate-pulse">{loadingSteps[loadingStepIndex]}</span>
              </div>
            </div>
          )}
          {error && (
            <div className="flex justify-center">
              <div className="bg-red-50 text-red-600 px-3 py-1.5 rounded-full text-xs flex items-center gap-1 border border-red-100">
                <AlertCircle className="w-3 h-3" />
                {error}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 快捷指令区 */}
        {messages.length === 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            <button onClick={() => handleSend("帮我写一个带动画效果的登录页面")} className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1.5 rounded-full hover:bg-blue-100 transition">✨ 动画登录页</button>
            <button onClick={() => handleSend("写一个番茄钟计时器")} className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1.5 rounded-full hover:bg-blue-100 transition">🍅 番茄钟</button>
            <button onClick={() => handleSend("生成一个个人简历展示页")} className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1.5 rounded-full hover:bg-blue-100 transition">📄 个人简历页</button>
          </div>
        )}

        {/* 输入框 */}
        <div className="p-4 border-t border-black/5 bg-white">
          <div className="flex items-end gap-2 bg-gray-50 p-2 rounded-2xl border border-black/10 focus-within:border-blue-500 transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="描述你想生成的网页..."
              className="w-full bg-transparent resize-none max-h-32 min-h-[44px] p-2 focus:outline-none text-sm"
              rows={1}
            />
            <button 
              onClick={() => handleSend()}
              disabled={!input.trim() || isGenerating}
              className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 mb-1"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-2">按 Enter 发送，Shift + Enter 换行</p>
        </div>
      </div>

      {/* 右侧：预览与代码区域 */}
      <div className={`${isFullscreen ? "fixed inset-0 z-[99999] bg-white rounded-none m-0" : "w-full md:w-2/3 bg-white rounded-3xl"} flex flex-col shadow-2xl border border-black/10 overflow-hidden transition-all duration-300 ease-in-out`}>
        {/* 顶部工具栏 */}
        <div className="flex items-center justify-between p-3 border-b border-black/5 bg-gray-50 overflow-x-auto">
          {/* 模式切换 */}
          <div className="flex bg-gray-200/50 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "preview" ? "bg-white shadow-sm text-blue-600" : "text-gray-600 hover:text-gray-900"}`}
            >
              <MonitorPlay className="w-4 h-4" />
              页面预览
            </button>
            <button 
              onClick={() => setActiveTab("code")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "code" ? "bg-white shadow-sm text-blue-600" : "text-gray-600 hover:text-gray-900"}`}
            >
              <Code2 className="w-4 h-4" />
              源码检查
            </button>
          </div>

          <div className="flex items-center gap-4 px-2">
            {/* 响应式切换 (仅在预览模式显示) */}
            {activeTab === "preview" && (
              <div className="flex items-center gap-1 border-r border-gray-300 pr-4">
                <button onClick={() => setDevice("desktop")} className={`p-1.5 rounded-md transition-colors ${device === "desktop" ? "bg-gray-200 text-gray-900" : "text-gray-400 hover:text-gray-600"}`} title="电脑端"><Monitor className="w-4 h-4" /></button>
                <button onClick={() => setDevice("tablet")} className={`p-1.5 rounded-md transition-colors ${device === "tablet" ? "bg-gray-200 text-gray-900" : "text-gray-400 hover:text-gray-600"}`} title="平板端"><Tablet className="w-4 h-4" /></button>
                <button onClick={() => setDevice("mobile")} className={`p-1.5 rounded-md transition-colors ${device === "mobile" ? "bg-gray-200 text-gray-900" : "text-gray-400 hover:text-gray-600"}`} title="手机端"><Smartphone className="w-4 h-4" /></button>
              </div>
            )}
            
            {/* 操作按钮 */}
            <div className="flex items-center gap-2">
              <button 
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors relative" 
                title={isFullscreen ? "退出全屏" : "全屏显示"}
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5 text-blue-600" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button 
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" 
                title="复制代码" 
                onClick={() => {
                  navigator.clipboard.writeText(code);
                  alert("代码已复制到剪贴板！");
                }}
              >
                <Copy className="w-4 h-4" />
              </button>
              <button 
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" 
                title="下载源码"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 内容展示区 */}
        <div className="flex-1 bg-gray-100/50 overflow-auto relative flex justify-center items-center p-4">
          {activeTab === "preview" ? (
            // 预览模式：使用 iframe 渲染代码，并根据设备状态动态调整大小
            <div className={`bg-white shadow-xl border border-gray-200 transition-all duration-300 ease-in-out relative flex-shrink-0 ${
              device === "mobile" ? "w-[375px] h-[667px] rounded-[2rem] overflow-hidden border-[6px] border-gray-800" : 
              device === "tablet" ? "w-[768px] h-[1024px] rounded-2xl overflow-hidden" : 
              "w-full h-full rounded-xl overflow-hidden"
            }`}>
              {/* iframe wrapper with solid white background to prevent dark mode bleed-through and ensure a clean slate */}
              <div className="absolute inset-0 bg-white">
                <iframe 
                  srcDoc={getPreviewCode()}
                  className="w-full h-full border-none bg-white"
                  title="预览窗口"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                  style={{ display: 'block', pointerEvents: 'auto' }}
                />
              </div>
            </div>
          ) : (
            // 源码模式：展示纯文本代码
            <div className="w-full h-full p-4 bg-[#1e1e1e] rounded-xl overflow-auto shadow-inner">
              <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap">
                <code>{code}</code>
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
