"use client";
import { useState, useEffect, useRef } from "react";
import { Play, Info, Trash2, Repeat, Square, Turtle, Rabbit } from "lucide-react";

type GameLevel = {
  id: number;
  name: string;
  difficulty: "简单" | "中等" | "困难" | "专家";
  tempo: number;
  totalBeats: number;
  rhythmPattern: number[];
  bgmUrl: string;
};

const buildPattern = (type: number, maxBeats: number) => {
  const pattern: number[] = [];
  if (type === 1) { // 小星星 (简单，基本全四分音符)
    for (let i = 0; i < maxBeats; i += 8) {
      pattern.push(i+1, i+2, i+3, i+4, i+5, i+6, i+7);
    }
  } else if (type === 2) { // 两只老虎 (中等，加入少量八分音符)
    for (let i = 0; i < maxBeats; i += 32) {
      pattern.push(
        i+1, i+2, i+3, i+4,  i+5, i+6, i+7, i+8,
        i+9, i+10, i+11,     i+13, i+14, i+15,
        i+17, i+17.5, i+18, i+18.5, i+19, i+20,
        i+21, i+21.5, i+22, i+22.5, i+23, i+24,
        i+25, i+26, i+27,    i+29, i+30, i+31
      );
    }
  } else if (type === 3) { // 粉刷匠 (困难，附点或连续八分音符)
    for (let i = 0; i < maxBeats; i += 16) {
      pattern.push(
        i+1, i+1.5, i+2, i+3, i+4,  i+5, i+5.5, i+6, i+7,
        i+9, i+10, i+11, i+12,      i+13, i+14, i+15
      );
    }
  } else if (type === 4) { // 数鸭子 (专家，连续且快速的八分音符)
    for (let i = 0; i < maxBeats; i += 8) {
      pattern.push(
        i+1, i+1.5, i+2, i+2.5, i+3, i+4,
        i+5, i+5.5, i+6, i+6.5, i+7, i+8
      );
    }
  }
  return pattern.filter(b => b <= maxBeats);
};

const gameLevels: GameLevel[] = [
  { id: 1, name: "小星星", difficulty: "简单", tempo: 90, totalBeats: 45, rhythmPattern: buildPattern(1, 45), bgmUrl: "/sounds/xiaoxingxing.mp3" },
  { id: 2, name: "两只老虎", difficulty: "中等", tempo: 100, totalBeats: 50, rhythmPattern: buildPattern(2, 50), bgmUrl: "/sounds/liangzhilaohu.mp3" },
  { id: 3, name: "粉刷匠", difficulty: "困难", tempo: 110, totalBeats: 55, rhythmPattern: buildPattern(3, 55), bgmUrl: "/sounds/fenshuajiang.mp3" },
  { id: 4, name: "数鸭子", difficulty: "专家", tempo: 120, totalBeats: 60, rhythmPattern: buildPattern(4, 60), bgmUrl: "/sounds/shuyazi.mp3" }
];

function RhythmGame() {
  const [gameState, setGameState] = useState<"select" | "playing" | "result">("select");
  const [selectedLevel, setSelectedLevel] = useState<GameLevel | null>(null);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [score, setScore] = useState(0);
  const [maxPossibleScore, setMaxPossibleScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [feedback, setFeedback] = useState<{text: string, id: number, type: 'perfect'|'good'|'miss'} | null>(null);
  const [activeNotes, setActiveNotes] = useState<{id: number, beat: number, hit: boolean, missed: boolean}[]>([]);
  const [bgmError, setBgmError] = useState<boolean>(false);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const startTimeRef = useRef<number>(0);
  const requestRef = useRef<number>(0);
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
  const bgmStartedRef = useRef<boolean>(false);
  
  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
      if (bgmAudioRef.current) {
        bgmAudioRef.current.pause();
        bgmAudioRef.current = null;
      }
    };
  }, []);

  const startGame = (level: GameLevel) => {
    setSelectedLevel(level);
    setScore(0);
    setCombo(0);
    setMaxPossibleScore(level.rhythmPattern.length * 100);
    setGameState("playing");
    setFeedback(null);
    setBgmError(false);
    
    if (bgmAudioRef.current) {
      bgmAudioRef.current.pause();
    }
    bgmAudioRef.current = new Audio(level.bgmUrl);
    bgmAudioRef.current.onerror = () => {
      console.warn(`Audio file not found or not supported: ${level.bgmUrl}. Game will proceed without BGM.`);
      setBgmError(true);
    };
    bgmStartedRef.current = false;
    
    const notes = level.rhythmPattern.map((b, i) => ({id: i, beat: b, hit: false, missed: false}));
    setActiveNotes(notes);
    
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    
    startTimeRef.current = ctx.currentTime + 2; // 2 seconds delay for count in
    
    const update = () => {
       const now = audioCtxRef.current!.currentTime;
       const elapsed = now - startTimeRef.current;
       const beat = elapsed * (level.tempo / 60);
       setCurrentBeat(beat);
       
       if (beat >= 0 && !bgmStartedRef.current && bgmAudioRef.current && !bgmError) {
         bgmAudioRef.current.play().catch(e => {
           console.warn("Audio play failed, playing without BGM:", e);
           setBgmError(true);
         });
         bgmStartedRef.current = true;
       }
       
       setActiveNotes(prev => {
         let changed = false;
         const next = prev.map(n => {
           if (!n.hit && !n.missed && beat > n.beat + 0.5) {
             changed = true;
             setCombo(0);
             setFeedback({text: "加油", id: Date.now(), type: 'miss'});
             return {...n, missed: true};
           }
           return n;
         });
         return changed ? next : prev;
       });
       
       if (elapsed >= 30) {
          if (bgmAudioRef.current) {
            bgmAudioRef.current.pause();
            bgmAudioRef.current.currentTime = 0;
          }
       }
       
       if (elapsed > 31) {
          setGameState("result");
          return;
       }
       requestRef.current = requestAnimationFrame(update);
    };
    requestRef.current = requestAnimationFrame(update);
  };

  const handleScreenClick = () => {
     if (gameState !== "playing" || !selectedLevel) return;
     
     // Play tap sound
     if (audioCtxRef.current) {
         const ctx = audioCtxRef.current;
         const osc = ctx.createOscillator();
         const gain = ctx.createGain();
         osc.connect(gain);
         gain.connect(ctx.destination);
         osc.type = "sine";
         osc.frequency.setValueAtTime(800, ctx.currentTime);
         osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
         gain.gain.setValueAtTime(0.5, ctx.currentTime);
         gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
         osc.start(ctx.currentTime);
         osc.stop(ctx.currentTime + 0.1);
     }
     
     // Calculate hit
     setActiveNotes(prev => {
       const unhit = prev.filter(n => !n.hit && !n.missed);
       if (unhit.length === 0) return prev;
       
       unhit.sort((a,b) => Math.abs(a.beat - currentBeat) - Math.abs(b.beat - currentBeat));
       const nearest = unhit[0];
       const diff = Math.abs(nearest.beat - currentBeat);
       
       if (diff < 0.25) {
          setScore(s => s + 100);
          setCombo(c => c + 1);
          setFeedback({text: "完美", id: Date.now(), type: 'perfect'});
          return prev.map(n => n.id === nearest.id ? {...n, hit: true} : n);
       } else if (diff < 0.5) {
          setScore(s => s + 60);
          setCombo(c => c + 1);
          setFeedback({text: "不错", id: Date.now(), type: 'good'});
          return prev.map(n => n.id === nearest.id ? {...n, hit: true} : n);
       } else {
          setCombo(0);
          setFeedback({text: "加油", id: Date.now(), type: 'miss'});
          return prev;
       }
     });
  };

  const finalScore100 = maxPossibleScore > 0 ? Math.round((score / maxPossibleScore) * 100) : 0;
  const currentScore100 = maxPossibleScore > 0 ? Math.round((score / maxPossibleScore) * 100) : 0;

  if (gameState === "select") {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-sm border-2 border-orange-100">
        <h2 className="text-2xl font-bold text-center text-orange-600 mb-8">选择你的闯关曲目</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {gameLevels.map(level => (
            <div key={level.id} className="bg-orange-50 rounded-2xl p-6 border-2 border-orange-200 flex flex-col items-center gap-4 hover:shadow-md transition-all">
              <div className="text-4xl">🎵</div>
              <h3 className="text-xl font-bold text-gray-800">{level.name}</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-bold text-white ${
                level.difficulty === '简单' ? 'bg-green-400' :
                level.difficulty === '中等' ? 'bg-blue-400' :
                level.difficulty === '困难' ? 'bg-purple-400' : 'bg-red-400'
              }`}>
                {level.difficulty}
              </span>
              <button 
                onClick={() => startGame(level)}
                className="mt-2 px-6 py-2 bg-orange-500 text-white rounded-full font-bold hover:bg-orange-600"
              >
                开始挑战
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (gameState === "result") {
    return (
      <div className="bg-white rounded-3xl p-12 shadow-sm border-2 border-orange-100 flex flex-col items-center justify-center text-center gap-6 min-h-[400px]">
        <div className="text-6xl animate-bounce">
          {finalScore100 >= 90 ? "👑" : finalScore100 >= 60 ? "🌟" : "💪"}
        </div>
        <h2 className="text-3xl font-bold text-orange-600">闯关结束！</h2>
        <div className="text-5xl font-bold text-orange-500">{finalScore100} 分</div>
        <p className="text-gray-500 font-bold text-lg">
          {finalScore100 >= 90 ? "太棒了！你就是节奏大师！" : 
           finalScore100 >= 60 ? "不错哦！继续加油！" : 
           "多加练习，你一定能行！"}
        </p>
        <button 
          onClick={() => setGameState("select")}
          className="mt-4 px-8 py-3 bg-orange-500 text-white rounded-full font-bold hover:bg-orange-600 text-lg shadow-md"
        >
          再玩一次
        </button>
      </div>
    );
  }

  return (
    <div 
      className="bg-gray-900 rounded-3xl p-8 shadow-sm border-4 border-gray-800 relative overflow-hidden h-[400px] cursor-pointer select-none"
      onClick={handleScreenClick}
    >
      <div className="flex justify-between items-center relative z-10">
        <div className="text-white font-bold text-xl">{selectedLevel?.name}</div>
        <div className="flex gap-6 items-center">
          <div className="text-yellow-400 font-bold text-xl">得分: {currentScore100}</div>
          <div className="text-orange-400 font-bold text-2xl">Combo {combo}</div>
        </div>
      </div>

      {currentBeat < 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="text-white text-6xl font-bold animate-pulse">
            {currentBeat > -0.5 ? "GO!" : Math.ceil(-currentBeat)}
          </div>
        </div>
      )}

      {feedback && (
        <div 
          key={feedback.id}
          className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl font-bold z-20 pointer-events-none animate-bounce
            ${feedback.type === 'perfect' ? 'text-yellow-400' : 
              feedback.type === 'good' ? 'text-green-400' : 'text-gray-400'}`}
          style={{ textShadow: '0 4px 8px rgba(0,0,0,0.5)' }}
        >
          {feedback.text}
        </div>
      )}

      <div className="absolute bottom-24 left-0 right-0 h-24 bg-gray-800/50 border-y-2 border-gray-700">
        <div className="absolute top-0 bottom-0 left-[20%] w-2 bg-yellow-400/80 shadow-[0_0_15px_rgba(250,204,21,0.8)] z-10" />
        
        {activeNotes.map(note => {
          if (note.hit || note.missed) return null;
          const distanceBeats = note.beat - currentBeat;
          const leftPos = 20 + distanceBeats * 20;
          
          if (leftPos > 110 || leftPos < -10) return null;

          return (
            <div 
              key={note.id}
              className="absolute top-1/2 -translate-y-1/2 w-12 h-12 bg-orange-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white text-2xl z-20"
              style={{ left: `${leftPos}%` }}
            >
              🎵
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-6 left-0 right-0 text-center text-gray-400 font-bold z-10">
        当音符到达黄线时，点击屏幕任意位置！
      </div>
    </div>
  );
}

export default function RhythmRoom() {
  const [activeTab, setActiveTab] = useState<"game" | "create">("create");
  
  // Track has 4 slots for simplicity in this prototype
  const [track, setTrack] = useState<(string | null)[]>([null, null, null, null]);
  const [drumSound, setDrumSound] = useState("卡通鼓");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [tempo, setTempo] = useState(100); // Default BPM

  // refs for audio
  const audioContextRef = useRef<AudioContext | null>(null);
  const buffersRef = useRef<Record<string, AudioBuffer>>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // keep refs of state for callbacks inside timeouts
  const isPlayingRef = useRef(isPlaying);
  const isLoopingRef = useRef(isLooping);
  const drumSoundRef = useRef(drumSound);
  const trackRef = useRef(track);
  const tempoRef = useRef(tempo);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { isLoopingRef.current = isLooping; }, [isLooping]);
  useEffect(() => { drumSoundRef.current = drumSound; }, [drumSound]);
  useEffect(() => { trackRef.current = track; }, [track]);
  useEffect(() => { tempoRef.current = tempo; }, [tempo]);

  useEffect(() => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    audioContextRef.current = new AudioContext();
    
    const loadSound = async (name: string, url: string) => {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContextRef.current!.decodeAudioData(arrayBuffer);
        buffersRef.current[name] = audioBuffer;
      } catch (e) {
        console.error("Failed to load sound", name, e);
      }
    };

    loadSound("卡通鼓", "/sounds/kick.mp3");
    loadSound("木琴鼓", "/sounds/woodblock.mp3");
    loadSound("铃鼓", "/sounds/tambourine.mp3");

    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const notes = [
    { id: "half", name: "二分音符", icon: "🐢", text: "走~", duration: 2 },
    { id: "quarter", name: "四分音符", icon: "🚶", text: "走", duration: 1 },
    { id: "eighth", name: "八分音符", icon: "🏃", text: "跑跑", duration: 0.5 },
  ];

  const handleDrop = (index: number, noteId: string) => {
    const newTrack = [...track];
    newTrack[index] = noteId;
    setTrack(newTrack);
  };

  const clearTrack = () => {
    setTrack([null, null, null, null]);
    stopRhythm();
  };

  const toggleLoop = () => {
    setIsLooping(!isLooping);
  };

  const stopRhythm = () => {
    setIsPlaying(false);
    setPlayingIndex(null);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const playSequence = () => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const currentTempo = tempoRef.current;
    const beatDuration = 60 / currentTempo; // calculate duration based on BPM
    const startTime = ctx.currentTime + 0.1;
    const currentTrack = trackRef.current;
    const currentDrum = drumSoundRef.current;

    currentTrack.forEach((noteId, index) => {
      const time = startTime + index * beatDuration;
      
      setTimeout(() => {
        if (isPlayingRef.current) setPlayingIndex(index);
      }, (time - ctx.currentTime) * 1000);

      if (!noteId) return;

      const playHit = (t: number) => {
        const buffer = buffersRef.current[currentDrum];
        if (buffer) {
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.start(t);
        }
      };

      if (noteId === "eighth") {
        playHit(time);
        playHit(time + beatDuration / 2);
      } else {
        playHit(time);
      }
    });

    timerRef.current = setTimeout(() => {
      if (!isPlayingRef.current) return;
      if (isLoopingRef.current) {
        playSequence();
      } else {
        setIsPlaying(false);
        setPlayingIndex(null);
      }
    }, (startTime + currentTrack.length * beatDuration - ctx.currentTime) * 1000);
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopRhythm();
    } else {
      setIsPlaying(true);
      setTimeout(() => {
        playSequence();
      }, 0);
    }
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border-4 border-macaron-yellow flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
        <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-macaron-yellow rounded-full flex items-center justify-center text-2xl md:text-3xl flex-shrink-0">
            🥁
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-orange-600">节奏魔法练习室</h1>
            <p className="text-sm md:text-base text-gray-500 font-bold mt-1">跟着节拍，创造你的专属鼓点吧！</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto justify-center">
          <button 
            onClick={() => setActiveTab("game")}
            className={`px-4 md:px-6 py-2 md:py-3 rounded-full font-bold transition-all text-sm md:text-base ${activeTab === "game" ? "bg-orange-500 text-white shadow-md" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
          >
            闯关游戏
          </button>
          <button 
            onClick={() => setActiveTab("create")}
            className={`px-4 md:px-6 py-2 md:py-3 rounded-full font-bold transition-all text-sm md:text-base ${activeTab === "create" ? "bg-orange-500 text-white shadow-md" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
          >
            自由创作
          </button>
        </div>
      </div>

      {activeTab === "create" ? (
        <div className="bg-white rounded-3xl p-4 md:p-8 shadow-sm border-2 border-orange-100 flex flex-col gap-6 md:gap-8">
          {/* Note Selection */}
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0" /> 第一步：认识魔法音符
            </h2>
            <div className="flex flex-wrap gap-2 md:gap-4 justify-center md:justify-start">
              {notes.map(note => (
                <div 
                  key={note.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("noteId", note.id)}
                  className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-2 md:p-4 flex flex-col items-center gap-1 md:gap-2 cursor-grab active:cursor-grabbing hover:bg-orange-100 transition-colors w-24 md:w-32"
                >
                  <span className="text-3xl md:text-4xl">{note.icon}</span>
                  <span className="font-bold text-orange-800 text-xs md:text-base">{note.name}</span>
                  <span className="bg-white px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-bold text-orange-500">"{note.text}"</span>
                </div>
              ))}
            </div>
          </div>

          {/* Track Area */}
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0" /> 第二步：把音符拖进小方格里
            </h2>
            <div className="flex flex-col sm:flex-row gap-2 md:gap-4 bg-gray-50 p-4 md:p-6 rounded-3xl border-2 border-dashed border-gray-300">
              {track.map((slot, index) => (
                <div 
                  key={index}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop(index, e.dataTransfer.getData("noteId"));
                  }}
                  className={`flex-1 h-24 md:h-32 rounded-2xl border-4 flex flex-col items-center justify-center gap-1 md:gap-2 transition-all duration-150 ${playingIndex === index ? 'scale-105 shadow-xl border-orange-500 bg-orange-200 z-10' : slot ? 'border-orange-400 bg-orange-100' : 'border-gray-200 bg-white border-dashed'}`}
                >
                  {slot ? (
                    <>
                      <span className="text-4xl">{notes.find(n => n.id === slot)?.icon}</span>
                      <span className="font-bold text-orange-800">{notes.find(n => n.id === slot)?.text}</span>
                      <button 
                        onClick={() => handleDrop(index, "")}
                        className="text-xs text-red-400 mt-2 hover:text-red-600 font-bold"
                      >
                        拿走
                      </button>
                    </>
                  ) : (
                    <span className="text-gray-400 font-bold">放在这里</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Play & Settings */}
          <div className="flex flex-col lg:flex-row items-center justify-between bg-orange-50 p-6 rounded-3xl gap-6">
            
            {/* Left side: Sound & Tempo */}
            <div className="flex flex-col gap-4 w-full lg:w-auto">
              <div className="flex items-center gap-4">
                <span className="font-bold text-gray-700 min-w-[100px]">选择鼓点声音：</span>
                <div className="flex flex-wrap gap-2">
                  {["卡通鼓", "木琴鼓", "铃鼓"].map(drum => (
                    <button
                      key={drum}
                      onClick={() => setDrumSound(drum)}
                      className={`px-4 py-2 rounded-full font-bold border-2 transition-all ${drumSound === drum ? 'bg-orange-400 text-white border-orange-500 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'}`}
                    >
                      {drum}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border-2 border-orange-100">
                <span className="font-bold text-gray-700 min-w-[100px]">调节节奏快慢：</span>
                <div className="flex items-center gap-3 flex-1 max-w-[200px]">
                  <Turtle className="w-5 h-5 text-green-500" />
                  <input 
                    type="range" 
                    min="60" 
                    max="180" 
                    value={tempo} 
                    onChange={(e) => setTempo(parseInt(e.target.value))}
                    className="flex-1 accent-orange-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <Rabbit className="w-5 h-5 text-orange-500" />
                </div>
                <span className="text-sm font-bold text-orange-500 bg-orange-100 px-2 py-1 rounded-md">{tempo}</span>
              </div>
            </div>
            
            {/* Right side: Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 w-full lg:w-auto">
              <button 
                onClick={clearTrack}
                className="btn-bouncy flex items-center gap-2 px-6 py-3 bg-white text-red-500 border-2 border-red-200 rounded-full font-bold hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-5 h-5" /> 一键清空
              </button>
              <button 
                onClick={toggleLoop}
                className={`btn-bouncy flex items-center gap-2 px-6 py-3 border-2 rounded-full font-bold transition-colors ${isLooping ? 'bg-blue-100 text-blue-600 border-blue-300 shadow-inner' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
              >
                <Repeat className="w-5 h-5" /> {isLooping ? '循环开' : '循环关'}
              </button>
              <button 
                onClick={togglePlay}
                className={`btn-bouncy flex items-center gap-2 px-8 py-3 rounded-full font-bold shadow-md text-lg transition-colors ${isPlaying ? 'bg-red-400 text-white border-2 border-red-500' : 'bg-macaron-yellow text-orange-800 border-2 border-orange-300'}`}
              >
                {isPlaying ? <Square className="w-6 h-6" fill="currentColor" /> : <Play className="w-6 h-6" fill="currentColor" />} 
                {isPlaying ? "停止播放" : "播放魔法节奏"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <RhythmGame />
      )}
    </div>
  );
}