import Link from "next/link";
import { Play, Sparkles, Mic, Music } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-10">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-extrabold text-pink-500 tracking-wider drop-shadow-md">
          欢迎来到AI音乐魔法学院！🎉
        </h1>
        <p className="text-xl text-gray-600 font-bold max-w-2xl mx-auto">
          在这里，你可以用魔法变成小小音乐家！不需要懂乐理，跟着小精灵一起玩，就能写出属于自己的歌哦！
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 w-full max-w-5xl">
        {/* Module 1: Rhythm */}
        <Link href="/stage1/rhythm" className="btn-bouncy group bg-white rounded-3xl p-8 border-4 border-macaron-yellow shadow-lg flex flex-col items-center text-center gap-4 hover:bg-yellow-50">
          <div className="w-24 h-24 bg-macaron-yellow rounded-full flex items-center justify-center shadow-inner">
            <span className="text-5xl">🥁</span>
          </div>
          <h2 className="text-2xl font-bold text-orange-600">节奏魔法练习室</h2>
          <p className="text-gray-500 font-bold">跟着魔法音符拍拍手，创造你的第一个鼓点！</p>
          <div className="mt-auto pt-4 flex items-center text-orange-500 font-bold group-hover:scale-110 transition-transform">
            <Play className="w-6 h-6 mr-2" /> 开始闯关
          </div>
        </Link>

        {/* Module 2: Melody */}
        <Link href="/stage1/melody" className="btn-bouncy group bg-white rounded-3xl p-8 border-4 border-macaron-blue shadow-lg flex flex-col items-center text-center gap-4 hover:bg-blue-50">
          <div className="w-24 h-24 bg-macaron-blue rounded-full flex items-center justify-center shadow-inner">
            <span className="text-5xl">🎹</span>
          </div>
          <h2 className="text-2xl font-bold text-teal-600">AI旋律生成器</h2>
          <p className="text-gray-500 font-bold">选一个心情，召唤小精灵为你写一句好听的旋律！</p>
          <div className="mt-auto pt-4 flex items-center text-teal-500 font-bold group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6 mr-2" /> 召唤魔法
          </div>
        </Link>

        {/* Module 3: Singing */}
        <Link href="/stage1/singing" className="btn-bouncy group bg-white rounded-3xl p-8 border-4 border-macaron-pink shadow-lg flex flex-col items-center text-center gap-4 hover:bg-pink-50">
          <div className="w-24 h-24 bg-macaron-pink rounded-full flex items-center justify-center shadow-inner">
            <span className="text-5xl">🎤</span>
          </div>
          <h2 className="text-2xl font-bold text-pink-600">AI接唱魔法棒</h2>
          <p className="text-gray-500 font-bold">对着魔法棒哼一句，AI帮你唱出完整的歌！</p>
          <div className="mt-auto pt-4 flex items-center text-pink-500 font-bold group-hover:scale-110 transition-transform">
            <Mic className="w-6 h-6 mr-2" /> 开始录音
          </div>
        </Link>
      </div>
      
      <div className="mt-12 bg-white/60 p-6 rounded-3xl border-2 border-dashed border-gray-300 flex items-center gap-4">
        <span className="text-4xl">🏆</span>
        <div>
          <h3 className="text-lg font-bold text-gray-700">小提示：</h3>
          <p className="text-gray-600">完成这三个关卡，你就能获得“启蒙小达人”徽章啦！</p>
        </div>
      </div>
    </div>
  );
}