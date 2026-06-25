"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Check, Sparkles, Image as ImageIcon, Loader2, 
  Send, RefreshCw, Palette, MessageSquare, BookOpen, ChevronRight, Save, Upload
} from "lucide-react";
import { builtinArticles } from "../data";
import * as mammoth from "mammoth";

// Mock data to simulate the flow
const MOCK_SEGMENTS = [
  {
    id: "seg_1",
    text: "从前，在一个大森林边上，住着一个穷苦的樵夫，他妻子和两个孩子。小男孩叫汉赛尔，小女孩叫格莱特。樵夫家里经常吃不饱，有一次，全国发生了饥荒，他甚至连每天的面包都买不起了。",
    question: "故事发生在大森林边上，你觉得这座森林看起来是怎样的？",
    isImportant: true,
    curriculumTarget: "感受童话故事的背景环境",
  },
  {
    id: "seg_2",
    text: "晚上，樵夫在床上翻来覆去睡不着，愁眉苦脸地叹气。妻子对他说：‘明天一大早，我们就把孩子们带到森林最密的地方，给他们每人一小块面包，然后我们生起一堆火，就离开他们去干活。’",
    question: "妻子提出了一个残忍的计划，你觉得当时的氛围和场景应该是怎么样的？",
    isImportant: false,
    curriculumTarget: "了解故事情节发展",
  }
];

const STYLES = [
  { id: "动漫风格", label: "动漫风格" },
  { id: "水彩绘本", label: "水彩绘本" },
  { id: "3D卡通", label: "3D卡通" },
  { id: "写实摄影", label: "写实摄影" }
];

function AIReadingWorkspaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const articleId = searchParams.get("articleId");
  const customTitle = searchParams.get("title");
  const urlSessionId = searchParams.get("sessionId");
  const targetSegmentIndex = searchParams.get("segmentIndex");

  // Find the selected article from builtin data if id is provided
  const selectedArticle = builtinArticles.find(a => a.id === articleId);

  const [sessionId, setSessionId] = useState<string | null>(urlSessionId);
  const [isLoaded, setIsLoaded] = useState(false);

  // Workspace States
  const [title, setTitle] = useState(selectedArticle?.title || customTitle || "未命名");
  const [fullText, setFullText] = useState(selectedArticle?.content || "");
  const [isManualInput, setIsManualInput] = useState(true); // Default to showing the text input area
  const [isSplitting, setIsSplitting] = useState(false);
  
  // Segments State
  const [segments, setSegments] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Interaction State for current segment
  const [chatHistory, setChatHistory] = useState<{role: 'ai'|'user', content: string}[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  // Generation State
  const [extractedPrompt, setExtractedPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageProgress, setImageProgress] = useState(0);
  const [globalStyle, setGlobalStyle] = useState("");

  const [isFetchingArticle, setIsFetchingArticle] = useState(false);
  const [lessonPlan, setLessonPlan] = useState("");

  // Load session from local storage if sessionId is present
  useEffect(() => {
    if (urlSessionId) {
      const savedHistory = localStorage.getItem('ai_reading_history');
      if (savedHistory) {
        try {
          const historyArray = JSON.parse(savedHistory);
          const sessionData = historyArray.find((h: any) => h.id === urlSessionId);
          if (sessionData) {
            setTitle(sessionData.title);
            setFullText(sessionData.fullText);
            setSegments(sessionData.segments);
            
            // If targetSegmentIndex is provided, jump directly to that segment
            let initialIndex = sessionData.currentIndex;
            if (targetSegmentIndex !== null && !isNaN(parseInt(targetSegmentIndex))) {
               const parsedIndex = parseInt(targetSegmentIndex);
               if (parsedIndex >= 0 && parsedIndex < sessionData.segments.length) {
                 initialIndex = parsedIndex;
               }
            }
            
            setCurrentIndex(initialIndex);
            
            // Set interaction states based on the segment we are loading into
            const targetSegment = sessionData.segments[initialIndex];
            if (targetSegment) {
               setChatHistory(targetSegment.chatHistory || [{ role: 'ai', content: targetSegment.question }]);
               setExtractedPrompt(targetSegment.prompt || "");
               setGeneratedImage(targetSegment.image || null);
            } else {
               setChatHistory(sessionData.chatHistory);
               setExtractedPrompt(sessionData.extractedPrompt);
               setGeneratedImage(sessionData.generatedImage);
            }
            
            setGlobalStyle(sessionData.globalStyle || "");
            setLessonPlan(sessionData.lessonPlan || "");
            setIsManualInput(sessionData.isManualInput);
          }
        } catch (e) {
          console.error("Failed to load session data:", e);
        }
      }
    }
    setIsLoaded(true);
  }, [urlSessionId, targetSegmentIndex]);

  // Auto-save session to local storage
  useEffect(() => {
    if (!isLoaded || !sessionId || segments.length === 0) return;

    // Safety check: ensure current segment exists before trying to save
    if (!segments[currentIndex]) return;

    const currentSegments = [...segments];
    currentSegments[currentIndex] = {
      ...currentSegments[currentIndex],
      chatHistory,
      prompt: extractedPrompt,
      image: generatedImage
    };

    const sessionData = {
      id: sessionId,
      title,
      date: new Date().toISOString().split('T')[0],
      coverImage: currentSegments[0]?.image || selectedArticle?.coverImage || null,
      segmentCount: currentSegments.length,
      fullText,
      segments: currentSegments,
      currentIndex,
      chatHistory,
      extractedPrompt,
      generatedImage,
      globalStyle,
      lessonPlan,
      isManualInput,
    };

    const savedHistory = localStorage.getItem('ai_reading_history');
    let historyArray = savedHistory ? JSON.parse(savedHistory) : [];
    
    const existingIndex = historyArray.findIndex((h: any) => h.id === sessionId);
    if (existingIndex >= 0) {
      historyArray[existingIndex] = sessionData;
    } else {
      historyArray.unshift(sessionData);
    }
    
    try {
      localStorage.setItem('ai_reading_history', JSON.stringify(historyArray));
    } catch (e: any) {
      console.error("localStorage save error", e);
      if (e.name === 'QuotaExceededError' || e.message.includes('quota')) {
        // Storage is full. Try to save without base64 images to prevent crashing and losing all progress.
        const lightweightHistory = historyArray.map((session: any) => ({
          ...session,
          coverImage: null,
          generatedImage: null,
          segments: session.segments.map((seg: any) => ({
            ...seg,
            image: null
          }))
        }));
        try {
          localStorage.setItem('ai_reading_history', JSON.stringify(lightweightHistory));
          console.warn("Saved history without images due to storage quota.");
        } catch (err) {
          console.error("Failed to save even lightweight history", err);
        }
      }
    }
  }, [isLoaded, sessionId, title, fullText, segments, currentIndex, chatHistory, extractedPrompt, generatedImage, globalStyle, lessonPlan, isManualInput, selectedArticle]);

  useEffect(() => {
    // 只有在 customTitle 存在，且当前还没有文章内容，且还没有 sessionId 的情况下才去拉取
    if (customTitle && !selectedArticle && !fullText && isLoaded && !urlSessionId && !isFetchingArticle) {
      const fetchArticle = async () => {
        setIsFetchingArticle(true);
        try {
          const prompt = `请务必调用你的联网搜索工具，搜索上海沪教版二到六年级语文课本中的课文《${customTitle}》的原文内容。
要求：
1. 必须使用联网搜索获取上海沪教版二到六年级的课标文章原文，不要凭记忆编造。
2. 只能输出文章的纯文本原文内容。
3. 绝对不要输出任何其他多余的文字、解释、标题或 Markdown 格式。
4. 不要输出类似“根据搜索结果”、“【source】”等内容。`;

          const res = await fetch('/api/minimax/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: "user", name: "User", content: prompt }],
          model: "MiniMax-Text-01",
          tools: [{ type: "web_search" }]
        })
      });

          const data = await res.json();
          if (data.error) throw new Error(data.error);

          const choice = data.choices[0];
          let content = choice.messages ? choice.messages[choice.messages.length - 1].content : choice.message.content;

          // 移除可能附带的来源标记
          content = content.replace(/。【source】/g, '').replace(/【source】/g, '').replace(/根据搜索结果.*?如下[：:]/g, '').trim();

          // 获取到内容后，写入状态
          setFullText(content);
          setIsManualInput(true);
        } catch (err) {
          console.error("Fetch article error:", err);
          alert("拉取文章失败，请手动输入或重试。");
        } finally {
          setIsFetchingArticle(false);
        }
      };

      fetchArticle();
    }
  }, [customTitle, selectedArticle, fullText, isLoaded, urlSessionId, isFetchingArticle]);

  const handleSplitText = async () => {
    if (!fullText.trim()) return;
    setIsSplitting(true);
    
    try {
      const prompt = `请作为上海沪教版小学语文课标专家，将以下文章进行智能且合理的拆分，以便为每一段生成一幅绘本画面。
${lessonPlan.trim() ? `\n【重要参考：教师教案】\n以下是该课文的教师教案内容：\n${lessonPlan}\n\n` : ''}要求：
1. 【切忌暴力拆分】请仔细阅读上下文，保证每个段落情节完整、语意连贯。
2. ${lessonPlan.trim() ? `【依据教案精准提炼】请仔细阅读教案内容，提炼出只与文章理解和重点要求学生掌握的部分。引入性的、过渡性的或无关紧要的段落请直接略过，**仅针对重要内容划分段落以引导生图**。` : `【紧扣沪教版课标】根据上海沪教版二到六年级语文课标要求，深入分析哪些段落是文章的核心精读内容（如关键情节、细腻的景物/心理描写），哪些是略读的过渡段。`}
3. 返回格式必须是一个严格的 JSON 数组。
4. 每个对象包含以下字段：
   - "text": 这一段的完整原文内容。
   - "isImportant": 布尔值。根据${lessonPlan.trim() ? '教案' : '课标'}要求，判断该段落是否为重点精读内容。
   - "curriculumTarget": 具体的教学目标或核心考点（${lessonPlan.trim() ? '请从教案中提取对应的重点教学目标' : '如：“品味动词的准确使用，体会人物焦急的心情”或“想象文中描绘的春日画面”等'}）。
   - "question": 针对这一段情节向读者提出的第一个启发式问题。提问必须紧扣 curriculumTarget，引导用户抓住本段的核心画面细节。（例如："这一段描写了蒲公英妈妈准备的降落伞，根据课文内容，你觉得降落伞在风中飘扬时是什么样子的？"）
5. 纯 JSON 输出，不要包含任何 \`\`\`json 或其他额外说明。

文章内容：
${fullText}`;

      const res = await fetch('/api/minimax/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: "user", name: "User", content: prompt }],
          model: "MiniMax-Text-01" // 采用 MiniMax m2.7 高阶模型
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // parse JSON from minimax response
      const choice = data.choices[0];
      let content = choice.messages ? choice.messages[choice.messages.length - 1].content : choice.message.content;
      
      // Robust JSON extraction
      let jsonStr = content;
      const jsonMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      } else {
        // Fallback cleanup if regex doesn't match perfectly but it's still json
        jsonStr = content.replace(/```json\n?/g, '').replace(/```/g, '').trim();
      }

      // Sometimes LLM truncates the output or forgets the last bracket.
      // Auto-fix unterminated JSON array if needed
      if (!jsonStr.endsWith(']')) {
         if (!jsonStr.endsWith('}')) {
             jsonStr += '"}'; // close last string/object just in case
         }
         jsonStr += ']';
      }
      
      const parsedSegments = JSON.parse(jsonStr);
      
      setSegments(parsedSegments.map((seg: any, i: number) => ({
        id: `seg_${i}`,
        text: seg.text,
        question: seg.question,
        isImportant: seg.isImportant,
        curriculumTarget: seg.curriculumTarget
      })));
      
      const newSessionId = `session_${Date.now()}`;
      setSessionId(newSessionId);
      // Update URL without reloading to reflect the new session ID
      window.history.replaceState(null, '', `?sessionId=${newSessionId}`);

      setIsSplitting(false);
      setIsManualInput(false);
      setChatHistory([
        { role: 'ai', content: parsedSegments[0].question }
      ]);
      
    } catch (err: any) {
      console.error(err);
      
      // Provide a clear error message to the user if it's a known API error
      const errorMessage = err.message || "";
      if (errorMessage.includes("insufficient balance") || errorMessage.includes("欠费")) {
         alert("抱歉，AI 接口调用失败：账号余额不足 (insufficient balance)。请联系管理员充值或更换 API Key。");
      } else {
         alert(`AI 拆分文章失败: ${errorMessage} \n请重试或检查原文。`);
      }
      
      setIsSplitting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    
    const newUserMsg = { role: 'user' as const, content: userInput };
    // Create a local variable with the new history to send to AI immediately
    const updatedHistory = [...chatHistory, newUserMsg];
    
    setChatHistory(updatedHistory);
    setUserInput("");
    setIsTyping(true);

    try {
      const historyContext = updatedHistory.map(msg => `${msg.role === 'user' ? '用户' : 'AI'}：${msg.content}`).join('\n');
      const turnsCount = Math.floor(updatedHistory.length / 2); // 每一轮是一问一答
      const isImportant = currentSegment.isImportant;
      const target = currentSegment.curriculumTarget;

      const prompt = `你是一位引导儿童阅读和创作绘本的AI老师，精通上海沪教版小学语文课标。
${lessonPlan.trim() ? `\n【重要参考：教师教案】\n以下是该课文的教师教案内容：\n${lessonPlan}\n\n` : ''}当前阅读的文章段落是：
"${currentSegment.text}"
该段落的教学目标是：${target || '无'}
该段落是否为重点段落：${isImportant ? '是' : '否'}
当前已经是第 ${turnsCount} 轮对话。

以下是迄今为止的对话记录：
${historyContext}

请根据用户最新的回答，进行以下操作：
1. 分析用户的回答，如果偏离了当前段落的意思，请用极其温柔、鼓励的语气将其拉回。${lessonPlan.trim() ? '你的引导绝不可以脱离上海沪教版课标要求与教案内容。' : ''}**切记：你的回复中绝对不要提及“是否接近课文内容”、“是否偏离课文”等类似的话语，只需像聊天一样自然地把话题引导回画面上即可。**
2. 引导学生构思核心画面：你需要引导学生提取【当前段落中已有的核心画面要素】。**请仅紧扣当前段落内容进行引导，绝对不要刻意引入或提及其他段落的内容。**
3. **针对不同类型段落的极简引导原则**：
   - 如果是**引入性/过渡性**的段落（例如《植物妈妈有办法》中的“孩子如果已经长大，就得告别妈妈，四海为家……”），**不需要要求学生制作太丰富的画面内容**。只要学生给出一个简单的画面想象，甚至是一个词，就应该立刻肯定并结束引导。
   - 绝不要引导学生去增添或虚构与原文不太相关的细节内容。**只要学生说出了最基本的画面元素（哪怕只有一两个词，只要不完全错），就应当给予肯定。**
4. **动态判断对话轮次**：
   - 【如果学生刚开始回答或画面极度缺乏核心要素】：请给予极大的鼓励，夸奖他们的想法，并提出1个简单具体的启发式问题（紧扣当前段落）。并在 reply 中友善地提醒用户：“你也可以随时把你想象的画面写在下方的‘画面提示词’框中哦！” 此时 isPromptReady 设为 false，finalPrompt 必须为空字符串。
   - 【一旦判定学生给出了基本的画面要素（标准要放得很宽，引入段落更是只需极简画面）】：你【必须停止继续提问】！绝不要纠结细节不够完美。请在 reply 中总结你们构思的画面，并以极大的热情夸奖用户：“太棒了！你的想象力真丰富，看来你已经完全在脑海里画出这幅画了！我已经帮你把画面总结成提示词并放到下方的工具面板中了，快去选择你喜欢的画风生成图片吧！”
   - 同时，将构思好的画面描述整合成一段完整丰富的AI绘画提示词，**必须使用中文描述**，放到 finalPrompt 字段中，并将 isPromptReady 设为 true。
5. **输出格式要求**：你的回复必须是纯文本，绝不能包含任何 Markdown 符号（例如不要使用 *、#、加粗、斜体等符号）。

请必须以严格的 JSON 格式返回结果，不要包含任何额外说明或Markdown代码块标签：
{
  "reply": "你作为AI老师给用户的纯文本回复内容（绝不要包含*等Markdown符号）",
  "isPromptReady": true或false,
  "finalPrompt": "如果 isPromptReady 为 true，在此输出最终的画面提示词（必须是中文描述，直接用于AI生图）；否则必须为空"
}`;

      const res = await fetch('/api/minimax/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: "user", name: "User", content: prompt }],
          model: "MiniMax-Text-01" // 同样采用 MiniMax m2.7
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const choice = data.choices[0];
      let content = choice.messages ? choice.messages[choice.messages.length - 1].content : choice.message.content;
      
      // Robust JSON extraction for object
      let jsonStr = content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      } else {
        jsonStr = content.replace(/```json\n?/g, '').replace(/```/g, '').trim();
      }
      
      // Additional cleanup: sometimes LLM adds weird text before or after the JSON braces
      jsonStr = jsonStr.trim();
      
      // Auto-fix unterminated JSON object if needed
      if (!jsonStr.endsWith('}')) {
         // Try to find the last complete key-value pair and close it safely
         const lastQuoteIdx = jsonStr.lastIndexOf('"');
         if (lastQuoteIdx !== -1 && !jsonStr.endsWith('"')) {
            jsonStr += '"';
         }
         jsonStr += '}'; 
      }
      
      let parsedData;
      try {
        parsedData = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error("Failed to parse JSON string:", jsonStr);
        // Fallback gracefully if parsing totally fails
        parsedData = {
           reply: "嗯，你说的很有趣！如果你要把它变成一幅画，能把所有的细节连成一句话告诉我吗？",
           isPromptReady: false,
           finalPrompt: ""
        };
      }
      
      setChatHistory(prev => [...prev, { 
        role: 'ai', 
        content: parsedData.reply
      }]);

      if (parsedData.isPromptReady && parsedData.finalPrompt) {
        setExtractedPrompt(parsedData.finalPrompt);
      }
    } catch (err: any) {
      console.error(err);
      
      const errorMessage = err.message || "";
      let aiResponse = "抱歉，我刚刚走神了，你能再说一遍吗？";
      
      if (errorMessage.includes("insufficient balance") || errorMessage.includes("欠费")) {
         aiResponse = "抱歉，AI 接口调用失败：账号余额不足 (insufficient balance)。请充值后再试。";
      }

      setChatHistory(prev => [...prev, { 
        role: 'ai', 
        content: aiResponse
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    setImageProgress(0);
    
    // Simulate Image Generation Progress bar
    const interval = setInterval(() => {
      setImageProgress(p => {
        if (p >= 90) return p;
        return p + 10;
      });
    }, 500);

    try {
      const finalImagePrompt = `${globalStyle}。 ${extractedPrompt}`;
      
      // call minimax image generation api
      const res = await fetch('/api/minimax/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'text2img',
          prompt: finalImagePrompt,
          ratio: '16:9'
        })
      });

      const data = await res.json();
      clearInterval(interval);
      setImageProgress(100);

      if (data.error) throw new Error(data.error);

      setGeneratedImage(data.image);
      
      // Update segment data
      const updatedSegments = [...segments];
      updatedSegments[currentIndex].image = data.image;
      updatedSegments[currentIndex].prompt = extractedPrompt;
      setSegments(updatedSegments);
    } catch (err) {
      console.error(err);
      alert("生成图片失败，请稍后重试");
      clearInterval(interval);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleNextSegment = () => {
    // Save current interaction states to the segment before moving
    const updatedSegments = [...segments];
    
    // Ensure we don't access out of bounds if something went wrong
    if (!updatedSegments[currentIndex]) return;

    updatedSegments[currentIndex] = {
      ...updatedSegments[currentIndex],
      chatHistory: [...chatHistory],
      prompt: extractedPrompt,
      image: generatedImage
    };
    setSegments(updatedSegments);

    if (currentIndex < segments.length - 1) {
      setCurrentIndex(currentIndex + 1);
      // Load or reset interaction states for next segment
      const nextSegment = updatedSegments[currentIndex + 1];
      setChatHistory(nextSegment.chatHistory || [
        { role: 'ai', content: nextSegment.question }
      ]);
      setExtractedPrompt(nextSegment.prompt || "");
      setGeneratedImage(nextSegment.image || null);
      setImageProgress(0);
    } else {
      // Finished all segments. DO NOT increment currentIndex, just route away
      alert("恭喜！绘本创作完成，已保存到历史记录。");
      router.push("/ai-reading");
    }
  };

  // Move this calculation UP, before View 1 returns, so we don't access it when it's undefined
  const currentSegment = segments[currentIndex];

  // View 1: Manual Input / Fetching
  if (isManualInput || segments.length === 0 || !currentSegment) {
    return (
      <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full pb-20">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-white/60 hover:text-white w-fit mb-4">
          <ArrowLeft size={20} />
          <span>返回</span>
        </button>

        <div className="glass-panel-dark rounded-3xl p-8 flex flex-col gap-6">
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <BookOpen className="text-secondary-fixed" />
            导入文章：{title || "未命名"}
          </h2>
          
          <div className="flex flex-col gap-2">
            <label className="text-white/80 font-medium">
              {selectedArticle 
                ? "以下是内置的文章原文，您可以进行修改或直接开始智能拆分：" 
                : customTitle
                  ? isFetchingArticle 
                    ? "正在通过 AI 联网拉取文章原文，请稍候..."
                    : "已通过 AI 拉取文章原文，您可以进行检查或修改，然后开始智能拆分："
                  : "请在下方直接粘贴您的文章或故事原文："}
            </label>
            <div className="relative w-full h-64 overflow-hidden rounded-xl">
              <textarea 
                className="w-full h-full bg-white/5 border border-white/20 rounded-xl p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-secondary-fixed resize-none"
                placeholder="在此粘贴您的文章或故事原文..."
                value={fullText}
                onChange={(e) => setFullText(e.target.value)}
                disabled={isFetchingArticle}
              />
              {isFetchingArticle && (
                <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center backdrop-blur-sm z-10">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 size={32} className="animate-spin text-secondary-fixed" />
                    <span className="text-white font-medium">正在联网拉取原文...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center justify-between">
              <label className="text-white/80 font-medium">
                导入教师教案（可选）：
              </label>
              <label className="cursor-pointer text-secondary-fixed hover:text-white transition-colors text-sm flex items-center gap-1">
                <Upload size={16} /> 上传教案文件
                <input 
                  type="file" 
                  accept=".txt,.md,.docx" 
                  className="hidden" 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.name.endsWith('.docx')) {
                        try {
                          const arrayBuffer = await file.arrayBuffer();
                          const result = await mammoth.extractRawText({ arrayBuffer });
                          setLessonPlan(result.value);
                        } catch (err) {
                          console.error("解析 docx 文件失败:", err);
                          alert("解析教案文件失败，请重试或直接粘贴文本。");
                        }
                      } else {
                        const reader = new FileReader();
                        reader.onload = (e) => setLessonPlan(e.target?.result as string);
                        reader.readAsText(file);
                      }
                    }
                  }} 
                />
              </label>
            </div>
            <textarea 
              className="w-full h-32 bg-white/5 border border-white/20 rounded-xl p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-secondary-fixed resize-none"
              placeholder="在此粘贴教师教案内容，或点击上方按钮上传 txt/md/docx 文件。AI 将根据教案重点划分段落并引导学生..."
              value={lessonPlan}
              onChange={(e) => setLessonPlan(e.target.value)}
              disabled={isFetchingArticle || isSplitting}
            />
          </div>

          <button 
            onClick={handleSplitText}
            disabled={!fullText.trim() || isSplitting || isFetchingArticle}
            className="self-end px-8 py-3 bg-secondary-fixed text-black font-bold brutalist-border rounded-xl brutalist-shadow-blue hover:-translate-y-1 hover:translate-x-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSplitting ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
            {isSplitting ? "AI正在智能拆分段落..." : "开始智能拆分"}
          </button>
        </div>
      </div>
    );
  }

  // View 2: Interactive Workspace (Split Layout)
  return (
    <div className="flex flex-col flex-1 gap-6 pb-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between glass-panel px-6 py-4 rounded-2xl shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-white hover:text-secondary-fixed transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-bold text-white truncate max-w-[200px] md:max-w-md">{title || "正在创作的绘本"}</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-sm font-bold bg-white/10 px-3 py-1.5 rounded-full text-white">
            <span className="text-secondary-fixed">{currentIndex + 1}</span> / {segments.length} 段
          </div>
          <button className="hidden md:flex items-center gap-2 px-4 py-1.5 border border-white/20 rounded-full text-white hover:bg-white/10 text-sm font-medium">
            <Save size={16} /> 保存进度
          </button>
        </div>
      </div>

      {/* Split Workspace */}
      <div className="flex flex-col lg:flex-row gap-6 h-[50vh] min-h-[400px]">
        
        {/* Left: Reading Area */}
        <div className="w-full lg:w-1/3 glass-panel-dark rounded-3xl p-6 md:p-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar h-full">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-white/10 text-white rounded-full text-xs font-bold uppercase tracking-wider">
                当前段落 {currentSegment.isImportant ? '⭐ 重点' : '👀 略读'}
              </span>
              <span className="px-3 py-1 bg-secondary-fixed/20 text-secondary-fixed border border-secondary-fixed/30 rounded-full text-xs font-medium">
                课标要求：{currentSegment.curriculumTarget || '无'}
              </span>
            </div>
            <p className="text-white/90 text-lg md:text-xl leading-loose font-medium mt-2">
              {currentSegment.text}
            </p>
          </div>
        </div>

        {/* Right: Interaction Area */}
        <div className="w-full lg:w-2/3 glass-panel-dark rounded-3xl flex flex-col overflow-hidden relative h-full">
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-6 custom-scrollbar pb-4">
            
            {/* Chat History */}
            <div className="flex flex-col gap-4">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                    msg.role === 'ai' 
                      ? 'bg-white/10 text-white rounded-tl-none' 
                      : 'bg-secondary-fixed text-black font-medium rounded-tr-none'
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/10 text-white rounded-2xl rounded-tl-none px-5 py-3 flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-white/60" />
                    <span className="text-sm text-white/60">AI 老师正在思考...</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Dummy div to scroll to bottom */}
            <div className="h-4"></div>
          </div>

          {/* Bottom Chat Input */}
          <div className="p-4 md:p-6 bg-black/20 border-t border-white/10 shrink-0 flex flex-col gap-4">
            <div className="relative">
              <input 
                type="text" 
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={extractedPrompt ? "已生成提示词，可在下方工具面板生图，或继续对话修改..." : "回答AI的问题，描述你心中的画面..."}
                className="w-full bg-white/10 text-white placeholder:text-white/40 border border-white/20 rounded-xl pl-4 pr-12 py-4 focus:outline-none focus:border-secondary-fixed"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!userInput.trim() || isTyping}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-secondary-fixed text-black rounded-lg flex items-center justify-center disabled:opacity-50 hover:scale-105 transition-transform"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom: Generation Panel (Always visible) */}
      <div className="w-full glass-panel-dark rounded-3xl p-6 md:p-8 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 mt-4">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <Palette className="text-secondary-fixed" size={24} />
          <h3 className="text-xl font-bold text-white">生图工具面板</h3>
        </div>

          {!generatedImage ? (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-white/80 font-bold">画面提示词 (可直接修改)：</label>
                <textarea 
                  className="w-full h-28 bg-black/40 text-white border border-white/20 rounded-xl p-4 focus:outline-none focus:border-secondary-fixed resize-none"
                  value={extractedPrompt}
                  onChange={(e) => setExtractedPrompt(e.target.value)}
                />
              </div>

              <div className="flex flex-col md:flex-row items-end gap-6">
                <div className="w-full md:w-1/2">
                  <label className="text-white/80 font-bold mb-2 block">选择画风 (将应用于整个绘本)</label>
                  <select 
                    className="w-full bg-black/40 text-white border border-white/20 rounded-xl px-4 py-4 focus:outline-none focus:border-secondary-fixed appearance-none"
                    value={globalStyle || ""}
                    onChange={(e) => setGlobalStyle(e.target.value)}
                  >
                    <option value="" disabled>-- 请选择 --</option>
                    {STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                
                {isGeneratingImage ? (
                  <div className="w-full md:w-1/2 flex items-center justify-center gap-4 py-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="relative w-8 h-8">
                      <div className="absolute inset-0 border-2 border-white/20 rounded-full"></div>
                      <div className="absolute inset-0 border-2 border-secondary-fixed rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <span className="text-white font-medium">正在生成... {imageProgress}%</span>
                  </div>
                ) : (
                  <button 
                    onClick={handleGenerateImage}
                    disabled={!extractedPrompt.trim() || !globalStyle}
                    className="w-full md:w-1/2 py-4 bg-primary text-white font-bold brutalist-border-white rounded-xl shadow-[4px_4px_0px_0px_#ffffff] hover:-translate-y-1 hover:translate-x-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <ImageIcon size={20} />
                    {globalStyle ? "开始生成画面" : "请先选择画风"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="w-full md:w-1/2 relative rounded-2xl overflow-hidden brutalist-border-white group">
                <img src={generatedImage} alt="Generated" className="w-full h-auto object-cover" />
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full text-sm text-white flex items-center gap-2 font-medium">
                  <Check size={16} className="text-secondary-fixed" />
                  生成成功
                </div>
              </div>
              
              <div className="w-full md:w-1/2 flex flex-col gap-4 justify-center h-full">
                <h4 className="text-2xl font-bold text-white">这幅画符合你的想象吗？</h4>
                <p className="text-white/60 mb-4">如果不满意，你可以修改提示词重新生成；如果满意，我们就可以进入下一段啦！</p>
                
                <button 
                  onClick={() => {
                    setGeneratedImage(null);
                    // 不清空 extractedPrompt，允许用户继续修改提示词和画风进行重绘
                  }}
                  className="w-full py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw size={20} />
                  不满意，修改并重绘
                </button>
                <button 
                  onClick={handleNextSegment}
                  className="w-full py-4 bg-secondary-fixed text-black font-bold brutalist-border rounded-xl brutalist-shadow-blue hover:-translate-y-1 hover:translate-x-1 transition-all flex items-center justify-center gap-2"
                >
                  {currentIndex < segments.length - 1 ? '满意，进入下一段' : '满意，完成绘本创作'}
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}

export default function AIReadingWorkspace() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-[50vh]"><Loader2 className="animate-spin text-secondary-fixed" size={32} /></div>}>
      <AIReadingWorkspaceContent />
    </Suspense>
  );
}
