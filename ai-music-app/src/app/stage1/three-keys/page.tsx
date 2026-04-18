"use client";
import { useState, useEffect } from "react";
import { Play, RotateCcw, Save, Sparkles, Music, Settings2, SlidersHorizontal, Volume2 } from "lucide-react";

const PIANO_KEYS = [
  { note: "C", type: "white" },
  { note: "C#", type: "black" },
  { note: "D", type: "white" },
  { note: "D#", type: "black" },
  { note: "E", type: "white" },
  { note: "F", type: "white" },
  { note: "F#", type: "black" },
  { note: "G", type: "white" },
  { note: "G#", type: "black" },
  { note: "A", type: "white" },
  { note: "A#", type: "black" },
  { note: "B", type: "white" },
];

const TIMBRES = ["🎹 三角钢琴", "🎵 木琴", "👦 童声", "🎸 吉他", "🪘 铃鼓"];
const STYLES = ["流行 Pop", "古典 Classical", "电子 Electronic", "摇滚 Rock", "爵士 Jazz"];
const EMOTIONS = ["欢快", "忧伤", "宁静", "激昂", "梦幻"];

export default function ThreeKeys() {
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [arrangement, setArrangement] = useState({
    timbre: TIMBRES[0],
    style: STYLES[0],
    emotion: EMOTIONS[0],
    tempo: 100,
    divergence: 50,
  });
  const [appState, setAppState] = useState<"idle" | "generating" | "done">("idle");
  const [progress, setProgress] = useState(0);

  const handleNoteClick = (note: string) => {
    if (selectedNotes.includes(note)) {
      setSelectedNotes(selectedNotes.filter((n) => n !== note));
    } else {
      if (selectedNotes.length < 3) {
        setSelectedNotes([...selectedNotes, note]);
      }
    }
  };

  const handleGenerate = () => {
    if (selectedNotes.length !== 3) return;
    setAppState("generating");
    setProgress(0);
    
    // Simulate generation
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setAppState("done");
          return 100;
        }
        return p + 5;
      });
    }, 150);
  };

  return (
    <div className="flex flex-col gap-6 items-center justify-center min-h-[70vh] pb-10">
      {/* Header */}
      <div className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border-4 border-macaron-purple flex flex-col md:flex-row items-center justify-between w-full max-w-6xl gap-4 md:gap-0">
        <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-macaron-purple rounded-full flex items-center justify-center text-2xl md:text-3xl flex-shrink-0 shadow-inner">
            🎹
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-purple-600">三键成曲</h1>
            <p className="text-sm md:text-base text-gray-500 font-bold mt-1">选3个不同的音，变出一首属于你的伴奏曲子！</p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6">
        {/* Left Panel: Piano & Notes */}
        <div className="flex-1 bg-white rounded-3xl p-6 md:p-8 shadow-md border-2 border-purple-100 flex flex-col gap-8 relative overflow-hidden">
          <div className="absolute top-10 right-10 text-4xl opacity-10 rotate-12">🎵</div>
          
          <div className="z-10">
            <h2 className="text-xl font-bold text-gray-700 flex items-center gap-2 mb-6">
              <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">1</span>
              选择3个魔法音符
            </h2>
            
            {/* Selected Notes Display */}
            <div className="flex justify-center gap-4 mb-10">
              {[0, 1, 2].map((i) => (
                <div 
                  key={i} 
                  className={`w-20 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-inner border-4 transition-all ${
                    selectedNotes[i] 
                      ? 'bg-purple-100 border-purple-400 text-purple-700 scale-110' 
                      : 'bg-gray-50 border-gray-200 text-gray-300'
                  }`}
                >
                  {selectedNotes[i] || '?'}
                </div>
              ))}
            </div>

            {/* Piano Keyboard UI */}
            <div className="relative h-48 md:h-56 flex justify-center bg-gray-100 p-4 rounded-3xl border-4 border-gray-300 shadow-inner overflow-x-auto">
              <div className="flex relative">
                {PIANO_KEYS.map((key, i) => {
                  const isSelected = selectedNotes.includes(key.note);
                  if (key.type === "white") {
                    return (
                      <button
                        key={key.note}
                        onClick={() => handleNoteClick(key.note)}
                        className={`w-12 md:w-16 h-full border-2 border-gray-300 rounded-b-xl flex items-end justify-center pb-4 text-lg font-bold transition-all relative z-0 ${
                          isSelected ? 'bg-purple-200 shadow-inner translate-y-1' : 'bg-white shadow-[0_4px_0_#d1d5db] hover:bg-gray-50'
                        }`}
                      >
                        <span className={isSelected ? 'text-purple-700' : 'text-gray-400'}>{key.note}</span>
                      </button>
                    );
                  } else {
                    return (
                      <button
                        key={key.note}
                        onClick={() => handleNoteClick(key.note)}
                        className={`w-8 md:w-10 h-3/5 bg-gray-800 border-2 border-gray-900 rounded-b-lg absolute z-10 flex items-end justify-center pb-2 text-xs font-bold transition-all ${
                          isSelected ? 'bg-purple-600 translate-y-1 shadow-inner' : 'shadow-[0_4px_0_#374151] hover:bg-gray-700'
                        }`}
                        style={{ marginLeft: '-1rem', left: `${(i / 2) * 3}rem` }} // Approximation for position
                      >
                        <span className="text-white opacity-80">{key.note}</span>
                      </button>
                    );
                  }
                })}
              </div>
            </div>
            <p className="text-center text-gray-400 font-bold mt-4">点击琴键选择音符</p>
          </div>
        </div>

        {/* Right Panel: Arrangement Controls */}
        <div className="flex-1 bg-white rounded-3xl p-6 md:p-8 shadow-md border-2 border-indigo-100 flex flex-col gap-6 relative z-10">
          <h2 className="text-xl font-bold text-gray-700 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">2</span>
            魔法编曲设置
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Timbre */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600 flex items-center gap-1"><Volume2 className="w-4 h-4"/> 音色选择</label>
              <select 
                value={arrangement.timbre}
                onChange={(e) => setArrangement({...arrangement, timbre: e.target.value})}
                className="w-full p-3 rounded-xl border-2 border-gray-200 bg-gray-50 focus:border-indigo-400 focus:ring-0 outline-none font-bold text-gray-700"
              >
                {TIMBRES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Style */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600 flex items-center gap-1"><Music className="w-4 h-4"/> 曲风</label>
              <select 
                value={arrangement.style}
                onChange={(e) => setArrangement({...arrangement, style: e.target.value})}
                className="w-full p-3 rounded-xl border-2 border-gray-200 bg-gray-50 focus:border-indigo-400 focus:ring-0 outline-none font-bold text-gray-700"
              >
                {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Emotion */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600 flex items-center gap-1"><Sparkles className="w-4 h-4"/> 情绪</label>
              <select 
                value={arrangement.emotion}
                onChange={(e) => setArrangement({...arrangement, emotion: e.target.value})}
                className="w-full p-3 rounded-xl border-2 border-gray-200 bg-gray-50 focus:border-indigo-400 focus:ring-0 outline-none font-bold text-gray-700"
              >
                {EMOTIONS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-6 mt-2">
            {/* Tempo */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-gray-600 flex items-center gap-1"><Settings2 className="w-4 h-4"/> 速度 (BPM): {arrangement.tempo}</label>
                <span className="text-xs text-gray-400 font-bold">{arrangement.tempo < 80 ? '慢' : arrangement.tempo > 120 ? '快' : '中'}</span>
              </div>
              <input 
                type="range" min="60" max="180" 
                value={arrangement.tempo}
                onChange={(e) => setArrangement({...arrangement, tempo: parseInt(e.target.value)})}
                className="w-full h-3 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Divergence */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-gray-600 flex items-center gap-1"><SlidersHorizontal className="w-4 h-4"/> AI 发散度: {arrangement.divergence}%</label>
                <span className="text-xs text-gray-400 font-bold">{arrangement.divergence < 30 ? '保守' : arrangement.divergence > 70 ? '天马行空' : '适中'}</span>
              </div>
              <input 
                type="range" min="0" max="100" 
                value={arrangement.divergence}
                onChange={(e) => setArrangement({...arrangement, divergence: parseInt(e.target.value)})}
                className="w-full h-3 bg-pink-100 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
            </div>
          </div>

          {/* Action Area */}
          <div className="mt-auto pt-6 border-t-2 border-gray-100">
            {appState === "idle" && (
              <button 
                onClick={handleGenerate}
                disabled={selectedNotes.length !== 3}
                className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all ${
                  selectedNotes.length === 3 
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white btn-bouncy hover:shadow-xl hover:scale-[1.02]' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-6 h-6" /> 
                {selectedNotes.length === 3 ? '开始魔法编曲' : `请先选择3个音符 (${selectedNotes.length}/3)`}
              </button>
            )}

            {appState === "generating" && (
              <div className="flex flex-col items-center gap-3">
                <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-200 shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-500 transition-all duration-150 ease-linear"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-purple-600 font-bold animate-pulse flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> AI正在为你创作专属伴奏...
                </p>
              </div>
            )}

            {appState === "done" && (
              <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-indigo-50 p-4 rounded-2xl border-2 border-indigo-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-200 rounded-full flex items-center justify-center">
                      <Music className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-bold text-indigo-900 text-sm">你的魔法伴奏</p>
                      <p className="text-xs text-indigo-600">{selectedNotes.join(' · ')} | {arrangement.style}</p>
                    </div>
                  </div>
                  <button className="w-12 h-12 bg-white text-indigo-500 rounded-full shadow border-2 border-indigo-200 flex items-center justify-center hover:bg-indigo-50 btn-bouncy">
                    <Play className="w-5 h-5 ml-1" fill="currentColor" />
                  </button>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => { setAppState("idle"); setSelectedNotes([]); }}
                    className="flex-1 py-3 bg-white text-gray-600 rounded-xl font-bold border-2 border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-2 text-sm"
                  >
                    <RotateCcw className="w-4 h-4" /> 重新创作
                  </button>
                  <button className="flex-1 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-xl font-bold shadow-md flex items-center justify-center gap-2 text-sm btn-bouncy">
                    <Save className="w-4 h-4" /> 保存作品
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
