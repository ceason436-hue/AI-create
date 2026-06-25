"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Edit3, Image as ImageIcon, Loader2, BookOpen, ScanEye, Sparkles, FileImage } from "lucide-react";
import * as htmlToImage from "html-to-image";

function OverviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("sessionId");
  
  const [sessionData, setSessionData] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [analyzingIdx, setAnalyzingIdx] = useState<number | null>(null);
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<Record<number, any>>({});
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sessionId) {
      const savedHistory = localStorage.getItem('ai_reading_history');
      if (savedHistory) {
        try {
          const historyArray = JSON.parse(savedHistory);
          const found = historyArray.find((h: any) => h.id === sessionId);
          if (found) {
            setSessionData(found);
          }
        } catch (e) {
          console.error("Failed to parse history", e);
        }
      }
    }
    setIsLoaded(true);
  }, [sessionId]);

  const handleBatchDownload = async () => {
    if (!sessionData || !sessionData.segments) return;
    
    let downloadedCount = 0;
    
    // We create a function to download a single image to ensure it works properly in browser loop
    const downloadImage = (base64Data: string, fileName: string) => {
      const a = document.createElement('a');
      a.href = base64Data;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    sessionData.segments.forEach((seg: any, index: number) => {
      if (seg.image) {
        downloadImage(seg.image, `${sessionData.title || '绘本'}_画面_${index + 1}.jpg`);
        downloadedCount++;
      }
    });

    if (downloadedCount === 0) {
      alert("没有找到可下载的图片！");
    }
  };

  const handleAnalyzeImage = async (seg: any, idx: number) => {
    if (!seg.image) return;
    setAnalyzingIdx(idx);
    
    try {
      const res = await fetch('/api/minimax/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: seg.image,
          prompt: seg.text,
          curriculumTarget: seg.curriculumTarget
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setAnalysisResults(prev => ({
        ...prev,
        [idx]: data
      }));
    } catch (err: any) {
      console.error(err);
      alert("图片分析失败，请稍后重试");
    } finally {
      setAnalyzingIdx(null);
    }
  };

  const handleBatchAnalyze = async () => {
    if (!sessionData?.segments || sessionData.segments.length === 0) return;
    
    setIsBatchAnalyzing(true);
    
    // We do it sequentially to not overwhelm the API and to show progress
    for (let i = 0; i < sessionData.segments.length; i++) {
      const seg = sessionData.segments[i];
      if (seg.image && !analysisResults[i]) {
        await handleAnalyzeImage(seg, i);
      }
    }
    
    setIsBatchAnalyzing(false);
  };

  const handleExportLongImage = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    try {
      const container = exportRef.current;
      
      // 我们不再修改原始 DOM 元素的任何样式（避免影响截图），也不用克隆。
      // 我们直接修改 `html-to-image` 的配置：利用 `style` 属性在截图渲染时重写它的位置。
      const dataUrl = await htmlToImage.toJpeg(container, {
        quality: 0.9,
        backgroundColor: '#1a1a1a',
        pixelRatio: 2,
        style: {
          left: '0',
          top: '0',
          position: 'static',
          zIndex: '1',
          opacity: '1', // 确保截图中是完全不透明的
          transform: 'none'
        }
      });

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${sessionData?.title || '绘本'}_长图.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed", error);
      alert("导出长图失败，请稍后重试");
    } finally {
      setIsExporting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="animate-spin text-secondary-fixed" size={32} />
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4 text-white">
        <BookOpen size={48} className="text-white/20" />
        <p className="text-xl font-bold">未找到该绘本记录</p>
        <button onClick={() => router.push('/ai-reading')} className="px-6 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
          返回画廊
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 glass-panel-dark p-6 md:p-8 rounded-3xl shrink-0">
        <div className="flex flex-col gap-4">
          <button onClick={() => router.push('/ai-reading')} className="flex items-center gap-2 text-white/60 hover:text-white w-fit transition-colors">
            <ArrowLeft size={20} />
            <span>返回画廊</span>
          </button>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight flex items-center gap-4">
            {sessionData.title || "未命名绘本"}
          </h1>
          <div className="flex flex-wrap gap-3 mt-2">
            <span className="px-3 py-1 bg-white/10 text-white rounded-full text-sm font-medium">
              {sessionData.date}
            </span>
            <span className="px-3 py-1 bg-secondary-fixed/20 text-secondary-fixed border border-secondary-fixed/30 rounded-full text-sm font-medium">
              共 {sessionData.segments?.length || 0} 个画面
            </span>
            {sessionData.globalStyle && (
              <span className="px-3 py-1 bg-white/10 text-white rounded-full text-sm font-medium">
                画风: {sessionData.globalStyle}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
            <button
              onClick={handleBatchAnalyze}
              disabled={isBatchAnalyzing}
              className="flex-1 md:flex-none px-6 py-3 bg-white text-black font-bold brutalist-border rounded-xl brutalist-shadow-blue hover:-translate-y-1 hover:translate-x-1 transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBatchAnalyzing ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
              {isBatchAnalyzing ? "AI老师批阅中..." : "一键请AI老师点评"}
            </button>
            
            <button 
              onClick={handleBatchDownload}
              className="flex-1 md:flex-none px-6 py-3 bg-secondary-fixed text-black font-bold brutalist-border rounded-xl brutalist-shadow-blue hover:-translate-y-1 hover:translate-x-1 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Download size={20} />
              批量下载
            </button>
            
            <button 
              onClick={handleExportLongImage}
              disabled={isExporting}
              className="flex-1 md:flex-none px-6 py-3 bg-white text-black font-bold brutalist-border rounded-xl brutalist-shadow-blue hover:-translate-y-1 hover:translate-x-1 transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? <Loader2 size={20} className="animate-spin" /> : <FileImage size={20} />}
              {isExporting ? "导出中..." : "一键导出长图"}
            </button>
          </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-12">
        {sessionData.segments?.map((seg: any, idx: number) => (
          <div key={idx} className="flex flex-col lg:flex-row gap-8 items-start bg-black/20 p-6 md:p-8 rounded-3xl border border-white/10 relative">

            {/* Left: Text & Prompt */}
            <div className="w-full lg:w-1/2 flex flex-col gap-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary-fixed text-black flex items-center justify-center font-black text-xl brutalist-border">
                    {idx + 1}
                  </div>
                  <h3 className="text-xl font-bold text-white">段落原文</h3>
                </div>
                {/* Edit Button for this segment */}
                <button 
                  onClick={() => router.push(`/ai-reading/workspace?sessionId=${sessionData.id}&segmentIndex=${idx}`)}
                  className="px-4 py-2 bg-secondary-fixed/20 text-secondary-fixed border border-secondary-fixed/30 font-bold rounded-full hover:bg-secondary-fixed hover:text-black transition-colors flex items-center gap-2 text-sm shadow-md"
                >
                  <Edit3 size={16} />
                  修改此段
                </button>
              </div>
              <p className="text-white/90 text-lg leading-loose font-medium bg-white/5 p-6 rounded-2xl">
                {seg.text}
              </p>
              
              <div className="flex flex-col gap-3 mt-2">
                <h4 className="text-white/60 font-bold flex items-center gap-2">
                  <ImageIcon size={18} />
                  生成的提示词
                </h4>
                <p className="text-white/80 italic bg-black/40 p-4 rounded-xl border border-white/10">
                  {seg.prompt || "暂无提示词"}
                </p>
              </div>
            </div>

            {/* Right: Image & Analysis */}
            <div className="w-full lg:w-1/2 flex flex-col gap-6">
              {seg.image ? (
                <div className="flex flex-col gap-4">
                  <div className="relative rounded-2xl overflow-hidden brutalist-border-white group bg-white/5 aspect-video flex items-center justify-center">
                    <img src={seg.image} alt={`画面 ${idx + 1}`} className="w-full h-auto object-contain" />
                  </div>
                  
                  {/* Analysis Result */}
                  {analysisResults[idx] ? (
                    <div className="bg-black/20 rounded-2xl p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-secondary-fixed font-bold">AI 老师点评结果</span>
                        <div className="flex items-center gap-2 bg-secondary-fixed/20 px-3 py-1 rounded-full">
                          <span className="text-secondary-fixed font-bold text-sm">与原文匹配度</span>
                          <span className="text-secondary-fixed font-bold">{analysisResults[idx].percentage}%</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                          <p className="text-white/90 leading-relaxed"><strong className="text-primary">老师的话：</strong>{analysisResults[idx].analysis}</p>
                        </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleAnalyzeImage(seg, idx)}
                      disabled={analyzingIdx === idx}
                      className="w-full py-4 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2 border border-white/20 disabled:opacity-50"
                    >
                      {analyzingIdx === idx ? <Loader2 size={20} className="animate-spin" /> : <ScanEye size={20} />}
                      {analyzingIdx === idx ? "AI 老师正在仔细观察..." : "让 AI 老师看看这幅画"}
                    </button>
                  )}
                </div>
              ) : (
                <div className="w-full aspect-video bg-white/5 rounded-2xl border border-dashed border-white/20 flex flex-col items-center justify-center gap-3 text-white/40">
                  <ImageIcon size={48} />
                  <p>该段落尚未生成图片</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Hidden Export Container */}
      <div className="overflow-hidden h-0 w-0 absolute">
        <div 
          ref={exportRef} 
          className="bg-[#1a1a1a] p-12 flex flex-col gap-10" 
          style={{ width: "800px" }}
        >
            {/* Cover / Title */}
          <div className="flex flex-col items-center gap-4 text-center pb-8 border-b border-white/10">
            <h1 className="text-5xl font-black text-white">{sessionData.title || "未命名绘本"}</h1>
            <div className="flex gap-4 text-white/60 text-lg">
              <span>{sessionData.date}</span>
              <span>{sessionData.globalStyle && `画风: ${sessionData.globalStyle}`}</span>
            </div>
          </div>

          {/* Segments */}
          <div className="flex flex-col gap-12">
            {sessionData.segments?.map((seg: any, idx: number) => (
              <div key={`export-${idx}`} className="flex flex-col gap-6">
                {seg.image && (
                  <div className="w-full rounded-2xl overflow-hidden shadow-2xl">
                    <img src={seg.image} alt={`画面 ${idx + 1}`} className="w-full h-auto object-cover" />
                  </div>
                )}
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                  <p className="text-white text-xl leading-relaxed font-medium">
                    {seg.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Footer - removed as requested */}
        </div>
      </div>
    </div>
  );
}

export default function AIReadingOverview() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-[50vh]"><Loader2 className="animate-spin text-secondary-fixed" size={32} /></div>}>
      <OverviewContent />
    </Suspense>
  );
}
