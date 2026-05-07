"use client";

import React, { useState, useEffect, useRef } from "react";
import { Upload, Download, Sparkles, Image as ImageIcon, Settings2, Loader2, Square, RectangleHorizontal, RectangleVertical, Monitor, ChevronDown, ChevronUp } from "lucide-react";

export default function AIArtGenerator() {
  const [activeTab, setActiveTab] = useState<"text2img" | "img2img">("text2img");
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState("1:1");
  const [style, setStyle] = useState<string | null>(null);
  const [isStyleExpanded, setIsStyleExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  
  const [rightTab, setRightTab] = useState<"current" | "works">("current");
  const [works, setWorks] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedWorks = localStorage.getItem('ai_art_works');
    if (savedWorks) {
      try {
        setWorks(JSON.parse(savedWorks));
      } catch (e) {
        console.error("Failed to load works", e);
      }
    }

    const savedProgress = localStorage.getItem('ai_art_progress');
    const savedIsGenerating = localStorage.getItem('ai_art_isGenerating');
    if (savedIsGenerating === 'true') {
      setIsGenerating(true);
      setProgress(savedProgress ? parseInt(savedProgress) : 0);
      
      // Resume fake progress bar
      const interval = setInterval(() => {
        setProgress((prev) => {
          const next = prev >= 90 ? 90 : prev + 5;
          localStorage.setItem('ai_art_progress', next.toString());
          return next;
        });
      }, 500);

      // In a real app, you would also need to check the server for the actual job status here
      // For this demo, we'll just clear it after 10 seconds to avoid infinite loading if the API call was lost
      setTimeout(() => {
        clearInterval(interval);
        setIsGenerating(false);
        localStorage.removeItem('ai_art_isGenerating');
        localStorage.removeItem('ai_art_progress');
      }, 10000);

      setIsLoaded(true);
      return () => clearInterval(interval);
    }
    
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('ai_art_works', JSON.stringify(works));
    }
  }, [works, isLoaded]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ratios = [
    { id: "1:1", label: "1:1", icon: <Square size={24} /> },
    { id: "16:9", label: "16:9", icon: <RectangleHorizontal size={24} /> },
    { id: "9:16", label: "9:16", icon: <RectangleVertical size={24} /> },
    { id: "4:3", label: "4:3", icon: <Monitor size={24} /> },
  ];

  const styles = [
    { id: "anime", label: "二次元" },
    { id: "realistic", label: "写实摄影" },
    { id: "3d", label: "3D渲染" },
    { id: "cyberpunk", label: "赛博朋克" },
    { id: "ink", label: "水墨国风" },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (activeTab === "img2img" && !referenceImage) return;

    setIsGenerating(true);
    localStorage.setItem('ai_art_isGenerating', 'true');
    setProgress(0);
    localStorage.setItem('ai_art_progress', '0');
    setResultImage(null);

    // Start a fake progress bar
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev >= 90 ? 90 : prev + 5; // Stop at 90% until API returns
        localStorage.setItem('ai_art_progress', next.toString());
        return next;
      });
    }, 500);

    try {
      const response = await fetch('/api/minimax/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: activeTab,
          prompt,
          ratio,
          style,
          referenceImage: activeTab === 'img2img' ? referenceImage : undefined
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '生成失败');
      }

      setProgress(100);
      setResultImage(data.image);
      setRightTab("current");
      setWorks(prev => [{
        id: Date.now().toString(),
        url: data.image,
        prompt: prompt,
        createdAt: Date.now()
      }, ...prev]);
    } catch (error: any) {
      console.error("Image generation error:", error);
      alert(`生成失败: ${error.message}`);
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
      localStorage.removeItem('ai_art_isGenerating');
      localStorage.removeItem('ai_art_progress');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setReferenceImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const a = document.createElement('a');
    a.href = resultImage;
    a.download = 'ai-art-generated.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="w-full flex flex-col gap-8 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-secondary-fixed rounded-full flex items-center justify-center brutalist-border shadow-[4px_4px_0_0_#000]">
          <Sparkles className="text-black" size={32} />
        </div>
        <h1 className="font-display-xl text-4xl md:text-5xl text-on-primary-container tracking-tight drop-shadow-[2px_2px_0_rgba(255,255,255,0.2)]">
          AI 创意绘画舱
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Panel: Controls */}
        <div className="w-full lg:w-[45%] bg-black rounded-[32px] p-6 md:p-8 brutalist-border shadow-[8px_8px_0_0_#caf204] flex flex-col gap-8 relative overflow-hidden">
          {/* Tabs */}
          <div className="flex bg-white/10 rounded-full p-2 brutalist-border-white relative z-10">
            <button
              onClick={() => setActiveTab("text2img")}
              className={`flex-1 py-3 px-6 rounded-full font-label-bold text-lg transition-all duration-300 ${
                activeTab === "text2img"
                  ? "bg-secondary-fixed text-black brutalist-border shadow-[4px_4px_0_0_#000]"
                  : "text-white hover:bg-white/10"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Sparkles size={20} /> 文生图
              </span>
            </button>
            <button
              onClick={() => setActiveTab("img2img")}
              className={`flex-1 py-3 px-6 rounded-full font-label-bold text-lg transition-all duration-300 ${
                activeTab === "img2img"
                  ? "bg-secondary-fixed text-black brutalist-border shadow-[4px_4px_0_0_#000]"
                  : "text-white hover:bg-white/10"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <ImageIcon size={20} /> 图生图
              </span>
            </button>
          </div>

          {/* Reference Image Upload (Conditional) */}
          {activeTab === "img2img" && (
            <div className="flex flex-col gap-3 relative z-10 animate-in fade-in slide-in-from-top-4">
              <label className="text-white font-headline-md text-xl flex items-center gap-2">
                <Upload size={24} className="text-secondary-fixed" /> 上传参考图
              </label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-[160px] border-3 border-dashed border-white/40 rounded-[20px] flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-secondary-fixed hover:bg-secondary-fixed/10 transition-colors group relative overflow-hidden"
              >
                {referenceImage ? (
                  <img src={referenceImage} alt="Reference" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-secondary-fixed/20 group-hover:scale-110 transition-all">
                      <Upload size={24} className="text-white group-hover:text-secondary-fixed" />
                    </div>
                    <span className="text-white/60 font-body-sm">点击或拖拽上传图片</span>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileUpload}
                />
              </div>
            </div>
          )}

          {/* Prompt Input */}
          <div className="flex flex-col gap-3 relative z-10">
            <label className="text-white font-headline-md text-xl flex items-center gap-2">
              <Sparkles size={24} className="text-secondary-fixed" /> 创意描述
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="描述你想要的画面，例如：一只穿着赛博朋克风格机甲的可爱猫咪，霓虹灯背景，8k分辨率，高细节..."
              className="w-full h-[140px] bg-white/5 border-2 border-white/20 rounded-[20px] p-4 text-white font-body-lg placeholder:text-white/40 focus:outline-none focus:border-secondary-fixed focus:bg-white/10 transition-colors resize-none"
            />
          </div>

          {/* Settings: Style & Ratio */}
          <div className="flex flex-col gap-6 relative z-10">
            {/* Style Selection (Collapsible) */}
            <div className="flex flex-col gap-3 bg-white/5 rounded-2xl p-4 border border-white/10">
              <button 
                onClick={() => setIsStyleExpanded(!isStyleExpanded)}
                className="flex items-center justify-between w-full text-white font-headline-md text-lg group"
              >
                <div className="flex items-center gap-2">
                  <Settings2 size={20} className="text-secondary-fixed" /> 
                  <span>画面风格 <span className="text-white/50 text-sm font-normal ml-2">(可选)</span></span>
                  {style && !isStyleExpanded && (
                    <span className="ml-2 px-3 py-1 bg-secondary-fixed/20 text-secondary-fixed text-sm rounded-full font-label-bold">
                      {styles.find(s => s.id === style)?.label}
                    </span>
                  )}
                </div>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  {isStyleExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>
              
              {isStyleExpanded && (
                <div className="flex flex-wrap gap-2 mt-2 animate-in fade-in slide-in-from-top-2">
                  <button
                    onClick={() => setStyle(null)}
                    className={`px-4 py-2 rounded-full font-label-bold text-sm transition-all ${
                      style === null
                        ? "bg-white text-black brutalist-border"
                        : "bg-transparent text-white border-2 border-white/30 hover:border-white"
                    }`}
                  >
                    无风格
                  </button>
                  {styles.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStyle(s.id)}
                      className={`px-4 py-2 rounded-full font-label-bold text-sm transition-all ${
                        style === s.id
                          ? "bg-white text-black brutalist-border"
                          : "bg-transparent text-white border-2 border-white/30 hover:border-white"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Ratio Selection */}
            <div className="flex flex-col gap-3 bg-white/5 rounded-2xl p-4 border border-white/10">
              <label className="text-white font-headline-md text-lg flex items-center gap-2">
                <Square size={20} className="text-secondary-fixed" /> 
                生成比例
              </label>
              <div className="grid grid-cols-4 gap-2">
                {ratios.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRatio(r.id)}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl transition-all ${
                      ratio === r.id
                        ? "bg-secondary-fixed text-black brutalist-border"
                        : "bg-white/5 text-white/70 border-2 border-transparent hover:bg-white/10"
                    }`}
                  >
                    {r.icon}
                    <span className="font-label-bold text-xs">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim() || (activeTab === "img2img" && !referenceImage)}
            className="w-full mt-4 py-4 md:py-5 bg-secondary-fixed text-black font-display-xl text-2xl font-bold rounded-full brutalist-border shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:translate-x-1 hover:shadow-[8px_8px_0_0_#000] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-[4px_4px_0_0_#000] relative overflow-hidden group z-10"
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-3">
                <Loader2 size={28} className="animate-spin" /> 生成中...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-3">
                <Sparkles size={28} className="group-hover:rotate-12 transition-transform" /> 
                {activeTab === "img2img" ? "图生图魔法" : "文生图魔法"}
              </span>
            )}
          </button>
        </div>

        {/* Right Panel: Result Display */}
        <div className="w-full lg:w-[55%] flex flex-col gap-6 sticky top-28">
          
          {/* Tabs */}
          <div className="flex items-center gap-8 border-b-2 border-gray-200">
            <button 
              className={`text-lg font-bold pb-3 relative transition-colors ${rightTab === 'current' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
              onClick={() => setRightTab('current')}
            >
              当前生成
              {rightTab === 'current' && (
                <div className="absolute bottom-[-2px] left-0 w-full h-[4px] bg-black rounded-t-full"></div>
              )}
            </button>
            <button 
              className={`text-lg font-bold pb-3 relative transition-colors ${rightTab === 'works' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
              onClick={() => setRightTab('works')}
            >
              历史作品
              {rightTab === 'works' && (
                <div className="absolute bottom-[-2px] left-0 w-full h-[4px] bg-black rounded-t-full"></div>
              )}
            </button>
          </div>

          {rightTab === 'current' ? (
            <>
              <div className="w-full aspect-square md:aspect-[4/3] lg:aspect-square bg-white/50 backdrop-blur-md rounded-[32px] brutalist-border shadow-[8px_8px_0_0_#0073e0] flex flex-col items-center justify-center overflow-hidden relative p-4">
                
                {!isGenerating && !resultImage && (
                  <div className="flex flex-col items-center gap-4 text-on-primary-container/60">
                    <div className="w-24 h-24 bg-white/50 rounded-full flex items-center justify-center brutalist-border">
                      <ImageIcon size={48} className="text-black/60" />
                    </div>
                    <p className="font-headline-md text-xl">等待施展魔法...</p>
                  </div>
                )}

                {isGenerating && (
                  <div className="w-full max-w-md flex flex-col items-center gap-6 z-10">
                    <div className="w-32 h-32 relative">
                      <div className="absolute inset-0 border-8 border-secondary-fixed/20 rounded-full"></div>
                      <div className="absolute inset-0 border-8 border-secondary-fixed rounded-full border-t-transparent animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-display-xl text-3xl font-bold text-black">{progress}%</span>
                      </div>
                    </div>
                    <div className="w-full flex flex-col gap-2">
                      <p className="text-center font-label-bold text-black">AI 正在构思画面细节...</p>
                      <div className="w-full h-4 bg-black/10 rounded-full overflow-hidden brutalist-border">
                        <div 
                          className="h-full bg-secondary-fixed transition-all duration-300 ease-out"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                {resultImage && !isGenerating && (
                  <div className="w-full h-full relative group rounded-[20px] overflow-hidden brutalist-border">
                    <img 
                      src={resultImage} 
                      alt="Generated AI Art" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                    
                    {/* Overlay actions */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                      <button 
                        onClick={handleDownload}
                        className="p-4 bg-secondary-fixed text-black rounded-full brutalist-border hover:scale-110 transition-transform shadow-[4px_4px_0_0_#000]"
                        title="下载图片"
                      >
                        <Download size={24} />
                      </button>
                    </div>
                  </div>
                )}

              </div>

              {/* Action Footer (Download) */}
              {resultImage && !isGenerating && (
                <div className="flex justify-end animate-in fade-in slide-in-from-bottom-4">
                  <button 
                    onClick={handleDownload}
                    className="px-8 py-4 bg-primary text-white font-label-bold text-xl rounded-full brutalist-border shadow-[4px_4px_0_0_#caf204] hover:-translate-y-1 hover:translate-x-1 hover:shadow-[8px_8px_0_0_#caf204] transition-all flex items-center gap-3"
                  >
                    <Download size={24} /> 下载高清原图
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2 pb-4">
              {works.length > 0 ? works.map(work => (
                <div key={work.id} className="relative group rounded-[20px] overflow-hidden brutalist-border aspect-square bg-white/50">
                  <img src={work.url} alt={work.prompt} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 p-4 text-white text-center">
                    <p className="text-xs line-clamp-3 font-medium">{work.prompt}</p>
                    <button 
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = work.url;
                        a.download = `ai-art-${work.id}.png`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      }}
                      className="p-3 bg-secondary-fixed text-black rounded-full brutalist-border hover:scale-110 transition-transform shadow-[2px_2px_0_0_#000]"
                      title="下载图片"
                    >
                      <Download size={18} />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="col-span-2 md:col-span-3 flex flex-col items-center justify-center py-20 text-gray-500 gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center brutalist-border">
                    <ImageIcon size={32} className="text-gray-400" />
                  </div>
                  <p>暂无历史作品</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
