import Link from "next/link";
import { Play, Sparkles, Music, ArrowUpRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-start min-h-[80vh] gap-12 py-12 px-6">
      <div className="text-center flex flex-col items-center gap-6 mb-4">
        <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center brutalist-border shadow-[4px_4px_0_0_#caf204]">
          <Music className="w-10 h-10 text-secondary-fixed" />
        </div>
        <h1 className="font-display-xl text-4xl md:text-headline-lg text-black bg-white px-8 py-3 brutalist-border rounded-2xl -rotate-1 shadow-[4px_4px_0_0_#0073e0]">
          AI 音乐实验室
        </h1>
        <p className="font-body-lg text-on-surface/80 max-w-2xl text-lg">
          开启你的 AI 音乐创作之旅，用科技点燃艺术灵感。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-7xl">
        {/* Module 1: Rhythm */}
        <Link href="/stage1/rhythm" className="group bg-white rounded-[32px] p-8 brutalist-border shadow-[8px_8px_0_0_#caf204] flex flex-col items-center text-center gap-6 hover:-translate-y-2 hover:translate-x-2 transition-all duration-300">
          <div className="w-24 h-24 bg-primary-container/10 rounded-2xl brutalist-border flex items-center justify-center group-hover:bg-secondary-fixed transition-colors">
            <span className="text-5xl">🥁</span>
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="font-headline-md text-2xl text-black">节奏练习室</h2>
            <p className="font-body-sm text-on-surface-variant font-medium leading-relaxed">
              跟着魔法音符拍拍手，创造你的第一个鼓点！
            </p>
          </div>
          <div className="mt-auto pt-4 flex items-center justify-center w-full">
            <div className="flex items-center px-6 py-3 bg-primary-container text-white rounded-full font-label-bold brutalist-border brutalist-shadow-green group-hover:bg-black transition-colors">
              <Play className="w-5 h-5 mr-2" /> 开始闯关
            </div>
          </div>
        </Link>

        {/* Module 1.5: Pitch Explorer */}
        <Link href="/stage1/pitch-explorer" className="group bg-white rounded-[32px] p-8 brutalist-border shadow-[8px_8px_0_0_#0073e0] flex flex-col items-center text-center gap-6 hover:-translate-y-2 hover:translate-x-2 transition-all duration-300">
          <div className="w-24 h-24 bg-secondary-fixed/10 rounded-2xl brutalist-border flex items-center justify-center group-hover:bg-primary-container transition-colors">
            <span className="text-5xl">🪜</span>
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="font-headline-md text-2xl text-black">音高体验器</h2>
            <p className="font-body-sm text-on-surface-variant font-medium leading-relaxed">
              爬上魔法楼梯，听听声音变高变低的奇妙感觉！
            </p>
          </div>
          <div className="mt-auto pt-4 flex items-center justify-center w-full">
            <div className="flex items-center px-6 py-3 bg-secondary-fixed text-black rounded-full font-label-bold brutalist-border brutalist-shadow-blue group-hover:bg-black group-hover:text-white transition-colors">
              <ArrowUpRight className="w-5 h-5 mr-2" /> 去爬楼梯
            </div>
          </div>
        </Link>

        {/* Module 2: Melody */}
        <Link href="/stage1/melody" className="group bg-white rounded-[32px] p-8 brutalist-border shadow-[8px_8px_0_0_#caf204] flex flex-col items-center text-center gap-6 hover:-translate-y-2 hover:translate-x-2 transition-all duration-300">
          <div className="w-24 h-24 bg-primary-container/10 rounded-2xl brutalist-border flex items-center justify-center group-hover:bg-secondary-fixed transition-colors">
            <span className="text-5xl">🎹</span>
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="font-headline-md text-2xl text-black">AI 旋律生成器</h2>
            <p className="font-body-sm text-on-surface-variant font-medium leading-relaxed">
              选一个心情，召唤小精灵为你写一句好听的旋律！
            </p>
          </div>
          <div className="mt-auto pt-4 flex items-center justify-center w-full">
            <div className="flex items-center px-6 py-3 bg-primary-container text-white rounded-full font-label-bold brutalist-border brutalist-shadow-green group-hover:bg-black transition-colors">
              <Sparkles className="w-5 h-5 mr-2" /> 召唤魔法
            </div>
          </div>
        </Link>

        {/* Module 3: Three Keys */}
        <Link href="/stage1/three-keys" className="group bg-white rounded-[32px] p-8 brutalist-border shadow-[8px_8px_0_0_#0073e0] flex flex-col items-center text-center gap-6 hover:-translate-y-2 hover:translate-x-2 transition-all duration-300">
          <div className="w-24 h-24 bg-secondary-fixed/10 rounded-2xl brutalist-border flex items-center justify-center group-hover:bg-primary-container transition-colors">
            <span className="text-5xl">✨</span>
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="font-headline-md text-2xl text-black">三键成曲</h2>
            <p className="font-body-sm text-on-surface-variant font-medium leading-relaxed">
              选择3个不同的音，小精灵为你变出一首完整的伴奏！
            </p>
          </div>
          <div className="mt-auto pt-4 flex items-center justify-center w-full">
            <div className="flex items-center px-6 py-3 bg-secondary-fixed text-black rounded-full font-label-bold brutalist-border brutalist-shadow-blue group-hover:bg-black group-hover:text-white transition-colors">
              <Music className="w-5 h-5 mr-2" /> 开始编曲
            </div>
          </div>
        </Link>

        {/* Module 4: Music Creation */}
        <Link href="/ai-music/creation" className="group bg-white rounded-[32px] p-8 brutalist-border shadow-[8px_8px_0_0_#caf204] flex flex-col items-center text-center gap-6 hover:-translate-y-2 hover:translate-x-2 transition-all duration-300 lg:col-span-2">
          <div className="w-24 h-24 bg-primary-container/10 rounded-2xl brutalist-border flex items-center justify-center group-hover:bg-secondary-fixed transition-colors">
            <span className="text-5xl">🎧</span>
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="font-headline-md text-2xl text-black">音乐创作</h2>
            <p className="font-body-sm text-on-surface-variant font-medium leading-relaxed">
              输入歌词和风格，让 AI 为你定制一首完整的原创音乐作品！
            </p>
          </div>
          <div className="mt-auto pt-4 flex items-center justify-center w-full">
            <div className="flex items-center px-6 py-3 bg-primary-container text-white rounded-full font-label-bold brutalist-border brutalist-shadow-green group-hover:bg-black transition-colors">
              <Sparkles className="w-5 h-5 mr-2" /> 开始创作
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
