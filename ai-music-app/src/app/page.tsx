import Link from "next/link";
import { Play, Sparkles, Mic, Music } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 md:gap-10">
      <div className="text-center space-y-4 px-4">
        <h1 className="text-3xl md:text-5xl font-extrabold text-pink-500 tracking-wider drop-shadow-md leading-tight">
          欢迎来到AI音乐魔法学院！🎉
        </h1>
        <p className="text-base md:text-xl text-gray-600 font-bold max-w-2xl mx-auto">
          在这里，你可以用魔法变成小小音乐家！不需要懂乐理，跟着小精灵一起玩，就能写出属于自己的歌哦！
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mt-4 md:mt-8 w-full max-w-5xl px-4 md:px-0">
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

        {/* Module 3: Three Keys */}
        <Link href="/stage1/three-keys" className="btn-bouncy group bg-white rounded-3xl p-8 border-4 border-macaron-purple shadow-lg flex flex-col items-center text-center gap-4 hover:bg-purple-50">
          <div className="w-24 h-24 bg-macaron-purple rounded-full flex items-center justify-center shadow-inner">
            <span className="text-5xl">🎹</span>
          </div>
          <h2 className="text-2xl font-bold text-purple-600">三键成曲</h2>
          <p className="text-gray-500 font-bold">选择3个不同的音，小精灵为你变出一首完整的伴奏！</p>
          <div className="mt-auto pt-4 flex items-center text-purple-500 font-bold group-hover:scale-110 transition-transform">
            <Music className="w-6 h-6 mr-2" /> 开始编曲
          </div>
        </Link>
      </div>
      
      <div className="mt-8 md:mt-12 bg-white/60 p-4 md:p-6 rounded-3xl border-2 border-dashed border-gray-300 flex items-center gap-4 mx-4 md:mx-0">
        <span className="text-3xl md:text-4xl">🏆</span>
        <div>
          <h3 className="text-base md:text-lg font-bold text-gray-700">小提示：</h3>
          <p className="text-sm md:text-base text-gray-600">完成这三个关卡，你就能获得“启蒙小达人”徽章啦！</p>
        </div>
      </div>
    </div>
  );
}