"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, Plus, History, ChevronRight, Loader2, Play } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { builtinArticles } from "./data";

interface ReadingHistory {
  id: string;
  title: string;
  date: string;
  coverImage?: string;
  segmentCount: number;
}

export default function AIReadingDashboard() {
  const router = useRouter();
  const [history, setHistory] = useState<ReadingHistory[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    // Load history from local storage
    const savedHistory = localStorage.getItem('ai_reading_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load reading history", e);
      }
    } else {
      setHistory([]);
    }
    setIsLoaded(true);
  }, []);

  const handleStartReading = () => {
    if (!selectedArticleId && !newTitle.trim()) return;
    setIsStarting(true);
    if (selectedArticleId) {
      router.push(`/ai-reading/workspace?articleId=${selectedArticleId}`);
    } else {
      router.push(`/ai-reading/workspace?title=${encodeURIComponent(newTitle.trim())}`);
    }
  };

  const handleSelectArticle = (id: string) => {
    setSelectedArticleId(id);
    setNewTitle("");
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTitle(e.target.value);
    setSelectedArticleId("");
  };

  return (
    <div className="flex flex-col gap-8 w-full pb-20">
      {/* Header Area */}
      <div className="flex flex-col gap-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary-fixed text-on-secondary-fixed rounded-full w-fit text-sm font-bold brutalist-border">
          <BookOpen size={16} />
          <span>AI 阅读与绘本创作</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-display-xl font-black text-on-primary-container tracking-tight">
          边读边画，创作专属绘本
        </h1>
        <p className="text-on-primary-container/80 text-lg max-w-2xl">
          选择你想阅读的文章或故事，AI将为你分段解读，引导你回答问题并生成提示词，最终为你生成一整套风格一致的连续画册。
        </p>
      </div>

      {/* Main Action Area: Built-in Articles Selection */}
      <div className="glass-panel-dark rounded-3xl p-6 md:p-8 flex flex-col gap-6">
        <h2 className="text-white font-bold text-2xl">选择你想阅读的故事</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {builtinArticles.map(article => (
             <div 
               key={article.id}
               onClick={() => handleSelectArticle(article.id)}
               className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 border-4 ${
                 selectedArticleId === article.id ? 'border-secondary-fixed shadow-[0_0_20px_rgba(202,242,4,0.4)] scale-[1.02]' : 'border-transparent hover:border-white/30'
               }`}
             >
                <img src={article.coverImage} alt={article.title} className="w-full h-32 object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                   <h3 className="text-white font-bold text-xl">{article.title}</h3>
                </div>
                {selectedArticleId === article.id && (
                  <div className="absolute top-2 right-2 bg-secondary-fixed text-black rounded-full p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                )}
             </div>
          ))}

          {/* 自由导入文章 */}
          <div 
            onClick={() => router.push('/ai-reading/workspace')}
            className="relative rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 border-2 border-dashed border-white/30 hover:border-secondary-fixed hover:bg-white/5 h-32 group"
          >
            <div className="w-12 h-12 rounded-full bg-white/10 group-hover:bg-secondary-fixed flex items-center justify-center mb-2 transition-colors">
              <Plus size={24} className="text-white group-hover:text-black transition-colors" />
            </div>
            <span className="text-white/80 font-medium group-hover:text-secondary-fixed transition-colors">自由导入文章</span>
          </div>
        </div>

        <div className="mt-4 border-t border-white/10 pt-6">
          <label className="block text-white/80 font-bold mb-2">或者，输入你想阅读的其他文章标题：</label>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <input 
              type="text" 
              placeholder="例如：小红帽、丑小鸭..."
              className="w-full bg-white/10 text-white placeholder:text-white/40 brutalist-border-white rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-secondary-fixed"
              value={newTitle}
              onChange={handleTitleChange}
              onKeyDown={(e) => e.key === 'Enter' && handleStartReading()}
            />
            <button 
              onClick={handleStartReading}
              disabled={(!selectedArticleId && !newTitle.trim()) || isStarting}
              className="w-full md:w-auto px-10 py-4 bg-secondary-fixed text-black font-bold text-lg brutalist-border rounded-xl brutalist-shadow-blue hover:-translate-y-1 hover:translate-x-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {isStarting ? <Loader2 size={24} className="animate-spin" /> : <Play size={24} />}
              开始阅读
            </button>
          </div>
        </div>
      </div>

      {/* History Wall */}
      <div className="flex flex-col gap-6 mt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-on-primary-container flex items-center gap-2">
            <History size={24} />
            我的绘本画廊
          </h2>
        </div>

        {!isLoaded ? (
          <div className="h-40 flex items-center justify-center">
            <Loader2 className="animate-spin text-white" size={32} />
          </div>
        ) : history.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 flex flex-col items-center justify-center text-center border-dashed border-white/20">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
              <BookOpen size={32} className="text-white/50" />
            </div>
            <p className="text-white font-medium text-lg mb-2">还没有创作过绘本</p>
            <p className="text-white/60">在上方输入文章标题，开启你的第一次AI阅读之旅</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((item) => (
              <div 
                key={item.id} 
                onClick={() => router.push(`/ai-reading/overview?sessionId=${item.id}`)}
                className="group glass-panel rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform duration-300 cursor-pointer flex flex-col"
              >
                <div className="h-48 bg-white/10 relative overflow-hidden">
                  {item.coverImage ? (
                    <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-container to-inverse-surface">
                      <BookOpen size={48} className="text-white/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs text-white font-medium">
                    {item.segmentCount} 个画面
                  </div>
                </div>
                <div className="p-5 flex flex-col gap-2">
                  <h3 className="text-xl font-bold text-white line-clamp-1">{item.title}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-white/60 text-sm">{item.date}</span>
                    <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:bg-secondary-fixed group-hover:text-black transition-colors">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
