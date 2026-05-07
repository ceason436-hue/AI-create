"use client";

import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Dices, 
  RefreshCcw, 
  Download, 
  Bookmark, 
  MoreVertical,
  Play,
  Shuffle,
  Music,
  Trash2,
  X,
  Pause,
  SkipBack,
  SkipForward
} from "lucide-react";

export default function MusicCreationPage() {
  const [lyrics, setLyrics] = useState("");
  const [style, setStyle] = useState("");
  const [songName, setSongName] = useState("");
  const [activeTab, setActiveTab] = useState<"works" | "favorites">("works");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState("");
  const [tracks, setTracks] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [showMoreMenu, setShowMoreMenu] = useState<string | null>(null);
  
  const [isPolishingLyrics, setIsPolishingLyrics] = useState(false);
  const [isPolishingStyle, setIsPolishingStyle] = useState(false);
  const [isPolishingSongName, setIsPolishingSongName] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load favorites from local storage on component mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('ai_music_favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        console.error("Failed to load favorites", e);
      }
    }
    
    const savedTracks = localStorage.getItem('ai_music_tracks');
    if (savedTracks) {
      try {
        setTracks(JSON.parse(savedTracks));
      } catch (e) {
        console.error("Failed to load tracks", e);
      }
    }
    
    setIsLoaded(true);
  }, []);

  // Save favorites to local storage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('ai_music_favorites', JSON.stringify(favorites));
    }
  }, [favorites, isLoaded]);

  // Check and restore `isGenerating` state correctly based on `tracks` on component mount or tracks update
  useEffect(() => {
    if (!isLoaded) return;
    
    const generatingTracks = tracks.filter(t => t.status === "generating");
    if (generatingTracks.length > 0) {
      setIsGenerating(true);
      setGeneratingStatus("正在由 AI 谱曲演唱，这可能需要几分钟...");
      
      const progressInterval = setInterval(() => {
        setTracks(prev => {
          let allDone = true;
          const newTracks = prev.map(t => {
            if (t.status === "generating") {
              allDone = false;
              // 极度减缓进度，让它永远停留在 99% 等待真实 API 结果
              const increment = t.progress < 50 ? 2 : (t.progress < 80 ? 1 : (t.progress < 95 ? 0.2 : (t.progress < 99 ? 0.05 : 0)));
              return { ...t, progress: Math.min(t.progress + increment, 99) };
            }
            return t;
          });
          
          if (allDone) {
            clearInterval(progressInterval);
            setIsGenerating(false);
            setGeneratingStatus("");
          }
          return newTracks;
        });
      }, 1000);
      
      // 去除 20 秒强制中断的机制，让进度条一直处于 99% 状态直到后端返回结果
      return () => {
        clearInterval(progressInterval);
      };
    } else {
      setIsGenerating(false);
      setGeneratingStatus("");
    }
  }, [tracks.filter(t => t.status === "generating").length, isLoaded]);

  // Save tracks to local storage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('ai_music_tracks', JSON.stringify(tracks));
    }
  }, [tracks, isLoaded]);

  const allStyleTags = [
    "电影感", "女高音", "架子鼓", "律动感", "手风琴", "流行",
    "电子", "古典", "摇滚", "爵士", "说唱", "民谣",
    "史诗感", "空灵", "欢快", "忧伤", "赛博朋克", "复古",
    "男低音", "吉他", "钢琴", "合成器", "贝斯", "管弦乐",
    "轻音乐", "重金属", "国风", "二次元", "燃向", "治愈"
  ];

  const [styleTags, setStyleTags] = useState(["电影感", "女高音", "架子鼓", "律动感", "手风琴", "流行"]);

  const shuffleStyleTags = () => {
    const shuffled = [...allStyleTags].sort(() => 0.5 - Math.random());
    setStyleTags(shuffled.slice(0, 6));
  };

  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Player State
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeLineRef = React.useRef<HTMLDivElement>(null);
  const lyricsContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const activeLines = React.useMemo(() => {
    if (!currentTrack?.lyrics) return [];
    
    const lines = currentTrack.lyrics.split('\n')
      .map((text: string, originalIndex: number) => ({ text: text.trim(), originalIndex }))
      .filter((l: any) => l.text !== '');

    // 使用基于字符长度的启发式算法来估算歌词时间戳
    let totalWeight = 0;
    const weightedLines = lines.map((line: any, idx: number) => {
      const isMarker = line.text.startsWith('[') && line.text.endsWith(']');
      // 段落标记(如[Verse])通常代表前奏或间奏，给予固定权重；第一行如果是标记则代表前奏较长
      let weight = isMarker ? (idx === 0 ? 20 : 10) : Math.max(line.text.length, 8);
      return { ...line, weight, isMarker };
    });

    totalWeight = weightedLines.reduce((acc: number, line: any) => acc + line.weight, 0);

    let accumulatedWeight = 0;
    return weightedLines.map((line: any) => {
      const startFraction = accumulatedWeight / totalWeight;
      accumulatedWeight += line.weight;
      const endFraction = accumulatedWeight / totalWeight;

      return {
        ...line,
        startFraction,
        endFraction
      };
    });
  }, [currentTrack?.lyrics]);

  useEffect(() => {
    if (duration > 0 && activeLines.length > 0) {
      const fraction = currentTime / duration;
      const newIndex = activeLines.findIndex((line: any) => fraction >= line.startFraction && fraction < line.endFraction);
      
      const safeIndex = newIndex !== -1 ? newIndex : activeLines.length - 1;
      
      if (safeIndex !== activeIndex) {
        setActiveIndex(safeIndex);
      }
    }
  }, [currentTime, duration, activeLines, activeIndex]);

  useEffect(() => {
    if (activeLineRef.current && lyricsContainerRef.current) {
      const container = lyricsContainerRef.current;
      const activeLine = activeLineRef.current;
      const scrollPos = activeLine.offsetTop - container.offsetHeight / 2 + activeLine.offsetHeight / 2;
      container.scrollTo({
        top: scrollPos,
        behavior: 'smooth'
      });
    }
  }, [activeIndex, isPlayerOpen]);

  const togglePlay = (track: any) => {
    if (!audioRef.current) return;
    
    if (playingTrackId === track.id) {
      if (audioRef.current.paused) {
        audioRef.current.play().catch(e => console.error("Play error:", e));
      } else {
        audioRef.current.pause();
        setPlayingTrackId(null); // Just for UI update
      }
    } else {
      if (!track.audioUrl) {
        alert("音频链接无效，无法播放");
        return;
      }
      audioRef.current.src = track.audioUrl;
      audioRef.current.play().then(() => {
        setPlayingTrackId(track.id);
      }).catch(e => {
        console.error("Play error:", e);
        alert("播放失败：可能音频链接已失效或格式不支持");
        setPlayingTrackId(null);
      });
    }
  };

  const handleMagicLyrics = async () => {
    setIsPolishingLyrics(true);
    try {
      const userPrompt = lyrics.trim() 
        ? `请润色和扩写以下歌词，使其更具诗意和音乐感。要求：必须使用 [Verse], [Chorus], [Bridge] 等标准的段落标记。只返回歌词文本，不包含任何多余的解释：\n\n${lyrics}`
        : `请随机创作一首富有创意、结构完整的歌曲歌词（比如关于星空、梦想、冒险或日常的温馨）。要求：必须使用 [Verse], [Chorus], [Bridge] 等标准的段落标记。只返回歌词文本，不包含任何多余的解释。`;
        
      const response = await fetch('/api/minimax/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: "user", content: userPrompt }]
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      const generatedText = data.choices?.[0]?.message?.content || "";
      if (generatedText) {
        setLyrics(generatedText.trim());
      }
    } catch (e) {
      console.error("Lyrics magic failed", e);
      alert("歌词生成失败，请稍后再试。");
    } finally {
      setIsPolishingLyrics(false);
    }
  };

  const handleMagicStyle = async () => {
    setIsPolishingStyle(true);
    try {
      const userPrompt = style.trim() 
        ? `请作为专业的音乐制作人，润色和丰富以下音乐风格描述。要求：包含曲风、情绪、速度、特色乐器或人声类型。不超过50个字，只返回描述文本，不要任何解释：\n\n${style}`
        : `请作为专业的音乐制作人，随机生成一个有创意的音乐风格组合描述。要求：包含曲风、情绪、速度、特色乐器或人声类型（例如：流行电子，欢快，120BPM，使用合成器和女声）。不超过50个字，只返回描述文本，不要任何解释。`;
        
      const response = await fetch('/api/minimax/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: "user", content: userPrompt }]
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      const generatedText = data.choices?.[0]?.message?.content || "";
      if (generatedText) {
        setStyle(generatedText.trim());
      }
    } catch (e) {
      console.error("Style magic failed", e);
      alert("风格生成失败，请稍后再试。");
    } finally {
      setIsPolishingStyle(false);
    }
  };

  const handleMagicSongName = async () => {
    setIsPolishingSongName(true);
    try {
      const userPrompt = lyrics.trim() 
        ? `请根据以下歌词和风格为这首歌起一个好听的、富有诗意且简短的歌名（不超过10个字）。只返回歌名文本，不要书名号和其他任何解释：\n\n歌词：${lyrics.substring(0, 300)}...\n\n风格：${style}`
        : `请随机生成一个富有创意、好听且简短的歌名（不超过10个字）。只返回歌名文本，不要书名号和其他任何解释。`;
        
      const response = await fetch('/api/minimax/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: "user", content: userPrompt }]
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      const generatedText = data.choices?.[0]?.message?.content || "";
      if (generatedText) {
        setSongName(generatedText.trim().replace(/《|》/g, ''));
      }
    } catch (e) {
      console.error("Song name magic failed", e);
      alert("歌名生成失败，请稍后再试。");
    } finally {
      setIsPolishingSongName(false);
    }
  };

  const handleGenerate = async () => {
    if (!style && !lyrics) {
      alert("请至少输入歌词或描述风格！");
      return;
    }

    setIsGenerating(true);
    setGeneratingStatus("正在由 AI 谱曲演唱，这可能需要几分钟...");
    setActiveTab("works");

    const tempId = `temp-${Date.now()}`;
    const newPendingTrack = {
      id: tempId,
      title: songName || "未命名 AI 原创",
      duration: "生成中",
      tags: ["AI原创", "生成中"],
      cover: "/tu1.jpg",
      status: "generating",
      progress: 0,
      audioUrl: "",
      prompt: style,
      lyrics: lyrics
    };
    
    setTracks(prev => [newPendingTrack, ...prev]);

    // Start progress simulation
    const progressInterval = setInterval(() => {
      setTracks(prev => prev.map(t => {
        if (t.id === tempId && t.status === "generating") {
          // 极度减缓进度，让它永远停留在 99% 等待真实 API 结果
          const increment = t.progress < 50 ? 2 : (t.progress < 80 ? 1 : (t.progress < 95 ? 0.2 : (t.progress < 99 ? 0.05 : 0)));
          return { ...t, progress: Math.min(t.progress + increment, 99) };
        }
        return t;
      }));
    }, 1000);

    try {
      const createRes = await fetch("/api/minimax/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: style,
          lyrics: lyrics,
          songName: songName,
        }),
      });

      const createData = await createRes.json();
      clearInterval(progressInterval);
      
      if (createData.error) {
        throw new Error(createData.error);
      }

      if (createData.data && createData.data.audio) {
        setIsGenerating(false);
        setGeneratingStatus("");
        
        setTracks(prev => prev.map(t => {
          if (t.id === tempId) {
            return {
              ...t,
              id: createData.trace_id || Date.now().toString(),
              title: songName || "未命名 AI 原创",
              duration: "00:00",
              tags: ["AI原创", "最新"],
              cover: "/tu1.jpg",
              audioUrl: createData.data.audio,
              status: "completed",
              progress: 100,
              prompt: style,
              lyrics: lyrics
            };
          }
          return t;
        }));
      } else {
        throw new Error("未能获取到音频结果");
      }

    } catch (err: any) {
      console.error(err);
      clearInterval(progressInterval);
      alert(err.message || "请求失败");
      setIsGenerating(false);
      setGeneratingStatus("");
      
      setTracks(prev => prev.filter(t => t.id !== tempId));
    }
  };

  const handleRegenerate = (track: any) => {
    setStyle(track.prompt || "");
    setLyrics(track.lyrics || "");
    setSongName(track.title.replace(" (重新生成)", "") + " (重新生成)");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownload = async (track: any) => {
    try {
      // 简单实现在新窗口打开音频链接，用户可以右键另存为
      // 真实下载可能需要通过后端代理处理跨域或者使用 blob
      window.open(track.audioUrl, '_blank');
    } catch (e) {
      console.error("下载失败", e);
      alert("下载失败，请直接右键播放器保存音频。");
    }
  };

  const toggleFavorite = (track: any) => {
    const isFavorite = favorites.some(f => f.id === track.id);
    if (isFavorite) {
      setFavorites(prev => prev.filter(f => f.id !== track.id));
    } else {
      setFavorites(prev => [track, ...prev]);
    }
  };

  const handleDelete = (trackId: string) => {
    if (activeTab === 'works') {
      setTracks(prev => prev.filter(t => t.id !== trackId));
    } else {
      setFavorites(prev => prev.filter(t => t.id !== trackId));
    }
    setShowMoreMenu(null);
    if (playingTrackId === trackId) {
      setPlayingTrackId(null);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  };

  const displayedTracks = activeTab === 'works' ? tracks : favorites;

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-[40px] brutalist-border shadow-[8px_8px_0_0_#0073e0] p-6 md:p-10 flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto w-full min-h-[80vh]">
      
      {/* Left Column - Input Area */}
      <div className="w-full lg:w-[55%] flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-display-xl font-bold text-black">音乐创作</h1>
          <button className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-full brutalist-border text-sm font-bold shadow-[2px_2px_0_0_#000] hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-[4px_4px_0_0_#000] transition-all">
            <span className="text-gray-600">模型</span>
            <span className="text-gray-300">|</span>
            <span className="text-black">music-2.6</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-1 opacity-60">
              <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Lyrics Section */}
        <div className="bg-white rounded-3xl p-6 brutalist-border flex flex-col gap-4 shadow-[4px_4px_0_0_#e5e7eb]">
          <h2 className="text-lg font-bold">歌词</h2>
          <div className="relative">
            <textarea
              className="w-full h-40 bg-transparent border-none resize-none focus:ring-0 p-0 text-gray-700 placeholder:text-gray-400"
              placeholder="在此添加你自己的歌词。输入 / 查看或插入歌词结构&#10;&#10;如果您未填歌词，我们将根据曲风为您自动生成"
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              maxLength={3500}
            />
            <div className="absolute bottom-0 right-0 flex items-center gap-2 text-gray-400 text-sm">
              <span>{lyrics.length} / 3,500 字符</span>
              <button 
                onClick={handleMagicLyrics}
                disabled={isPolishingLyrics}
                title="AI 智能生成/润色歌词"
                className="p-1 hover:text-black transition-colors disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${isPolishingLyrics ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Style Section */}
        <div className="bg-white rounded-3xl p-6 brutalist-border flex flex-col gap-4 shadow-[4px_4px_0_0_#e5e7eb]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">风格</h2>
            <button className="p-1 hover:text-black transition-colors text-gray-400">
              <Dices className="w-5 h-5" />
            </button>
          </div>
          
          <div className="relative mb-2">
            <textarea
              className="w-full h-20 bg-transparent border-none resize-none focus:ring-0 p-0 text-gray-700 placeholder:text-gray-400"
              placeholder="描述音乐风格与制作要求。例如曲风、情绪、速度、乐器或人声类型"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              maxLength={2000}
            />
            <div className="absolute bottom-0 right-0 flex items-center gap-2 text-gray-400 text-sm">
              <span>{style.length} / 2,000 字符</span>
              <button 
                onClick={handleMagicStyle}
                disabled={isPolishingStyle}
                title="AI 智能生成/润色风格"
                className="p-1 hover:text-black transition-colors disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${isPolishingStyle ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            <button 
              onClick={shuffleStyleTags}
              title="随机换一批风格"
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <Shuffle className="w-4 h-4" />
            </button>
            {styleTags.map((tag) => (
              <button 
                key={tag}
                className="px-4 py-1.5 rounded-full border border-gray-200 text-sm font-medium hover:border-black hover:text-black text-gray-600 transition-all"
                onClick={() => setStyle(prev => prev ? `${prev} ${tag}` : tag)}
              >
                <span className="text-gray-400 mr-1">+</span> {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Song Name Section */}
        <div className="bg-white rounded-3xl p-6 brutalist-border flex flex-col gap-4 shadow-[4px_4px_0_0_#e5e7eb]">
          <h2 className="text-lg font-bold">
            歌名 <span className="text-gray-400 text-sm font-normal ml-2">(选填)</span>
          </h2>
          <div className="relative">
            <input
              type="text"
              className="w-full bg-transparent border-none focus:ring-0 p-0 text-gray-700 placeholder:text-gray-400 text-lg outline-none"
              placeholder="给你的歌曲起个名字吧..."
              value={songName}
              onChange={(e) => setSongName(e.target.value)}
              maxLength={50}
            />
            <div className="absolute bottom-0 right-0 flex items-center gap-2 text-gray-400 text-sm">
              <span>{songName.length} / 50 字符</span>
              <button 
                onClick={handleMagicSongName}
                disabled={isPolishingSongName}
                title="AI 智能生成歌名"
                className="p-1 hover:text-black transition-colors disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${isPolishingSongName ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex flex-col gap-2 mt-2">
          <button 
            className={`w-full py-4 rounded-full font-label-bold text-lg brutalist-border shadow-[4px_4px_0_0_#000] transition-all flex items-center justify-center gap-2 ${isGenerating ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-secondary-fixed text-black hover:-translate-y-1 hover:translate-x-1 hover:shadow-[6px_6px_0_0_#000]'}`}
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <RefreshCcw className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            {isGenerating ? '施法中...' : '开始生成'}
          </button>
          {generatingStatus && (
            <p className="text-sm text-center text-gray-500 animate-pulse">{generatingStatus}</p>
          )}
        </div>
      </div>

      {/* Right Column - Results Area */}
      <div className="w-full lg:w-[45%] flex flex-col gap-6 border-l-2 border-gray-100 pl-0 lg:pl-8">
        
        {/* Tabs */}
        <div className="flex items-center gap-8 border-b-2 border-gray-100">
          <button 
            className={`text-lg font-bold pb-3 relative transition-colors ${activeTab === 'works' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={() => setActiveTab('works')}
          >
            作品
            {activeTab === 'works' && (
              <div className="absolute bottom-[-2px] left-0 w-full h-[4px] bg-black rounded-t-full"></div>
            )}
          </button>
          <button 
            className={`text-lg font-bold pb-3 relative transition-colors ${activeTab === 'favorites' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={() => setActiveTab('favorites')}
          >
            收藏
            {activeTab === 'favorites' && (
              <div className="absolute bottom-[-2px] left-0 w-full h-[4px] bg-black rounded-t-full"></div>
            )}
          </button>
        </div>

        {/* Tracks List */}
        <div className="flex flex-col gap-4 mt-4 flex-1">
          {/* Audio Element */}
          <audio ref={audioRef} onEnded={() => setPlayingTrackId(null)} />
          
          {displayedTracks.length > 0 ? (
            displayedTracks.map((track) => (
              <div key={track.id} className="flex flex-col p-4 hover:bg-white/50 rounded-2xl transition-colors group brutalist-border shadow-sm mb-2 border-2 border-transparent hover:border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Status dot */}
                    <div className={`w-2 h-2 rounded-full ${track.status === 'generating' ? 'bg-blue-500 animate-pulse' : 'bg-purple-500'}`}></div>
                    
                    {/* Cover with Play overlay */}
                      <div 
                        className={`relative w-16 h-16 rounded-xl overflow-hidden brutalist-border group/cover ${track.status === 'generating' ? 'opacity-60 cursor-not-allowed grayscale' : 'cursor-pointer'}`}
                        onClick={() => track.status !== 'generating' && togglePlay(track)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={track.cover} alt={track.title} className="w-full h-full object-cover" />
                        
                        {track.status === 'generating' ? (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <RefreshCcw className="w-6 h-6 text-white animate-spin" />
                          </div>
                        ) : (
                          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${playingTrackId === track.id ? 'opacity-100' : 'opacity-0 group-hover/cover:opacity-100'}`}>
                            {playingTrackId === track.id ? (
                              <div className="w-4 h-4 flex items-center justify-between">
                                <div className="w-1 h-full bg-white animate-pulse" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-1 h-full bg-white animate-pulse" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-1 h-full bg-white animate-pulse" style={{ animationDelay: '300ms' }}></div>
                              </div>
                            ) : (
                              <Play className="w-6 h-6 text-white fill-white" />
                            )}
                          </div>
                        )}
                        <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                          {track.duration}
                        </div>
                      </div>

                    {/* Track Info */}
                    <div className="flex flex-col gap-1.5 cursor-pointer" onClick={() => {
                      if (track.status !== 'generating') {
                        setCurrentTrack(track);
                        setIsPlayerOpen(true);
                        if (playingTrackId !== track.id) {
                          togglePlay(track);
                        }
                      }
                    }}>
                      <span className="font-bold text-base hover:text-blue-500 transition-colors">{track.title}</span>
                      <div className="flex items-center gap-2">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {track.tags.map((tag: any) => (
                          <span key={tag} className={`text-xs font-medium px-2 py-0.5 rounded-md ${track.status === 'generating' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {track.status !== 'generating' && (
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity relative">
                      <button 
                        onClick={() => handleRegenerate(track)}
                        title="重新生成"
                        className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <RefreshCcw className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDownload(track)}
                        title="下载音频"
                        className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => toggleFavorite(track)}
                        title={favorites.some(f => f.id === track.id) ? "取消收藏" : "收藏"}
                        className={`p-2 rounded-full transition-colors ${favorites.some(f => f.id === track.id) ? 'text-purple-600 bg-purple-100 hover:bg-purple-200' : 'text-gray-500 hover:text-black hover:bg-gray-100'}`}
                      >
                        <Bookmark className="w-5 h-5" fill={favorites.some(f => f.id === track.id) ? "currentColor" : "none"} />
                      </button>
                      <div className="relative">
                        <button 
                          onClick={() => setShowMoreMenu(showMoreMenu === track.id ? null : track.id)}
                          className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        {/* More Menu Dropdown */}
                        {showMoreMenu === track.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowMoreMenu(null)}></div>
                            <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                              <button 
                                onClick={() => handleDelete(track.id)}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                删除歌曲
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress Bar for generating status */}
                {track.status === 'generating' && (
                  <div className="mt-4 flex flex-col gap-1.5 px-1">
                    <div className="flex justify-between text-xs font-bold text-gray-500">
                      <span className="animate-pulse">AI 正在谱曲演唱中...</span>
                      <span>{Math.floor(track.progress)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden brutalist-border border-gray-300">
                      <div 
                        className="h-full bg-secondary-fixed transition-all duration-1000 ease-out relative border-r border-black/10"
                        style={{ width: `${track.progress}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-gray-400 gap-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center brutalist-border">
                <Music className="w-8 h-8 text-gray-300" />
              </div>
              <p>暂无{activeTab === 'works' ? '作品' : '收藏'}</p>
            </div>
          )}
        </div>
        
      </div>

      {/* Music Player Modal */}
      {isPlayerOpen && currentTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] flex flex-col brutalist-border shadow-[8px_8px_0_0_#000] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b-2 border-gray-100">
              <h2 className="text-xl font-bold">{currentTrack.title}</h2>
              <button 
                onClick={() => setIsPlayerOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Lyrics Area */}
            <div 
              ref={lyricsContainerRef}
              className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 scroll-smooth bg-gray-50/50"
              style={{ maxHeight: '50vh' }}
            >
              {activeLines.length > 0 ? (
                activeLines.map((line: any, index: number) => (
                  <div 
                    key={index}
                    ref={index === activeIndex ? activeLineRef : null}
                    className={`text-center transition-all duration-300 ${
                      index === activeIndex 
                        ? 'text-2xl md:text-3xl font-bold text-black scale-105' 
                        : index < activeIndex
                          ? 'text-lg md:text-xl text-gray-400 font-medium'
                          : 'text-lg md:text-xl text-gray-400 font-medium'
                    }`}
                  >
                    {line.text}
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p>这首歌没有提供歌词</p>
                </div>
              )}
            </div>

            {/* Controls Area */}
            <div className="p-6 bg-white border-t-2 border-gray-100 flex flex-col gap-4">
              {/* Progress Bar */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-500 w-12 text-right">
                  {formatTime(currentTime)}
                </span>
                <div className="flex-1 relative flex items-center">
                  <input 
                    type="range" 
                    min="0" 
                    max={duration || 100} 
                    value={currentTime} 
                    onChange={handleSeek}
                    className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer outline-none z-10 opacity-0"
                    style={{ WebkitAppearance: 'none' }}
                  />
                  <div className="absolute inset-0 h-2 bg-gray-200 rounded-full pointer-events-none">
                    <div 
                      className="h-full bg-secondary-fixed rounded-full"
                      style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                    />
                  </div>
                  <div 
                    className="absolute h-4 w-4 bg-black rounded-full shadow pointer-events-none -ml-2"
                    style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-500 w-12">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Play Controls */}
              <div className="flex items-center justify-center gap-6 mt-2">
                <button 
                  className="p-3 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                  onClick={() => {
                    const time = Math.max(0, currentTime - 10);
                    if (audioRef.current) audioRef.current.currentTime = time;
                  }}
                >
                  <SkipBack className="w-6 h-6" />
                </button>
                
                <button 
                  className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg"
                  onClick={() => togglePlay(currentTrack)}
                >
                  {playingTrackId === currentTrack.id && audioRef.current && !audioRef.current.paused ? (
                    <Pause className="w-8 h-8 fill-white" />
                  ) : (
                    <Play className="w-8 h-8 fill-white ml-1" />
                  )}
                </button>

                <button 
                  className="p-3 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                  onClick={() => {
                    const time = Math.min(duration, currentTime + 10);
                    if (audioRef.current) audioRef.current.currentTime = time;
                  }}
                >
                  <SkipForward className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
