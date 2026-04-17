"use client";
import { useState, useEffect, useRef } from "react";
import { Sparkles, Play, Music, Settings, Info, Square } from "lucide-react";

export default function MelodyGenerator() {
  const [emotion, setEmotion] = useState("开心");
  const [style, setStyle] = useState("儿歌");
  const [length, setLength] = useState(4);
  const [timbre, setTimbre] = useState("钢琴");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMelody, setGeneratedMelody] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Audio refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const buffersRef = useRef<Record<string, AudioBuffer>>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

    // Load backing track drum samples (reusing the ones from rhythm room)
    loadSound("kick", "/sounds/kick.mp3");
    loadSound("woodblock", "/sounds/woodblock.mp3");
    loadSound("tambourine", "/sounds/tambourine.mp3");

    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const emotions = [
    { name: "开心", icon: "😊", color: "bg-macaron-yellow" },
    { name: "温柔", icon: "😴", color: "bg-macaron-blue" },
    { name: "热血", icon: "🔥", color: "bg-red-200" },
    { name: "可爱", icon: "🐱", color: "bg-macaron-pink" }
  ];

  const styles = [
    { name: "儿歌", icon: "🎵", color: "bg-green-100" },
    { name: "流行", icon: "🎸", color: "bg-blue-100" },
    { name: "民谣", icon: "🎸", color: "bg-yellow-100" },
    { name: "少儿摇滚", icon: "🥁", color: "bg-purple-100" }
  ];

  const timbres = [
    { name: "钢琴", icon: "🎹", desc: "叮叮" },
    { name: "木琴", icon: "🔔", desc: "咚咚" },
    { name: "童声", icon: "👦", desc: "啊啊" },
    { name: "吉他", icon: "🎸", desc: "铮铮" },
    { name: "铃鼓", icon: "🪘", desc: "当当" }
  ];

  const handleGenerate = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    setIsGenerating(true);
    setGeneratedMelody(false);
    // Simulate API call
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedMelody(true);
    }, 2000);
  };

  const handlePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    setIsPlaying(true);
    const ctx = audioContextRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const startTime = ctx.currentTime + 0.1;
    // Set tempo based on style
    let bpm = 100;
    if (style === "儿歌") bpm = 110;
    if (style === "流行") bpm = 120;
    if (style === "民谣") bpm = 85;
    if (style === "少儿摇滚") bpm = 140;
    
    const beatLength = 60 / bpm;
    // Calculate total beats based on selected length (4 bars = 16 beats, 8 bars = 32 beats)
    // For simplicity in this demo, we'll loop the melody to fit the length
    const beatsPerBar = 4;
    const totalBeats = length * beatsPerBar; 

    // 1. Play Backing Track based on Style
    for(let i=0; i < totalBeats; i++) {
      const t = startTime + i * beatLength;
      const playDrum = (name: string, timeOffset: number) => {
        const buffer = buffersRef.current[name];
        if (buffer) {
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.start(timeOffset);
        }
      };

      if (style === "儿歌") {
        if (i % 2 === 0) playDrum("kick", t);
        else playDrum("woodblock", t);
      } else if (style === "流行") {
        if (i % 4 === 0 || i % 4 === 2.5) playDrum("kick", t);
        if (i % 4 === 2) playDrum("woodblock", t);
        playDrum("tambourine", t);
        playDrum("tambourine", t + beatLength/2);
      } else if (style === "民谣") {
        playDrum("tambourine", t);
        if (i % 4 === 0) playDrum("kick", t);
      } else if (style === "少儿摇滚") {
        playDrum("kick", t);
        if (i % 2 === 1) playDrum("woodblock", t);
        playDrum("tambourine", t);
        playDrum("tambourine", t + beatLength/2);
      }
    }

    // 2. Play Melody based on Emotion & Timbre
    // Frequencies for notes
    const FREQ = { 
      C4: 261.6, D4: 293.7, Eb4: 311.1, E4: 329.6, F4: 349.2, 
      G4: 392.0, A4: 440.0, Bb4: 466.2, C5: 523.3, D5: 587.3, E5: 659.3 
    };
    
    // Melody sequences (t is in beats, d is duration in seconds relative to beat)
    const MELODIES: Record<string, any[]> = {
      "开心": [
        { f: FREQ.C4, d: 0.8, t: 0 }, { f: FREQ.E4, d: 0.8, t: 1 },
        { f: FREQ.G4, d: 0.8, t: 2 }, { f: FREQ.C5, d: 1.5, t: 3 },
        { f: FREQ.G4, d: 0.8, t: 5 }, { f: FREQ.C5, d: 1.5, t: 6 }
      ],
      "温柔": [
        { f: FREQ.E4, d: 1.5, t: 0 }, { f: FREQ.G4, d: 1.5, t: 2 },
        { f: FREQ.A4, d: 1.5, t: 4 }, { f: FREQ.C5, d: 2.0, t: 6 }
      ],
      "热血": [
        { f: FREQ.C4, d: 0.3, t: 0 }, { f: FREQ.C4, d: 0.3, t: 0.5 },
        { f: FREQ.Eb4, d: 0.6, t: 1 }, { f: FREQ.F4, d: 0.6, t: 2 },
        { f: FREQ.G4, d: 0.6, t: 3 }, { f: FREQ.C5, d: 1.5, t: 4 },
        { f: FREQ.Bb4, d: 0.6, t: 6 }, { f: FREQ.C5, d: 1.5, t: 7 }
      ],
      "可爱": [
        { f: FREQ.C5, d: 0.3, t: 0 }, { f: FREQ.G4, d: 0.3, t: 1 },
        { f: FREQ.C5, d: 0.3, t: 2 }, { f: FREQ.G4, d: 0.3, t: 3 },
        { f: FREQ.E5, d: 0.6, t: 4 }, { f: FREQ.C5, d: 1.5, t: 5 }
      ]
    };

    const currentMelody = MELODIES[emotion] || MELODIES["开心"];
    
    // Repeat the melody pattern to fill the selected length
    // Each pattern is 2 bars (8 beats) long
    const patternLength = 8;
    const numRepeats = totalBeats / patternLength;

    for (let r = 0; r < numRepeats; r++) {
      currentMelody.forEach(note => {
        // Add offset for each repeat (patternLength beats per repeat)
        const time = startTime + (note.t + r * patternLength) * beatLength; 
        const duration = note.d * beatLength; // scale duration by tempo
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        // Synthesize Timbre
        if (timbre === "钢琴") {
          osc.type = "sine";
          gain.gain.setValueAtTime(0.8, time);
          gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
        } else if (timbre === "木琴") {
          osc.type = "square";
          gain.gain.setValueAtTime(0.3, time);
          gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1); // very short decay
        } else if (timbre === "童声") {
          osc.type = "triangle";
          // smooth attack and release for "ahh" sound
          gain.gain.setValueAtTime(0, time);
          gain.gain.linearRampToValueAtTime(0.6, time + 0.1);
          gain.gain.linearRampToValueAtTime(0, time + duration);
        } else if (timbre === "吉他") {
          osc.type = "sawtooth";
          // sharp attack, medium decay
          gain.gain.setValueAtTime(0, time);
          gain.gain.linearRampToValueAtTime(0.3, time + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
        } else if (timbre === "铃鼓") {
          osc.type = "square";
          osc.frequency.setValueAtTime(2000, time); // fixed high freq for tambourine-like synth
          gain.gain.setValueAtTime(0.1, time);
          gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
        }

        if (timbre !== "铃鼓") {
          // If repeating, maybe transpose the second half up a 5th (7 semitones) for variety!
          // But for now let's just repeat it exactly.
          osc.frequency.setValueAtTime(note.f, time);
        }
        
        osc.start(time);
        osc.stop(time + duration);
      });
    }

    // Reset UI when done
    timerRef.current = setTimeout(() => {
      setIsPlaying(false);
    }, (totalBeats * beatLength * 1000) + 500);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border-4 border-macaron-blue flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-macaron-blue rounded-full flex items-center justify-center text-3xl">
            🎹
          </div>
          <div>
            <h1 className="text-3xl font-bold text-teal-600">AI旋律生成器</h1>
            <p className="text-gray-500 font-bold mt-1">选一个心情，让小精灵为你写一句好听的旋律！</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: Inputs */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border-2 border-blue-100 flex flex-col gap-6">
          {/* Emotion */}
          <div>
            <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
              <span className="text-2xl">💖</span> 你现在的心情是？
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {emotions.map(e => (
                <button
                  key={e.name}
                  onClick={() => setEmotion(e.name)}
                  className={`btn-bouncy flex flex-col items-center justify-center p-4 rounded-2xl border-4 transition-all ${emotion === e.name ? `border-blue-400 ${e.color} shadow-inner` : 'border-transparent bg-gray-50 hover:bg-gray-100'}`}
                >
                  <span className="text-4xl mb-2">{e.icon}</span>
                  <span className="font-bold text-gray-700">{e.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div>
            <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
              <span className="text-2xl">🎨</span> 想听什么风格的音乐？
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {styles.map(s => (
                <button
                  key={s.name}
                  onClick={() => setStyle(s.name)}
                  className={`btn-bouncy flex flex-col items-center justify-center p-4 rounded-2xl border-4 transition-all ${style === s.name ? `border-teal-400 ${s.color} shadow-inner` : 'border-transparent bg-gray-50 hover:bg-gray-100'}`}
                >
                  <span className="text-4xl mb-2">{s.icon}</span>
                  <span className="font-bold text-gray-700">{s.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Length */}
          <div className="flex items-center justify-between bg-blue-50 p-4 rounded-2xl">
            <span className="font-bold text-gray-700 flex items-center gap-2">
              <Settings className="w-5 h-5 text-teal-500" />
              长度选择：
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setLength(4)}
                className={`px-4 py-2 rounded-full font-bold ${length === 4 ? 'bg-teal-500 text-white' : 'bg-white text-gray-500'}`}
              >
                4小节 (一句话)
              </button>
              <button 
                onClick={() => setLength(8)}
                className={`px-4 py-2 rounded-full font-bold ${length === 8 ? 'bg-teal-500 text-white' : 'bg-white text-gray-500'}`}
              >
                8小节 (一段话)
              </button>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="btn-bouncy w-full py-4 mt-2 bg-gradient-to-r from-teal-400 to-blue-500 text-white rounded-2xl font-bold text-xl shadow-lg flex items-center justify-center gap-3 disabled:opacity-70"
          >
            {isGenerating ? (
              <span className="animate-pulse">✨ 小精灵正在努力创作中...</span>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                召唤音乐小精灵
              </>
            )}
          </button>
        </div>

        {/* Right Panel: Visualization & Playback */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border-2 border-blue-100 flex flex-col">
          <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="text-2xl">🌈</span> 魔法旋律预览
          </h2>
          
          {generatedMelody ? (
            <div className="flex-1 flex flex-col gap-6">
              {/* Piano Roll Mockup */}
              <div className="flex-1 bg-gray-900 rounded-2xl p-4 overflow-hidden relative shadow-inner min-h-[200px]">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                
                {/* Colorful magic blocks representing notes */}
                <div className={`absolute top-1/4 left-10 w-16 h-8 bg-pink-500 rounded shadow-[0_0_10px_rgba(236,72,153,0.8)] ${isPlaying ? 'animate-bounce' : ''}`}></div>
                <div className={`absolute top-1/3 left-32 w-12 h-8 bg-blue-400 rounded shadow-[0_0_10px_rgba(96,165,250,0.8)] ${isPlaying ? 'animate-bounce delay-75' : ''}`}></div>
                <div className={`absolute top-1/2 left-48 w-24 h-8 bg-yellow-400 rounded shadow-[0_0_10px_rgba(250,204,21,0.8)] ${isPlaying ? 'animate-bounce delay-150' : ''}`}></div>
                <div className={`absolute top-1/4 left-[18rem] w-12 h-8 bg-green-400 rounded shadow-[0_0_10px_rgba(74,222,128,0.8)] ${isPlaying ? 'animate-bounce delay-300' : ''}`}></div>
                
                <div className="absolute bottom-2 left-4 text-xs text-gray-400 font-bold">高音</div>
                <div className="absolute top-2 left-4 text-xs text-gray-400 font-bold">低音</div>
              </div>

              {/* Timbre Selection */}
              <div>
                <p className="font-bold text-gray-600 mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4 text-teal-500" /> 换个声音听听看：
                </p>
                <div className="flex flex-wrap gap-2">
                  {timbres.map(t => (
                    <button
                      key={t.name}
                      onClick={() => setTimbre(t.name)}
                      className={`btn-bouncy px-4 py-2 rounded-full font-bold flex items-center gap-2 border-2 ${timbre === t.name ? 'bg-teal-100 text-teal-700 border-teal-300' : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100'}`}
                    >
                      <span>{t.icon}</span>
                      <span>{t.name}</span>
                      <span className="text-xs opacity-70">({t.desc})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Play Button */}
              <button 
                onClick={handlePlay}
                className={`btn-bouncy w-full py-4 mt-auto border-2 rounded-2xl font-bold text-xl shadow-md flex items-center justify-center gap-3 transition-colors ${isPlaying ? 'bg-red-400 text-white border-red-500' : 'bg-macaron-blue text-teal-800 border-teal-300'}`}
              >
                {isPlaying ? <Square className="w-6 h-6" fill="currentColor" /> : <Play className="w-6 h-6" fill="currentColor" />}
                {isPlaying ? "停止魔法" : "播放魔法旋律"}
              </button>
            </div>
          ) : (
            <div className="flex-1 border-4 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center p-8 gap-4 min-h-[300px]">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                <Music className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-gray-400 font-bold text-lg">
                告诉小精灵你的心情和风格，<br/>然后点击“召唤音乐小精灵”吧！
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}