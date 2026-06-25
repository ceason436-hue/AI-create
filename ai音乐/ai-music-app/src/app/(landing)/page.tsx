import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <>
      {/* TopNavBar (Shared Component) */}
      <nav className="bg-primary-container/40 dark:bg-primary-container/40 backdrop-blur-xl fixed top-0 w-full z-50 shadow-none border-none">
        <div className="flex justify-between items-center px-4 md:px-gutter py-base max-w-full mx-auto">
          <div className="flex items-center gap-4 md:gap-8">
            <Link className="flex items-center gap-2 md:gap-3" href="#">
              <img
                alt="Create AI Logo"
                className="h-8 md:h-10 object-contain"
                src="/logo2.png"
              />
              <span className="font-display-xl text-2xl md:text-headline-md font-black tracking-tighter text-on-primary-container sr-only">
                Create AI (科瑞特)
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-6" id="nav-menu">
              <Link className="text-secondary-fixed font-bold border-b-stroke-thick border-secondary-fixed pb-1 hover:scale-105 transition-transform duration-200" href="#">课程培训</Link>
              <Link className="text-on-primary-container/80 font-medium pb-1 hover:scale-105 transition-transform duration-200" href="#">科创活动</Link>
              <Link className="text-on-primary-container/80 font-medium pb-1 hover:scale-105 transition-transform duration-200" href="#">成功案例</Link>
              <Link className="text-on-primary-container/80 font-medium pb-1 hover:scale-105 transition-transform duration-200" href="#">关于我们</Link>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <button className="hidden sm:block px-4 py-2 md:px-6 md:py-3 font-label-bold text-sm md:text-label-bold text-on-primary-container brutalist-border-white rounded-full hover:bg-white/10 transition-colors">
              登录
            </button>
            <button className="px-4 py-2 md:px-6 md:py-3 font-label-bold text-sm md:text-label-bold bg-secondary-fixed text-black brutalist-border rounded-full brutalist-shadow-blue hover:-translate-y-1 hover:translate-x-1 transition-all">
              注册
            </button>
            <button className="md:hidden p-2 text-on-primary-container focus:outline-none">
              <span className="material-symbols-outlined text-3xl">menu</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="flex flex-col">
        {/* Section 1: Hero */}
        <section className="relative w-full min-h-screen bg-primary-container overflow-hidden flex items-center pt-32 pb-20 md:py-24 snap-start">
          <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[50%] bg-secondary-fixed blur-[8px] fluid-shape-1 opacity-80 z-0"></div>
          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-container-padding flex flex-col lg:flex-row items-center gap-12">
            <div className="w-full lg:w-[60%] flex flex-col gap-6 md:gap-8 mt-10 md:mt-0">
              <div className="flex flex-col gap-4">
                <h1 className="font-display-xl text-5xl md:text-display-xl text-on-primary-container relative inline-block max-w-full leading-tight">
                  科瑞特AI科创
                  <div className="absolute -bottom-1 md:-bottom-2 left-0 w-full h-[10px] md:h-[20px] bg-secondary-fixed z-[-1]"></div>
                </h1>
                <p className="font-body-lg text-xl md:text-headline-md text-on-primary-container/90 max-w-2xl mt-2 md:mt-4">
                  激发未来创造力，融合AI机器人与青少年科技教育的前沿阵地。打破常规，探索未知的智能世界。
                </p>
              </div>
              <div className="flex flex-wrap gap-3 md:gap-4">
                <span className="px-4 py-2 md:px-6 md:py-2 bg-black text-secondary-fixed font-label-bold text-sm md:text-label-bold rounded-full brutalist-border">AI机器人编程</span>
                <span className="px-4 py-2 md:px-6 md:py-2 bg-black text-secondary-fixed font-label-bold text-sm md:text-label-bold rounded-full brutalist-border">科创赛事孵化</span>
              </div>
              <div className="flex flex-wrap gap-4 md:gap-6 mt-6 md:mt-8">
                <button className="px-6 py-3 md:px-8 md:py-4 bg-secondary-fixed text-black font-label-bold text-lg md:text-headline-md rounded-full brutalist-border brutalist-shadow-blue hover:-translate-y-1 hover:translate-x-1 transition-all">
                  立即咨询
                </button>
                <button className="px-6 py-3 md:px-8 md:py-4 bg-transparent text-on-primary-container font-label-bold text-lg md:text-headline-md rounded-full brutalist-border-white hover:bg-white/10 transition-all">
                  课程体系
                </button>
              </div>
            </div>
            <div className="w-full lg:w-[40%] flex justify-center items-center relative mt-8 lg:mt-0">
              <div className="absolute inset-0 bg-secondary-fixed/20 blur-3xl rounded-full"></div>
              <img alt="AI Robot Hero Illustration" className="w-auto h-auto max-w-[90%] lg:max-w-[480px] max-h-[50vh] md:max-h-[75vh] object-cover rounded-[24px] md:rounded-[40px] brutalist-border z-10" src="/haibao1.png" />
            </div>
          </div>
          <div className="hidden md:block absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <span className="material-symbols-outlined text-on-primary-container text-[48px]">keyboard_arrow_down</span>
          </div>
        </section>

        {/* Section 2: AI Music */}
        <section className="relative w-full min-h-[90vh] bg-secondary-fixed overflow-hidden flex items-center py-16 md:py-20">
          <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[60%] bg-primary-container blur-[12px] fluid-shape-3 opacity-90 z-0"></div>
          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-container-padding flex flex-col gap-8 md:gap-10">
            <div className="text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-black rounded-full flex items-center justify-center brutalist-border">
                <span className="material-symbols-outlined text-secondary-fixed text-[32px] md:text-[40px]">music_note</span>
              </div>
              <h2 className="font-display-xl text-3xl md:text-headline-lg text-black bg-white px-6 md:px-8 py-2 brutalist-border rounded-xl -rotate-2">
                AI音乐创作营
              </h2>
            </div>
            <div className="flex flex-col lg:flex-row gap-6 items-stretch">
              {/* Left Card - Links to /ai-music */}
              <Link href="/ai-music" className="w-full lg:w-1/2 glass-panel-dark rounded-[24px] p-6 flex flex-col gap-4 relative overflow-hidden brutalist-shadow-blue cursor-pointer hover:scale-[1.02] transition-transform block">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container blur-2xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
                <div className="h-[160px] md:h-[200px] w-full rounded-2xl brutalist-border overflow-hidden relative">
                  <img alt="AI DJ Robot" className="w-full h-full object-cover" src="/tu1.jpg" />
                </div>
                <div className="flex flex-col gap-2 relative z-10">
                  <h3 className="font-headline-md text-2xl md:text-headline-md text-secondary-fixed">触手可及的音乐魔力</h3>
                  <p className="text-on-primary-container text-body-sm">通过AI算法辅助，让零基础的孩子也能编织动人旋律，体验前所未有的创作乐趣。</p>
                </div>
              </Link>
              {/* Right Grid */}
              <div className="w-full lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-primary-container/80 backdrop-blur-md rounded-[20px] p-4 brutalist-border flex flex-col justify-center items-center text-center hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-white text-[32px] md:text-[36px] mb-2">auto_awesome</span>
                  <h4 className="font-headline-md text-base md:text-body-lg font-bold text-white">AI旋律生成</h4>
                </div>
                <div className="bg-primary-container/80 backdrop-blur-md rounded-[20px] p-4 brutalist-border flex flex-col justify-center items-center text-center hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-white text-[32px] md:text-[36px] mb-2">code</span>
                  <h4 className="font-headline-md text-base md:text-body-lg font-bold text-white">音乐编程入门</h4>
                </div>
                <div className="bg-primary-container/80 backdrop-blur-md rounded-[20px] p-4 brutalist-border flex flex-col justify-center items-center text-center hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-white text-[32px] md:text-[36px] mb-2">album</span>
                  <h4 className="font-headline-md text-base md:text-body-lg font-bold text-white">原创作品孵化</h4>
                </div>
                <div className="bg-primary-container/80 backdrop-blur-md rounded-[20px] p-4 brutalist-border flex flex-col justify-center items-center text-center hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-white text-[32px] md:text-[36px] mb-2">emoji_events</span>
                  <h4 className="font-headline-md text-base md:text-body-lg font-bold text-white">科创赛事适配</h4>
                </div>
              </div>
            </div>
            <div className="flex justify-center mt-6">
              <Link href="/ai-music" className="px-6 py-3 md:px-8 md:py-3 bg-primary-container text-white font-label-bold text-base md:text-body-lg rounded-full brutalist-border brutalist-shadow-green hover:-translate-y-1 hover:translate-x-1 transition-all inline-block">
                查看课程详情
              </Link>
            </div>
          </div>
        </section>

        {/* Section 3: AI Art */}
        <section className="relative w-full min-h-screen bg-primary-container overflow-hidden flex items-center py-16 md:py-20 snap-start">
          <div className="absolute top-[10%] left-[5%] w-[20%] h-[20%] bg-secondary-fixed blur-[8px] rounded-full opacity-60"></div>
          <div className="absolute bottom-[20%] right-[15%] w-[30%] h-[25%] bg-secondary-fixed blur-[12px] fluid-shape-1 opacity-70"></div>
          <div className="absolute top-[40%] right-[50%] w-[15%] h-[15%] bg-secondary-fixed blur-[5px] fluid-shape-2 opacity-50"></div>
          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-container-padding flex flex-col gap-8 md:gap-16">
            <div className="flex items-center gap-4 md:gap-6 justify-start">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-secondary-fixed rounded-full flex items-center justify-center brutalist-border rotate-12 shrink-0">
                <span className="material-symbols-outlined text-black text-[48px] md:text-[64px]">brush</span>
              </div>
              <h2 className="font-display-xl text-4xl md:text-display-xl text-white tracking-tighter drop-shadow-[2px_2px_0_rgba(0,0,0,1)] md:drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">
                AI绘画
              </h2>
            </div>
            <div className="flex flex-col lg:flex-row gap-8 md:gap-12 items-start mt-4 md:mt-8">
              <div className="w-full lg:w-[35%] bg-black rounded-[24px] md:rounded-[32px] p-6 md:p-8 brutalist-border shadow-[4px_4px_0_0_#caf204] md:shadow-[8px_8px_0_0_#caf204] flex flex-col gap-6 md:gap-8">
                <h3 className="font-headline-lg text-2xl md:text-headline-md text-white border-b-stroke-thick border-secondary-fixed pb-4">课程核心收获</h3>
                <ul className="flex flex-col gap-4 md:gap-6">
                  <li className="flex items-start gap-3 md:gap-4">
                    <div className="mt-1 bg-secondary-fixed rounded-full p-1 border-2 border-black">
                      <span className="material-symbols-outlined text-black text-[16px] md:text-[20px]">check</span>
                    </div>
                    <span className="text-white text-base md:text-body-lg font-medium">掌握主流AI绘画工具指令构架</span>
                  </li>
                  <li className="flex items-start gap-3 md:gap-4">
                    <div className="mt-1 bg-secondary-fixed rounded-full p-1 border-2 border-black">
                      <span className="material-symbols-outlined text-black text-[16px] md:text-[20px]">check</span>
                    </div>
                    <span className="text-white text-base md:text-body-lg font-medium">突破传统美术技法瓶颈限制</span>
                  </li>
                  <li className="flex items-start gap-3 md:gap-4">
                    <div className="mt-1 bg-secondary-fixed rounded-full p-1 border-2 border-black">
                      <span className="material-symbols-outlined text-black text-[16px] md:text-[20px]">check</span>
                    </div>
                    <span className="text-white text-base md:text-body-lg font-medium">构建跨学科的视觉叙事能力</span>
                  </li>
                  <li className="flex items-start gap-3 md:gap-4">
                    <div className="mt-1 bg-secondary-fixed rounded-full p-1 border-2 border-black">
                      <span className="material-symbols-outlined text-black text-[16px] md:text-[20px]">check</span>
                    </div>
                    <span className="text-white text-base md:text-body-lg font-medium">产出具有商业潜力的IP视觉方案</span>
                  </li>
                </ul>
                <Link href="/ai-art" className="mt-4 md:mt-8 px-6 py-3 md:px-8 md:py-4 bg-secondary-fixed text-black font-label-bold text-lg md:text-headline-md rounded-full border-2 border-transparent hover:bg-white hover:border-black transition-colors inline-block text-center cursor-pointer">
                  解锁创意课程
                </Link>
              </div>
              <div className="w-full lg:w-[65%] flex items-stretch relative mt-8 lg:mt-0">
                <div className="absolute inset-0 bg-primary-container blur-[40px] z-[-1] opacity-50"></div>
                <Link href="/ai-art" className="w-full min-h-[300px] md:min-h-[400px] lg:h-auto bg-black rounded-[24px] md:rounded-[32px] border-[4px] md:border-[6px] border-secondary-fixed overflow-hidden group shadow-[4px_4px_0_0_#caf204] md:shadow-[8px_8px_0_0_#caf204] cursor-pointer block">
                  <img alt="AI Art Frame" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="/tu2.png" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3.5: AI Programming */}
        <section className="relative w-full min-h-screen bg-black overflow-hidden flex items-center py-16 md:py-20 snap-start">
          <div className="absolute top-[20%] left-[-10%] w-[40%] h-[50%] bg-primary-container blur-[40px] opacity-30 z-0"></div>
          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-container-padding flex flex-col gap-8 md:gap-16">
            <div className="flex items-center gap-4 md:gap-6 justify-center">
              <h2 className="font-display-xl text-4xl md:text-display-xl text-white tracking-tighter drop-shadow-[2px_2px_0_rgba(202,242,4,1)]">
                AI编程
              </h2>
              <div className="w-16 h-16 md:w-24 md:h-24 bg-primary-container rounded-full flex items-center justify-center brutalist-border rotate-12 shrink-0">
                <span className="material-symbols-outlined text-white text-[48px] md:text-[64px]">code_blocks</span>
              </div>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-8 md:gap-12 items-stretch mt-4 md:mt-8">
              {/* Image / Visual Area */}
              <div className="w-full lg:w-[60%] flex items-stretch relative">
                <Link href="/ai-programming" className="w-full min-h-[300px] md:min-h-[400px] lg:h-auto bg-white rounded-[24px] md:rounded-[32px] border-[4px] md:border-[6px] border-secondary-fixed overflow-hidden group shadow-[4px_4px_0_0_#caf204] md:shadow-[8px_8px_0_0_#caf204] cursor-pointer block relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent z-10 pointer-events-none"></div>
                  {/* Using an Unsplash placeholder for coding context */}
                  <img alt="AI Programming Frame" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200&auto=format&fit=crop" />
                  <div className="absolute bottom-6 left-6 right-6 z-20 flex justify-between items-end">
                     <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl border border-secondary-fixed inline-block">
                        <span className="text-secondary-fixed font-bold text-lg md:text-xl">对话即开发，创意秒变现实</span>
                     </div>
                  </div>
                </Link>
              </div>
              
              {/* Content Area */}
              <div className="w-full lg:w-[40%] bg-secondary-fixed rounded-[24px] md:rounded-[32px] p-6 md:p-8 brutalist-border shadow-[4px_4px_0_0_#ffffff] md:shadow-[8px_8px_0_0_#ffffff] flex flex-col gap-6 md:gap-8 justify-center">
                <h3 className="font-headline-lg text-2xl md:text-headline-md text-black border-b-stroke-thick border-black pb-4">课程核心收获</h3>
                <ul className="flex flex-col gap-4 md:gap-6">
                  <li className="flex items-start gap-3 md:gap-4">
                    <div className="mt-1 bg-primary-container rounded-full p-1 border-2 border-black">
                      <span className="material-symbols-outlined text-white text-[16px] md:text-[20px]">check</span>
                    </div>
                    <span className="text-black text-base md:text-body-lg font-bold">零基础自然语言编程体验</span>
                  </li>
                  <li className="flex items-start gap-3 md:gap-4">
                    <div className="mt-1 bg-primary-container rounded-full p-1 border-2 border-black">
                      <span className="material-symbols-outlined text-white text-[16px] md:text-[20px]">check</span>
                    </div>
                    <span className="text-black text-base md:text-body-lg font-bold">实时预览与源码双视图切换</span>
                  </li>
                  <li className="flex items-start gap-3 md:gap-4">
                    <div className="mt-1 bg-primary-container rounded-full p-1 border-2 border-black">
                      <span className="material-symbols-outlined text-white text-[16px] md:text-[20px]">check</span>
                    </div>
                    <span className="text-black text-base md:text-body-lg font-bold">培养计算思维与工程化逻辑</span>
                  </li>
                  <li className="flex items-start gap-3 md:gap-4">
                    <div className="mt-1 bg-primary-container rounded-full p-1 border-2 border-black">
                      <span className="material-symbols-outlined text-white text-[16px] md:text-[20px]">check</span>
                    </div>
                    <span className="text-black text-base md:text-body-lg font-bold">一键导出作品，成就感拉满</span>
                  </li>
                </ul>
                <Link href="/ai-programming" className="mt-4 md:mt-8 px-6 py-3 md:px-8 md:py-4 bg-black text-secondary-fixed font-label-bold text-lg md:text-headline-md rounded-full border-2 border-transparent hover:bg-white hover:text-black hover:border-black transition-colors inline-block text-center cursor-pointer">
                  进入编程空间
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: AI Reading */}
        <section className="relative w-full min-h-screen bg-secondary-fixed overflow-hidden flex items-center py-16 md:py-20 snap-start">
          <div className="absolute top-[20%] left-[-10%] w-[40%] h-[50%] bg-primary-container blur-[12px] fluid-shape-3 opacity-90 z-0"></div>
          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-container-padding flex flex-col gap-8 md:gap-16">
            <div className="flex items-center gap-4 md:gap-6 justify-end">
              <h2 className="font-display-xl text-4xl md:text-display-xl text-black tracking-tighter">
                AI阅读
              </h2>
              <div className="w-16 h-16 md:w-24 md:h-24 bg-primary-container rounded-full flex items-center justify-center brutalist-border -rotate-12 shrink-0">
                <span className="material-symbols-outlined text-white text-[48px] md:text-[64px]">book_4</span>
              </div>
            </div>
            <div className="flex flex-col-reverse lg:flex-row gap-8 md:gap-12 items-start mt-4 md:mt-8">
              <div className="w-full lg:w-[65%] flex items-stretch relative mt-8 lg:mt-0">
                <Link href="/ai-reading" className="w-full min-h-[300px] md:min-h-[400px] lg:h-auto bg-black rounded-[24px] md:rounded-[32px] border-[4px] md:border-[6px] border-primary-container overflow-hidden group shadow-[4px_4px_0_0_#0073e0] md:shadow-[8px_8px_0_0_#0073e0] cursor-pointer block relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-transparent z-10 pointer-events-none"></div>
                  {/* Using a placeholder unsplash image for reading context since no specific local image is available */}
                  <img alt="AI Reading Frame" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90" src="https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=1200&auto=format&fit=crop" />
                  <div className="absolute bottom-6 left-6 right-6 z-20 flex justify-between items-end">
                     <div className="glass-panel-dark px-4 py-2 rounded-xl inline-block">
                        <span className="text-secondary-fixed font-bold text-lg md:text-xl">边读边画，创作专属绘本</span>
                     </div>
                  </div>
                </Link>
              </div>
              <div className="w-full lg:w-[35%] bg-primary-container rounded-[24px] md:rounded-[32px] p-6 md:p-8 brutalist-border shadow-[4px_4px_0_0_#000000] md:shadow-[8px_8px_0_0_#000000] flex flex-col gap-6 md:gap-8">
                <h3 className="font-headline-lg text-2xl md:text-headline-md text-white border-b-stroke-thick border-secondary-fixed pb-4">课程核心收获</h3>
                <ul className="flex flex-col gap-4 md:gap-6">
                  <li className="flex items-start gap-3 md:gap-4">
                    <div className="mt-1 bg-secondary-fixed rounded-full p-1 border-2 border-black">
                      <span className="material-symbols-outlined text-black text-[16px] md:text-[20px]">check</span>
                    </div>
                    <span className="text-white text-base md:text-body-lg font-medium">沉浸式的逐段阅读体验</span>
                  </li>
                  <li className="flex items-start gap-3 md:gap-4">
                    <div className="mt-1 bg-secondary-fixed rounded-full p-1 border-2 border-black">
                      <span className="material-symbols-outlined text-black text-[16px] md:text-[20px]">check</span>
                    </div>
                    <span className="text-white text-base md:text-body-lg font-medium">培养抓取文章关键词与结构化思维</span>
                  </li>
                  <li className="flex items-start gap-3 md:gap-4">
                    <div className="mt-1 bg-secondary-fixed rounded-full p-1 border-2 border-black">
                      <span className="material-symbols-outlined text-black text-[16px] md:text-[20px]">check</span>
                    </div>
                    <span className="text-white text-base md:text-body-lg font-medium">AI 问答互动提升阅读理解力</span>
                  </li>
                  <li className="flex items-start gap-3 md:gap-4">
                    <div className="mt-1 bg-secondary-fixed rounded-full p-1 border-2 border-black">
                      <span className="material-symbols-outlined text-black text-[16px] md:text-[20px]">check</span>
                    </div>
                    <span className="text-white text-base md:text-body-lg font-medium">结合文生图，打造属于自己的故事绘本</span>
                  </li>
                </ul>
                <Link href="/ai-reading" className="mt-4 md:mt-8 px-6 py-3 md:px-8 md:py-4 bg-white text-black font-label-bold text-lg md:text-headline-md rounded-full border-2 border-transparent hover:bg-secondary-fixed hover:border-black transition-colors inline-block text-center cursor-pointer">
                  开启阅读之旅
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer (Shared Component) */}
      <footer className="bg-inverse-surface dark:bg-surface-container-lowest w-full border-t-stroke-thick border-on-surface snap-start">
        <div className="flex flex-col md:flex-row justify-between items-center px-6 md:px-container-padding py-12 md:py-section-gap w-full max-w-7xl mx-auto gap-8">
          <div className="flex flex-col gap-4 items-center md:items-start text-center md:text-left">
            <img alt="Create AI Logo" className="h-10 md:h-12 object-contain bg-white px-3 py-1 rounded-lg" src="/logo2.png" />
            <p className="font-body-sm text-body-sm text-white">
              © 2024 科瑞特AI科创. 保留所有权利。
            </p>
          </div>
          <div className="flex flex-wrap gap-4 md:gap-6 justify-center">
            <Link className="font-body-sm text-body-sm text-white hover:text-primary-fixed-dim hover:underline decoration-stroke-thin transition-colors" href="#">隐私政策</Link>
            <Link className="font-body-sm text-body-sm text-white hover:text-primary-fixed-dim hover:underline decoration-stroke-thin transition-colors" href="#">服务条款</Link>
            <Link className="font-body-sm text-body-sm text-white hover:text-primary-fixed-dim hover:underline decoration-stroke-thin transition-colors" href="#">AI伦理</Link>
            <Link className="font-body-sm text-body-sm text-white hover:text-primary-fixed-dim hover:underline decoration-stroke-thin transition-colors" href="#">联系我们</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
