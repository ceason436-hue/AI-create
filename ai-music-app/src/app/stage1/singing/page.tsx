"use client";
import { useState, useEffect } from "react";
import { Mic, Play, RotateCcw, Save, StopCircle, Sparkles, CheckCircle2 } from "lucide-react";

export default function SingingWand() {
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "recorded" | "generating" | "done">("idle");
  const [progress, setProgress] = useState(0);

  // Simulate recording progress
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (recordingState === "recording") {
      timer = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            setRecordingState("recorded");
            return 100;
          }
          return p + 2; // 50 * 2 = 100 -> roughly 5 seconds
        });
      }, 100);
    } else if (recordingState === "idle") {
      setProgress(0);
    }
    return () => clearInterval(timer);
  }, [recordingState]);

  const handleRecordClick = () => {
    if (recordingState === "idle") {
      setRecordingState("recording");
    } else if (recordingState === "recording") {
      setRecordingState("recorded");
    }
  };

  const handleGenerate = () => {
    setRecordingState("generating");
    setTimeout(() => {
      setRecordingState("done");
    }, 2500);
  };

  return (
    <div className="flex flex-col gap-6 items-center justify-center min-h-[70vh]">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border-4 border-macaron-pink flex items-center justify-between w-full max-w-4xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-macaron-pink rounded-full flex items-center justify-center text-3xl">
            🎤
          </div>
          <div>
            <h1 className="text-3xl font-bold text-pink-600">AI接唱魔法棒</h1>
            <p className="text-gray-500 font-bold mt-1">对着魔法棒哼一句，小精灵帮你变出一首完整的歌！</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-12 shadow-md border-2 border-pink-100 flex flex-col items-center gap-8 w-full max-w-4xl min-h-[500px] justify-center relative overflow-hidden">
        
        {/* Background decorations */}
        <div className="absolute top-10 left-10 text-4xl opacity-20 rotate-12">🎵</div>
        <div className="absolute bottom-20 right-12 text-5xl opacity-20 -rotate-12">✨</div>
        <div className="absolute top-32 right-20 text-3xl opacity-20 rotate-45">🎶</div>

        {recordingState === "idle" && (
          <div className="text-center flex flex-col items-center gap-8 z-10">
            <h2 className="text-2xl font-bold text-gray-700">第一步：拿起你的魔法话筒</h2>
            <button 
              onClick={handleRecordClick}
              className="btn-bouncy w-48 h-48 bg-gradient-to-b from-pink-300 to-pink-500 rounded-full shadow-[0_10px_30px_rgba(236,72,153,0.4)] border-8 border-white flex items-center justify-center group"
            >
              <Mic className="w-20 h-20 text-white group-hover:scale-110 transition-transform" />
            </button>
            <p className="text-xl font-bold text-pink-500 bg-pink-50 px-6 py-3 rounded-full border-2 border-pink-200">
              点击开始，唱1-2个你喜欢的音（比如do-re-mi）
            </p>
          </div>
        )}

        {recordingState === "recording" && (
          <div className="text-center flex flex-col items-center gap-8 z-10">
            <h2 className="text-2xl font-bold text-pink-600 animate-pulse">正在聆听你的声音...</h2>
            <button 
              onClick={handleRecordClick}
              className="btn-bouncy w-48 h-48 bg-gradient-to-b from-red-400 to-red-600 rounded-full shadow-[0_10px_30px_rgba(239,68,68,0.4)] border-8 border-white flex items-center justify-center animate-[pulse_1s_infinite]"
            >
              <StopCircle className="w-20 h-20 text-white" />
            </button>
            <div className="w-64 h-6 bg-gray-200 rounded-full overflow-hidden border-2 border-white shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-pink-400 to-purple-500 transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-gray-500 font-bold">最多录制5秒钟哦~</p>
          </div>
        )}

        {recordingState === "recorded" && (
          <div className="text-center flex flex-col items-center gap-8 z-10 w-full max-w-md">
            <h2 className="text-2xl font-bold text-green-600 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-8 h-8" /> 录音成功啦！
            </h2>
            
            <div className="w-full bg-gray-50 p-6 rounded-3xl border-2 border-gray-200 flex items-center justify-between">
              <span className="font-bold text-gray-700">你的声音：</span>
              <button className="p-3 bg-white text-pink-500 rounded-full shadow-sm border border-gray-200 hover:bg-pink-50">
                <Play className="w-6 h-6" fill="currentColor" />
              </button>
            </div>

            <div className="flex gap-4 w-full">
              <button 
                onClick={() => setRecordingState("idle")}
                className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold border-2 border-gray-200 hover:bg-gray-200 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" /> 重录一遍
              </button>
              <button 
                onClick={handleGenerate}
                className="btn-bouncy flex-[2] py-4 bg-gradient-to-r from-purple-400 to-pink-500 text-white rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-2"
              >
                <Sparkles className="w-6 h-6" /> 让小精灵帮你接唱
              </button>
            </div>
          </div>
        )}

        {recordingState === "generating" && (
          <div className="text-center flex flex-col items-center gap-8 z-10">
            <div className="w-32 h-32 bg-purple-100 rounded-full flex items-center justify-center animate-bounce shadow-inner">
              <span className="text-6xl">🧚‍♂️</span>
            </div>
            <h2 className="text-2xl font-bold text-purple-600 animate-pulse">
              小精灵正在挥舞魔法棒，为你写歌...
            </h2>
          </div>
        )}

        {recordingState === "done" && (
          <div className="flex flex-col items-center gap-8 w-full z-10">
            <h2 className="text-2xl font-bold text-purple-600 flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-yellow-400" /> 哇！一首完整的歌变出来啦！
            </h2>
            
            {/* Visualizer Track */}
            <div className="w-full max-w-2xl bg-gray-50 p-6 rounded-3xl border-2 border-purple-100 flex flex-col gap-4">
              <div className="flex justify-between text-sm font-bold text-gray-400 px-2">
                <span>你的声音</span>
                <span>小精灵的魔法接唱</span>
              </div>
              <div className="flex h-16 rounded-full overflow-hidden shadow-inner border-2 border-white">
                <div className="w-1/4 bg-pink-400 flex items-center justify-center text-white font-bold">
                  哼唱段
                </div>
                <div className="w-3/4 bg-gradient-to-r from-purple-400 to-blue-400 flex items-center justify-center text-white font-bold relative overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-[slide_1s_linear_infinite]"></div>
                  AI 完整旋律
                </div>
              </div>
              
              <button className="btn-bouncy w-full py-4 mt-4 bg-macaron-purple text-purple-800 border-2 border-purple-300 rounded-2xl font-bold text-xl shadow-md flex items-center justify-center gap-3">
                <Play className="w-6 h-6" fill="currentColor" /> 播放完整歌曲
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-4 w-full max-w-2xl">
              <button 
                onClick={() => setRecordingState("generating")}
                className="flex-1 py-4 bg-white text-purple-600 rounded-2xl font-bold border-2 border-purple-200 hover:bg-purple-50 flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw className="w-5 h-5" /> 不满意，重新接唱
              </button>
              <button className="btn-bouncy flex-1 py-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-2">
                <Save className="w-6 h-6" /> 保存到我的作品
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}