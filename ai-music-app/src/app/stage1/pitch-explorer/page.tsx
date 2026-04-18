"use client";
import { useState, useEffect, useRef } from "react";
import { Play, ArrowUpRight, ArrowDownRight, Music, Sparkles } from "lucide-react";
import * as Tone from "tone";

const PITCHES = [
  { id: 1, name: "do", note: "C4", color: "bg-red-400" },
  { id: 2, name: "re", note: "D4", color: "bg-orange-400" },
  { id: 3, name: "mi", note: "E4", color: "bg-yellow-400" },
  { id: 4, name: "fa", note: "F4", color: "bg-green-400" },
  { id: 5, name: "sol", note: "G4", color: "bg-teal-400" },
  { id: 6, name: "la", note: "A4", color: "bg-blue-400" },
  { id: 7, name: "si", note: "B4", color: "bg-purple-400" },
  { id: 8, name: "do (高)", note: "C5", color: "bg-pink-400" },
];

export default function PitchExplorer() {
  const [activeNote, setActiveNote] = useState<number | null>(null);
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const synthRef = useRef<Tone.Synth | null>(null);

  useEffect(() => {
    // Initialize synth
    synthRef.current = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.05, decay: 0.2, sustain: 0.5, release: 1 }
    }).toDestination();

    return () => {
      if (synthRef.current) {
        synthRef.current.dispose();
      }
      Tone.Transport.stop();
      Tone.Transport.cancel();
    };
  }, []);

  const playNote = async (pitch: typeof PITCHES[0]) => {
    if (isPlayingSequence) return;
    
    await Tone.start();
    setActiveNote(pitch.id);
    
    if (synthRef.current) {
      synthRef.current.triggerAttackRelease(pitch.note, "4n");
    }

    setTimeout(() => {
      setActiveNote(null);
    }, 500);
  };

  const playSequence = async (direction: "up" | "down") => {
    if (isPlayingSequence) return;
    await Tone.start();
    setIsPlayingSequence(true);

    const sequence = direction === "up" ? PITCHES : [...PITCHES].reverse();
    
    let time = Tone.now();
    sequence.forEach((pitch, index) => {
      Tone.Transport.scheduleOnce((t) => {
        setActiveNote(pitch.id);
        if (synthRef.current) {
          synthRef.current.triggerAttackRelease(pitch.note, "8n", t);
        }
        
        // Reset active note state after sequence finishes
        if (index === sequence.length - 1) {
          setTimeout(() => {
            setActiveNote(null);
            setIsPlayingSequence(false);
          }, 500);
        }
      }, time + index * 0.4);
    });

    Tone.Transport.start();
  };

  return (
    <div className="flex flex-col gap-6 items-center justify-center min-h-[70vh] pb-10">
      {/* Header */}
      <div className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border-4 border-macaron-green flex flex-col md:flex-row items-center justify-between w-full max-w-4xl gap-4 md:gap-0">
        <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-macaron-green rounded-full flex items-center justify-center text-2xl md:text-3xl flex-shrink-0 shadow-inner">
            🪜
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-green-600">音高体验器</h1>
            <p className="text-sm md:text-base text-gray-500 font-bold mt-1">爬上魔法楼梯，听听声音变高变低的奇妙感觉！</p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl bg-white rounded-3xl p-6 md:p-10 shadow-md border-2 border-green-100 flex flex-col gap-8 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-10 left-10 text-4xl opacity-20 -rotate-12">🎵</div>
        <div className="absolute bottom-20 right-10 text-5xl opacity-20 rotate-12">✨</div>

        <div className="text-center z-10">
          <h2 className="text-2xl font-bold text-gray-700 flex items-center justify-center gap-2">
            <Music className="w-6 h-6 text-green-500" />
            魔法音高楼梯
          </h2>
          <p className="text-gray-500 font-bold mt-2">点击不同的台阶，感受声音的高低变化吧！</p>
        </div>

        {/* Stairs Visualization */}
        <div className="relative h-[400px] w-full max-w-2xl mx-auto flex items-end justify-center z-10 px-4">
          <div className="flex items-end justify-between w-full h-full gap-2">
            {PITCHES.map((pitch, index) => {
              const heightPercentage = 20 + (index * 11); // Stair height calculation
              const isActive = activeNote === pitch.id;
              
              return (
                <div 
                  key={pitch.id}
                  className="flex flex-col items-center justify-end h-full flex-1 group cursor-pointer"
                  onClick={() => playNote(pitch)}
                >
                  {/* Floating Note indicator */}
                  <div className={`mb-4 transition-all duration-300 ${isActive ? 'opacity-100 -translate-y-4 scale-125' : 'opacity-0 translate-y-0'}`}>
                    <span className="text-2xl">🎵</span>
                  </div>
                  
                  {/* The Stair Block */}
                  <div 
                    className={`w-full rounded-t-xl transition-all duration-200 border-x-4 border-t-4 border-white/20 shadow-lg flex flex-col items-center justify-start pt-4 relative overflow-hidden
                      ${pitch.color} 
                      ${isActive ? 'brightness-110 shadow-[0_0_20px_rgba(255,255,255,0.8)] scale-y-[1.02] origin-bottom' : 'hover:brightness-105'}
                    `}
                    style={{ height: `${heightPercentage}%` }}
                  >
                    {/* Glossy reflection effect */}
                    <div className="absolute top-0 left-0 right-0 h-1/3 bg-white/20 rounded-t-xl"></div>
                    
                    <span className="text-white font-extrabold text-xl md:text-2xl drop-shadow-md relative z-10">{pitch.id}</span>
                    <span className="text-white/90 font-bold text-sm mt-1 relative z-10">{pitch.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl mx-auto mt-6 z-10">
          <button 
            onClick={() => playSequence("up")}
            disabled={isPlayingSequence}
            className={`flex-1 py-4 rounded-2xl font-bold text-lg shadow-md flex items-center justify-center gap-2 transition-all ${
              isPlayingSequence 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white btn-bouncy hover:shadow-lg'
            }`}
          >
            <ArrowUpRight className="w-6 h-6" /> 
            上行旋律 (越来越高)
          </button>
          
          <button 
            onClick={() => playSequence("down")}
            disabled={isPlayingSequence}
            className={`flex-1 py-4 rounded-2xl font-bold text-lg shadow-md flex items-center justify-center gap-2 transition-all ${
              isPlayingSequence 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-orange-400 to-red-500 text-white btn-bouncy hover:shadow-lg'
            }`}
          >
            <ArrowDownRight className="w-6 h-6" /> 
            下行旋律 (越来越低)
          </button>
        </div>

        {/* Emotion Hint */}
        <div className="bg-green-50 p-4 rounded-2xl border-2 border-green-100 flex items-center gap-4 max-w-2xl mx-auto w-full z-10">
          <span className="text-3xl">💡</span>
          <p className="text-gray-600 font-bold text-sm md:text-base">
            仔细听！<strong className="text-blue-500">越来越高的声音</strong>是不是让人感觉很激动、想要向上飞？
            <strong className="text-red-500">越来越低的声音</strong>是不是让人感觉慢慢平静下来了呢？
          </p>
        </div>
      </div>
    </div>
  );
}
