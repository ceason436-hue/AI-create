import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Bot, BrainCircuit, Boxes, Code2, Cpu, GraduationCap, Lightbulb, Music2, Palette, Plane, Presentation, School, Sparkles, Sprout, Trophy, Wrench } from "lucide-react";
import { AnimatedContent } from "@/components/animated-content";
import styles from "./editorial-site.module.css";

type MediaItem = { src: string; alt: string; title: string; copy?: string; number?: string; href?: string };

function SectionHeading({ eyebrow, title, copy }: { eyebrow?: string; title: string; copy?: string }) {
  return <div className={styles.sectionHeading}>{eyebrow && <span>{eyebrow}</span>}<h2>{title}</h2>{copy && <p>{copy}</p>}</div>;
}

function Hero({ eyebrow, title, copy, image, alt, primary = { href: "/courses", label: "探索课程体系" }, secondary = { href: "/consult", label: "聊聊孩子的兴趣" }, note }: { eyebrow: string; title: string; copy: string; image: string; alt: string; primary?: { href: string; label: string }; secondary?: { href: string; label: string }; note?: string }) {
  return <section className={styles.hero}>
    <div className={styles.heroGrid}>
      <AnimatedContent className={styles.heroCopy} duration={680}>
        <span className={styles.eyebrow}>{eyebrow}</span><h1>{title}</h1><p>{copy}</p>
        <div className={styles.actions}><Link href={primary.href} className={styles.primary}>{primary.label}<ArrowRight size={17} /></Link><Link href={secondary.href} className={styles.secondary}>{secondary.label}</Link></div>
      </AnimatedContent>
      <AnimatedContent className={styles.heroMedia} direction="horizontal" duration={760} delay={80}>
        <Image src={image} alt={alt} width={1600} height={1000} priority />{note && <figcaption><i />{note}</figcaption>}
      </AnimatedContent>
    </div>
  </section>;
}

function PhotoSequence({ items }: { items: MediaItem[] }) {
  return <div className={styles.photoSequence}>{items.map((item, index) => <AnimatedContent className={styles.sequenceItem} delay={index * 70} key={item.src}>
    <figure><Image src={item.src} alt={item.alt} width={900} height={680} /></figure>
    <div><span>{item.number ?? String(index + 1).padStart(2, "0")}</span><h3>{item.title}</h3>{item.copy && <p>{item.copy}</p>}{item.href && <Link href={item.href}>查看课程 <ArrowRight size={15} /></Link>}</div>
  </AnimatedContent>)}</div>;
}

function MediaMosaic({ items }: { items: MediaItem[] }) {
  return <div className={styles.mosaic}>{items.map((item, index) => <AnimatedContent className={styles.mosaicItem} delay={index * 60} key={item.src}>
    <Image src={item.src} alt={item.alt} width={1000} height={760} /><div><span>{item.number ?? String(index + 1).padStart(2, "0")}</span><h3>{item.title}</h3>{item.copy && <p>{item.copy}</p>}</div>
  </AnimatedContent>)}</div>;
}

function Diagram({ src, alt }: { src: string; alt: string }) {
  return <figure className={styles.diagram}><Image src={src} alt={alt} width={1200} height={700} /></figure>;
}

function IndexRows({ items }: { items: { number: string; title: string; copy: string; href?: string }[] }) {
  return <div className={styles.indexRows}>{items.map((item) => {
    const body = <><span>{item.number}</span><div><h3>{item.title}</h3><p>{item.copy}</p></div>{item.href && <ArrowRight size={19} />}</>;
    return item.href ? <Link href={item.href} key={item.title}>{body}</Link> : <div key={item.title}>{body}</div>;
  })}</div>;
}

function Callout({ title, copy, href = "/consult", label = "开始课程咨询" }: { title: string; copy: string; href?: string; label?: string }) {
  return <section className={styles.callout}><div><span>下一步</span><h2>{title}</h2><p>{copy}</p></div><Link href={href} className={styles.primary}>{label}<ArrowRight size={17} /></Link></section>;
}

export function HomeEditorial() {
  const journey: MediaItem[] = [
    { src: "/media/site-v3/home/path-interest-v1.png", alt: "孩子从真实装置产生兴趣", title: "激发兴趣", copy: "从身边的问题和可见的装置开始好奇。" },
    { src: "/media/site-v3/home/path-learn-v1.png", alt: "孩子协作学习编程与结构", title: "学习探索", copy: "理解原理，拆解任务，形成自己的判断。" },
    { src: "/media/site-v3/home/path-build-v1.png", alt: "孩子动手搭建机器人", title: "动手实践", copy: "在搭建、编程、测试与修改中完成作品。" },
    { src: "/media/site-v3/home/path-present-v1.png", alt: "孩子公开展示项目成果", title: "展示成长", copy: "把选择和过程讲清楚，让成果成为证据。" },
  ];
  return <main className={styles.page}>
    <Hero eyebrow="科创五育，创智先行" title="让孩子在真实创造中理解科技。" copy="从一次好奇、一次搭建到一件可以讲清楚的作品，让编程、机器人与人工智能成为孩子理解世界的方法。" image="/media/site-v3/home/hero-maker-studio-v1.png" alt="孩子们在明亮的科创工作室搭建轮式机器人" note="真实问题，从动手开始" />
    <section className={styles.section}><SectionHeading eyebrow="学习旅程" title="从兴趣到作品，每一步都有真实发生。" copy="不是先记住答案，而是在观察、尝试和表达中，逐渐把想法变成可运行、可展示、可继续改进的作品。" /><PhotoSequence items={journey} /></section>
    <section className={styles.paperSection}><div className={styles.splitLead}><SectionHeading eyebrow="课程体系" title="六大方向，共用一条创造路径。" copy="课程覆盖编程、3D 建模、人工智能、无人机、机器人与综合科创，并以跨学科项目把知识连接起来。" /><IndexRows items={[
      { number: "01", title: "编程", copy: "用逻辑描述问题，让程序驱动真实任务。", href: "/courses" }, { number: "02", title: "3D 建模", copy: "从空间想象走向结构设计与数字制造。", href: "/courses" }, { number: "03", title: "人工智能", copy: "理解数据、识别与生成，用 AI 支持表达。", href: "/courses" }, { number: "04", title: "无人机", copy: "在安全规范中学习飞行控制与任务规划。", href: "/courses" }, { number: "05", title: "机器人", copy: "连接结构、传感器、控制与反馈。", href: "/courses" }, { number: "06", title: "综合科创", copy: "围绕真实主题完成跨学科作品。", href: "/courses" },
    ]} /></div><Diagram src="/media/site-v3/diagrams/course-six-directions.svg" alt="六大课程方向关系图" /></section>
    <section className={styles.section}><div className={styles.splitMedia}><div><SectionHeading eyebrow="工具与方法" title="把抽象概念放进看得见的创作过程。" copy="孩子在同一个项目中接触代码、三维结构、传感数据与智能判断，理解技术之间如何协同。" /><IndexRows items={[{ number: "A", title: "理解原理", copy: "先知道为什么，再决定如何做。" }, { number: "B", title: "真实动手", copy: "在试错中看到结构、程序和数据的反馈。" }, { number: "C", title: "表达成长", copy: "记录过程、比较方案、讲清自己的选择。" }]} /></div><div className={styles.interfaceStack}><Image src="/media/site-v3/home/coding-interface.svg" alt="积木编程学习界面" width={920} height={600} /><Image src="/media/site-v3/home/modeling-interface.svg" alt="三维建模学习界面" width={920} height={600} /><Image src="/media/site-v3/home/ai-dashboard.svg" alt="AI 数据观察界面" width={920} height={600} /></div></div></section>
    <section className={styles.paperSection}><SectionHeading eyebrow="项目式学习" title="问题、设计、制作、测试与表达，构成完整闭环。" copy="每一个作品都经过多轮判断与修改。最终成果不仅是模型，也包括孩子能够说明自己为什么这样做。" /><div className={styles.twoDiagrams}><Diagram src="/media/site-v3/diagrams/pbl-cycle.svg" alt="项目式学习循环图" /><Diagram src="/media/site-v3/diagrams/course-ladder.svg" alt="分龄课程成长阶梯" /></div></section>
    <section className={styles.section}><SectionHeading eyebrow="主题项目" title="知识因真实主题而连接。" copy="智慧农业、中草药与现代科技等主题，让孩子把观察、传感、控制、设计与表达放入同一个任务。" /><MediaMosaic items={[
      { src: "/media/site-v3/courses/smart-agriculture-system-v1.png", alt: "学生制作智慧农业系统", title: "智慧农业", copy: "观察环境数据，设计灌溉与控制方案。" },
      { src: "/media/site-v3/courses/herbal-iot-project-v1.png", alt: "中草药与物联网主题项目", title: "中草药与现代科技", copy: "从自然观察走向数字记录与智能照护。" },
      { src: "/media/site-v3/home/hardware-drone-v2.png", alt: "教育无人机", title: "飞行任务", copy: "把安全、空间与控制写进可执行任务。" },
      { src: "/media/site-v3/home/hardware-robot-controller-v2.png", alt: "机器人控制器", title: "机器人控制", copy: "用传感与反馈完成真实动作。" },
    ]} /></section>
    <Callout title="从孩子的兴趣出发，找到合适的创造起点。" copy="告诉我们孩子的年龄、兴趣和已有经验，一起规划第一段清晰、可持续的学习路径。" />
  </main>;
}

export function CoursesEditorial() {
  const directions: MediaItem[] = [
    { src: "/media/site-v3/courses/course-programming-v1.png", alt: "学生学习编程", title: "编程", copy: "逻辑思维、算法表达与软硬件控制。", href: "/courses/directions/programming" },
    { src: "/media/site-v3/courses/course-3d-v1.png", alt: "学生进行三维建模", title: "3D 建模", copy: "空间结构、造型设计与数字制造。", href: "/courses/directions/3d-modeling" },
    { src: "/media/site-v3/courses/course-ai-v1.png", alt: "学生体验人工智能项目", title: "人工智能", copy: "数据观察、智能识别与生成式表达。", href: "/courses/directions/ai" },
    { src: "/media/site-v3/courses/course-drone-v1.png", alt: "学生学习无人机任务", title: "无人机", copy: "安全飞行、空间判断与任务规划。", href: "/courses/directions/drone" },
    { src: "/media/site-v3/courses/course-robotics-v1.png", alt: "学生搭建机器人", title: "机器人", copy: "机械结构、传感反馈与综合控制。", href: "/courses/directions/robotics" },
    { src: "/media/site-v3/courses/course-innovation-v1.png", alt: "学生完成综合科创项目", title: "综合科创", copy: "跨学科探究、项目协作与公开表达。", href: "/courses/directions/innovation" },
  ];
  return <main className={styles.page}>
    <Hero eyebrow="六大方向 · 分龄进阶" title="一套从理解到创造的课程体系。" copy="课程不是孤立知识点的排列，而是围绕真实问题，把编程、结构、人工智能和工程实践组织成连续成长路径。" image="/media/site-v3/courses/course-collaboration-hero-v2.png" alt="学生们围绕机器人项目协作学习" note="同一项目，多种能力共同发生" />
    <section className={styles.section}><SectionHeading eyebrow="课程目录" title="六大方向，展开孩子理解科技的不同入口。" copy="每个方向都有清晰的知识目标，也会在综合项目中彼此连接。" /><PhotoSequence items={directions} /></section>
    <section className={styles.paperSection}><div className={styles.diagramStory}><Diagram src="/media/site-v3/diagrams/course-ladder.svg" alt="分龄课程成长阶梯" /><div><SectionHeading eyebrow="分龄进阶" title="从兴趣启蒙到自主项目。" /><IndexRows items={[{ number: "01", title: "兴趣启蒙", copy: "通过直观装置与简单任务建立因果理解。" }, { number: "02", title: "基础建构", copy: "学习结构、程序和传感器的基本关系。" }, { number: "03", title: "综合应用", copy: "围绕主题拆解任务、组合多种技术。" }, { number: "04", title: "项目研究", copy: "提出问题、验证方案并完成成果表达。" }]} /></div></div></section>
    <section className={styles.section}><SectionHeading eyebrow="年龄路径" title="不同阶段，有不同的任务深度与表达方式。" /><div className={styles.directoryColumns}><IndexRows items={[{ number: "2—3", title: "科创体验", copy: "两学期 · 每学期 16 次 · 每次 1.5 小时，从器件认知到感应小夜灯等综合项目。", href: "/courses/directions/experience" }, { number: "4—5", title: "科创成长", copy: "从照着做到主动探究，接触激光切割与 3D 打印基础。", href: "/courses/directions/growth" }]} /><IndexRows items={[{ number: "6—7", title: "科创发明家", copy: "整合多种技术，完成发明原型、研究报告与路演答辩。", href: "/courses/directions/inventor" }, { number: "7+", title: "科创小院士", copy: "围绕数据、健康、社区与环境议题开展长期研究。", href: "/courses/directions/young-scholar" }]} /></div></section>
    <section className={styles.section}><SectionHeading eyebrow="跨学科主题" title="同一个真实主题，连接多门课程。" copy="主题项目把科学观察、工程设计、数字工具和公共表达放到完整任务中。" /><MediaMosaic items={[{ src: "/media/site-v3/courses/smart-agriculture-class-v2.png", alt: "智慧农业课堂", title: "智慧农业", copy: "传感数据、自动控制与生态观察。" }, { src: "/media/site-v3/courses/herbal-science-class-v2.png", alt: "本草科学课堂", title: "中草药与现代科技", copy: "自然研究、信息记录与数字化照护。" }]} /></section>
    <section className={styles.paperSection}><div className={styles.diagramStory}><div><SectionHeading eyebrow="课堂方法" title="PBL 让知识进入行动。" copy="从提出问题到测试迭代，每一步都有可观察的过程和反馈。" /><IndexRows items={[{ number: "Q", title: "提出问题", copy: "从真实场景中找到值得解决的任务。" }, { number: "D", title: "设计方案", copy: "比较不同选择，形成可执行计划。" }, { number: "M", title: "制作测试", copy: "搭建、编程、测量并持续修改。" }, { number: "S", title: "展示复盘", copy: "讲清证据、选择与下一次改进。" }]} /></div><Diagram src="/media/site-v3/diagrams/pbl-cycle.svg" alt="项目式学习闭环" /></div></section>
    <section className={styles.section}><SectionHeading eyebrow="课程成果" title="作品不是终点，而是思考过程的可见证据。" /><MediaMosaic items={[{ src: "/media/site-v3/courses/outcome-smart-agriculture-v2.png", alt: "智慧农业模型成果", title: "环境感知系统" }, { src: "/media/site-v3/courses/outcome-herbal-science-v2.png", alt: "本草智能照护成果", title: "本草智能照护" }, { src: "/media/site-v3/courses/outcome-autonomous-rover-v2.png", alt: "自主小车成果", title: "自主导航小车" }, { src: "/media/site-v3/courses/outcome-kinetic-creature-v2.png", alt: "机械生物成果", title: "机械生物装置" }]} /></section>
    <Callout title="为孩子选择合适的方向与阶段。" copy="课程顾问会结合年龄、兴趣、经验与目标，给出清晰的学习建议。" />
  </main>;
}

export function ToolsEditorial() {
  const tools: MediaItem[] = [
    { src: "/media/site-v3/tools/music-creation-scene-v2.png", alt: "孩子用 AI 创作音乐", title: "AI 音乐", copy: "从节奏、旋律与情绪描述开始，形成可以试听和继续调整的作品。", number: "SOUND" },
    { src: "/media/site-v3/tools/art-creation-scene-v2.png", alt: "孩子用 AI 完成视觉创作", title: "AI 绘画", copy: "描述主体、构图与色彩，比较生成结果并建立自己的视觉判断。", number: "IMAGE" },
    { src: "/media/site-v3/tools/coding-creation-scene-v2.png", alt: "孩子用 AI 辅助编程", title: "AI 编程", copy: "把目标拆成步骤，让程序在运行、观察和调试中逐渐可靠。", number: "CODE" },
    { src: "/media/site-v3/tools/reading-creation-scene-v2.png", alt: "孩子与 AI 阅读助手共读", title: "AI 阅读", copy: "导入文章、逐段理解、形成连续绘本，让阅读过程看得见。", number: "READ" },
  ];
  return <main className={styles.page}>
    <Hero eyebrow="AI 创作空间" title="把想法变成可以继续修改的作品。" copy="声音、图像、程序与阅读不是一次生成的终点。孩子要描述、比较、选择、调整，并留下自己的判断。" image="/media/site-v3/tools/creator-lab-overview-v1.png" alt="孩子在 AI 创作空间完成跨媒介作品" primary={{ href: "/tools/ai-music", label: "进入创作工具" }} secondary={{ href: "/courses", label: "查看对应课程" }} note="描述 · 生成 · 比较 · 修改" />
    <section className={styles.section}><SectionHeading eyebrow="媒介目录" title="四种媒介，四种表达思考的方法。" copy="每个工具都保留清晰的创作步骤、可比较的结果和继续修改的空间。" /><div className={styles.toolShelf}>{tools.map((item, i) => <AnimatedContent className={styles.toolRow} key={item.title} delay={i * 60}><div><span>{item.number}</span><h2>{item.title}</h2><p>{item.copy}</p><Link href={`/tools/ai-${item.title === "AI 音乐" ? "music" : item.title === "AI 绘画" ? "art" : item.title === "AI 编程" ? "programming" : "reading"}`}>开始创作 <ArrowRight size={17} /></Link></div><Image src={item.src} alt={item.alt} width={900} height={680} /></AnimatedContent>)}</div></section>
    <section className={styles.paperSection}><div className={styles.diagramStory}><Diagram src="/media/site-v3/diagrams/ai-creation-loop.svg" alt="AI 创作闭环" /><div><SectionHeading eyebrow="创作循环" title="描述不是命令，而是第一次草稿。" /><IndexRows items={[{ number: "01", title: "描述意图", copy: "先说明主题、情绪、结构与限制。" }, { number: "02", title: "生成草稿", copy: "把第一轮结果作为思考材料。" }, { number: "03", title: "比较选择", copy: "辨认差异，说明为什么保留或放弃。" }, { number: "04", title: "继续修改", copy: "调整提示、构图、程序或段落。" }]} /></div></div></section>
    <section className={styles.section}><SectionHeading eyebrow="作品画廊" title="同一个想法，可以跨越声音、图像、代码与故事。" /><MediaMosaic items={tools} /></section>
    <section className={styles.responsible}><BrainCircuit size={42} /><div><h2>负责任地使用 AI</h2><p>明确作品中的个人选择，不把生成结果当作事实；尊重隐私、版权和同伴，不用 AI 代替学习与判断。</p></div><Link href="/legal/ai-safety">查看使用说明 <ArrowRight size={17} /></Link></section>
    <Callout title="选择一种媒介，开始第一轮创作。" copy="先留下你的想法，再让工具帮助你看见更多可能。" href="/tools/ai-reading" label="从 AI 阅读开始" />
  </main>;
}

export function CooperationEditorial() {
  const modes: MediaItem[] = [
    { src: "/media/site-v3/cooperation/regular-class-v2.png", alt: "学校常规科创课堂", title: "常规课程", copy: "与学期教学节奏配合的稳定课程。" }, { src: "/media/site-v3/cooperation/maker-club-v2.png", alt: "校园科创社团", title: "科创社团", copy: "围绕兴趣和作品持续进阶。" }, { src: "/media/site-v3/cooperation/theme-workshop-v2.png", alt: "校园主题工作坊", title: "主题活动", copy: "在集中任务中完成可展示成果。" }, { src: "/media/site-v3/cooperation/competition-training-v2.png", alt: "竞赛项目训练", title: "竞赛项目", copy: "从选题、制作到答辩的完整准备。" }, { src: "/media/site-v3/cooperation/teacher-development-v2.png", alt: "教师教研培训", title: "教师研修", copy: "课程理解、课堂实施与共备支持。" }, { src: "/media/site-v3/cooperation/student-presentation-v2.png", alt: "学生在校园展示成果", title: "成果展示", copy: "让学习过程被同伴、教师与家长看见。" },
  ];
  return <main className={styles.page}>
    <Hero eyebrow="校园合作" title="把完整的科创学习带进校园。" copy="从课程设计、课堂实施到主题活动与成果展示，为学校提供可持续、可评估的科创教育方案。" image="/media/site-v3/cooperation/classroom-concept-v1.png" alt="校园科创课堂概念场景" primary={{ href: "/consult", label: "咨询校园合作" }} secondary={{ href: "/courses", label: "查看课程体系" }} note="课程 · 师资 · 教具 · 展示" />
    <section className={styles.paperSection}><div className={styles.diagramStory}><div><SectionHeading eyebrow="合作路径" title="从需求理解到持续复盘。" copy="先理解学校的年级结构、课程目标和实施条件，再共同确定课程、师资、教具与成果方式。" /><IndexRows items={[{ number: "01", title: "需求沟通", copy: "明确年级、课时、空间与培养目标。" }, { number: "02", title: "方案共创", copy: "组合课程、活动、师资和教具。" }, { number: "03", title: "课堂实施", copy: "以项目任务推进学习与作品。" }, { number: "04", title: "成果复盘", copy: "汇总过程证据并优化下一阶段。" }]} /></div><Diagram src="/media/site-v3/diagrams/cooperation-delivery.svg" alt="校园合作交付路径" /></div></section>
    <section className={styles.section}><SectionHeading eyebrow="合作方式" title="按校园场景组合，不用同一套模板覆盖所有需求。" /><MediaMosaic items={modes} /></section>
    <section className={styles.paperSection}><div className={styles.splitMedia}><div><SectionHeading eyebrow="空间与教具" title="让课堂可以稳定发生。" copy="围绕操作区、讨论区、测试区和展示区组织空间，让材料、设备与项目进度都清晰可管理。" /><IndexRows items={[{ number: "A", title: "课程教具", copy: "与任务配套的结构件、传感器与数字工具。" }, { number: "B", title: "空间规划", copy: "兼顾讲解、协作、制作、测试与展示。" }, { number: "C", title: "教研支持", copy: "课堂共备、教师研修和阶段复盘。" }]} /></div><div className={styles.mediaPair}><Image src="/media/site-v3/cooperation/classroom-kit-v1.png" alt="科创课程教具" width={1000} height={760} /><Image src="/media/site-v3/cooperation/maker-space-cutaway-v1.png" alt="校园创客空间分区" width={1000} height={760} /></div></div></section>
    <Callout title="一起把学校的培养目标变成可实施的课程方案。" copy="提供年级、课时、空间与预期成果，我们会据此准备合作建议。" label="查看合作方式" />
  </main>;
}

export function ActivitiesEditorial() {
  const stages: MediaItem[] = [
    { src: "/media/site-v3/activities/competition-prep-v2.png", alt: "学生准备机器人赛事", title: "理解规则", copy: "把挑战要求转化为清晰任务。" }, { src: "/media/site-v3/activities/team-collaboration-v2.png", alt: "学生团队协作制作", title: "协作制作", copy: "分工、沟通并共同解决问题。" }, { src: "/media/site-v3/activities/prototype-iteration-v2.png", alt: "学生测试传感器作品", title: "测试迭代", copy: "用数据和现象验证方案。" }, { src: "/media/site-v3/activities/public-presentation-v2.png", alt: "学生公开展示作品", title: "公开表达", copy: "讲清作品、证据与改进方向。" },
  ];
  return <main className={styles.page}>
    <Hero eyebrow="科创活动" title="把课堂里的能力，带到真实挑战中。" copy="主题工作坊、校园展示与科创赛事，让孩子在有限时间、明确规则和团队协作中完成可运行的作品。" image="/media/site-v3/activities/workshop-process-v1.png" alt="学生在主题科创工作坊协作制作" primary={{ href: "/consult", label: "咨询近期活动" }} secondary={{ href: "/achievements", label: "查看成长成果" }} note="挑战 · 协作 · 测试 · 表达" />
    <section className={styles.paperSection}><SectionHeading eyebrow="年度节奏" title="活动不是一次热闹，而是持续积累。" copy="从兴趣体验、主题实践到赛事挑战和成果展示，每一阶段都承接前一阶段的学习。" /><Diagram src="/media/site-v3/activities/activity-year-timeline.svg" alt="年度科创活动时间线" /></section>
    <section className={styles.section}><SectionHeading eyebrow="活动过程" title="完成作品，也学会与他人一起完成作品。" /><PhotoSequence items={stages} /></section>
    <section className={styles.section}><SectionHeading eyebrow="赛事资料" title="先了解方向，再决定如何准备。" copy="以下赛事信息依据手册整理，具体时间、组别与赛项以当年正式通知为准。" /><div className={styles.directoryColumns}><IndexRows items={[
      { number: "01", title: "明日科技之星", copy: "1—5 月 · 小学至高中", href: "/activities/mingri-keji-zhixing" }, { number: "02", title: "上海创客新星大赛", copy: "3—6 月 · 小学至高中", href: "/activities/chuangke-xinxing" }, { number: "03", title: "宋庆龄少年儿童发明奖", copy: "2—8 月 · 小学至高中", href: "/activities/songqingling-famingjiang" }, { number: "04", title: "雏鹰杯科创达人挑战赛", copy: "9—12 月 · 小学二年级至初中九年级", href: "/activities/chuyingbei" }, { number: "05", title: "赛复创智杯", copy: "4—7 月 · 小学至高中", href: "/activities/saifu-chuangzhibei" }, { number: "06", title: "青少年人工智能创新大赛", copy: "人工智能与场景应用", href: "/activities/youth-ai-innovation" }, { number: "07", title: "上海未来工程师大赛", copy: "工程方案、原型与现场表达", href: "/activities/shanghai-future-engineer" },
    ]} /><IndexRows items={[
      { number: "08", title: "机器人知识与实践比赛", copy: "知识、规则与专项操作", href: "/activities/xinann-weiyu-cup" }, { number: "09", title: "WRC 青少年赛", copy: "机器人设计与信息素养", href: "/activities/wrc-youth" }, { number: "10", title: "长三角 AI 奥林匹克", copy: "算法与无人驾驶赛道", href: "/activities/yangtze-ai-olympic" }, { number: "11", title: "上图杯模型大赛", copy: "模型选题、构思与成品", href: "/activities/shangtu-cup" }, { number: "12", title: "中国芯选拔赛", copy: "通讯科技创新作品", href: "/activities/china-chip" }, { number: "13", title: "全国青少年无人机大赛", copy: "操控、编程与创意飞行", href: "/activities/national-youth-drone" }, { number: "14", title: "飞向北京 · 飞向太空", copy: "航空航天模型教育竞赛", href: "/activities/fly-beijing" },
    ]} /></div></section>
    <section className={styles.paperSection}><div className={styles.diagramStory}><Diagram src="/media/site-v3/diagrams/event-prep-loop.svg" alt="赛事准备循环" /><div><SectionHeading eyebrow="准备清单" title="从规则到答辩，逐项准备。" /><IndexRows items={[{ number: "01", title: "读懂任务", copy: "确认规则、边界、评分与安全要求。" }, { number: "02", title: "确定方案", copy: "比较想法，形成结构与程序计划。" }, { number: "03", title: "反复测试", copy: "记录问题，用证据调整作品。" }, { number: "04", title: "整理表达", copy: "准备展示、演示与现场答辩。" }]} /></div></div></section>
    <section className={styles.section}><SectionHeading eyebrow="活动图集" title="过程中的每一次修改，都值得被记录。" /><MediaMosaic items={[{ src: "/media/site-v3/activities/prototype-testing-v1.png", alt: "科创作品测试过程", title: "作品测试" }, { src: "/media/site-v3/activities/team-collaboration-v2.png", alt: "团队协作过程", title: "团队协作" }, { src: "/media/site-v3/activities/public-presentation-v2.png", alt: "学生公开路演", title: "公开路演" }]} /></section>
    <Callout title="为孩子找到一次值得投入的真实挑战。" copy="了解近期主题活动、赛事准备与校园合作安排。" label="咨询活动安排" />
  </main>;
}

export function GrowthEditorial() {
  const evidence: MediaItem[] = [
    { src: "/media/site-v3/growth/student-presentation-v2.png", alt: "学生表达项目成果", title: "表达", copy: "能说明目标、选择与结果。" }, { src: "/media/site-v3/growth/prototype-evolution-v2.png", alt: "作品从草图到成品的迭代", title: "迭代", copy: "看见从草图到原型的改变。" }, { src: "/media/site-v3/growth/mentor-review-v2.png", alt: "教师与学生共同复盘项目", title: "复盘", copy: "把反馈转化为下一次行动。" }, { src: "/media/site-v3/growth/evidence-archive-v2.png", alt: "作品档案与成长记录", title: "档案", copy: "让过程、作品和阶段成果被保存。" },
  ];
  return <main className={styles.page}>
    <Hero eyebrow="学员成长" title="让每一次选择与修改，都成为成长证据。" copy="一件作品背后，有问题意识、结构判断、程序逻辑、协作过程和公开表达。我们用完整档案看见这些变化。" image="/media/site-v3/growth/student-presentation-v2.png" alt="学生向同伴展示机器人作品" primary={{ href: "/consult", label: "规划成长路径" }} secondary={{ href: "/activities", label: "查看科创活动" }} note="作品之外，更重要的是思考过程" />
    <section className={styles.paperSection}><div className={styles.diagramStory}><div><SectionHeading eyebrow="五维成长" title="不只评价作品是否完成。" copy="我们同时关注理解、实践、创新、协作与表达，让成长有更完整的观察角度。" /><IndexRows items={[{ number: "01", title: "理解", copy: "能解释原理与任务。" }, { number: "02", title: "实践", copy: "能使用工具完成制作。" }, { number: "03", title: "创新", copy: "能提出并比较不同方案。" }, { number: "04", title: "协作", copy: "能分工、沟通与共同决策。" }, { number: "05", title: "表达", copy: "能清晰展示过程与证据。" }]} /></div><Diagram src="/media/site-v3/diagrams/growth-five-dimensions.svg" alt="学员五维成长图" /></div></section>
    <section className={styles.section}><SectionHeading eyebrow="成长证据" title="草图、原型、测试记录与表达，共同组成作品档案。" /><MediaMosaic items={evidence} /></section>
    <section className={styles.paperSection}><div className={styles.diagramStory}><Diagram src="/media/site-v3/growth/growth-research-path.svg" alt="研究型成长路径" /><div><SectionHeading eyebrow="研究路径" title="从一个问题出发，形成自己的证据。" /><IndexRows items={[{ number: "Q", title: "问题", copy: "提出值得追踪的真实问题。" }, { number: "E", title: "证据", copy: "观察、测量并记录现象。" }, { number: "P", title: "原型", copy: "把想法变成可测试的作品。" }, { number: "R", title: "反思", copy: "根据结果调整下一轮方案。" }]} /></div></div></section>
    <section className={styles.section}><div className={styles.splitMedia}><div><SectionHeading eyebrow="阶段成果" title="成果用于回望，也用于继续前进。" copy="阶段性作品、展示记录与证书只记录真实发生的学习，不替代孩子自己的成长过程。" /></div><Image className={styles.wideImage} src="/media/site-v3/growth/evidence-flatlay-v1.png" alt="成长档案、作品记录与阶段成果" width={1200} height={800} /></div></section>
    <section className={styles.paperSection}><SectionHeading eyebrow="成长通道" title="把长期兴趣，连接到更深入的研究。" copy="英才计划、强基计划与小研究员等方向帮助家庭理解长期发展可能；具体选拔与申报以当年官方通知为准。" /><div className={styles.directoryColumns}><IndexRows items={[{ number: "01", title: "英才计划", copy: "关注学科兴趣、研究潜力与持续投入。" }, { number: "02", title: "强基计划", copy: "理解基础学科拔尖人才培养特点，不作录取承诺。" }]} /><IndexRows items={[{ number: "03", title: "小研究员", copy: "围绕课题、证据、成果与答辩形成研究经历。" }, { number: "04", title: "作品档案", copy: "持续记录草图、原型、测试、修改与公开表达。" }]} /></div></section>
    <Callout title="为孩子建立一条看得见、说得清的成长路径。" copy="从兴趣、基础和目标出发，选择合适的课程与项目。" />
  </main>;
}

export function AboutEditorial() {
  return <main className={styles.page}>
    <Hero eyebrow="走进科瑞特" title="让科技教育回到真实创造。" copy="科瑞特面向青少年构建编程、机器人、人工智能与综合科创课程，让孩子在真实问题、动手实践和公开表达中理解科技。" image="/media/site-v3/about/maker-studio-overview-v1.png" alt="明亮的科瑞特科创工作室" primary={{ href: "/courses", label: "了解课程体系" }} secondary={{ href: "/consult", label: "联系科瑞特" }} note="课程 · 项目 · 作品 · 成长" />
    <section className={styles.paperSection}><div className={styles.diagramStory}><Diagram src="/media/site-v3/about/about-philosophy.svg" alt="真实问题、动手实践与公开表达三角关系" /><div><SectionHeading eyebrow="教育理念" title="真实问题，真实动手，真实表达。" /><IndexRows items={[{ number: "01", title: "从问题出发", copy: "让知识进入孩子能够观察和理解的场景。" }, { number: "02", title: "在实践中理解", copy: "通过搭建、编程、测试看到技术的因果关系。" }, { number: "03", title: "用表达完成学习", copy: "说明证据与选择，让作品成为思考的载体。" }]} /></div></div></section>
    <section className={styles.section}><div className={styles.splitMedia}><div><SectionHeading eyebrow="课程研发" title="把课程目标拆成可完成的项目过程。" copy="围绕编程、3D 建模、人工智能、无人机、机器人与综合科创持续研发课程，并把每个主题连接到清晰的学习证据。" /><IndexRows items={[{ number: "A", title: "课程目标", copy: "明确孩子需要理解和能够完成什么。" }, { number: "B", title: "项目任务", copy: "把目标组织成真实、连贯的制作过程。" }, { number: "C", title: "评价证据", copy: "用作品、记录和表达观察成长。" }]} /></div><Image className={styles.wideImage} src="/media/site-v3/about/curriculum-research-flatlay-v1.png" alt="课程研发资料与机器人原型" width={1200} height={800} /></div></section>
    <section className={styles.section}><SectionHeading eyebrow="品牌档案" title="课程背后，是持续的研究与专业协作。" /><div className={styles.directoryColumns}><IndexRows items={[{ number: "01", title: "科创教育背景", copy: "回应面向未来的科学素养、工程实践与创新人才培养。" }, { number: "02", title: "专家与顾问", copy: "以专业方向支持课程研发、项目设计与教育实践。" }]} /><IndexRows items={[{ number: "03", title: "著作与课程研发", copy: "持续积累课程内容、教学方法与原创项目成果。" }, { number: "04", title: "竞赛与作品成果", copy: "以可追溯的作品、活动与阶段记录呈现真实成长。" }]} /></div></section>
    <section className={styles.paperSection}><SectionHeading eyebrow="发展路径" title="从课程研发，走向校园与学习社区。" /><Diagram src="/media/site-v3/about/about-timeline.svg" alt="科瑞特发展路径时间线" /></section>
    <section className={styles.section}><div className={styles.diagramStory}><div><SectionHeading eyebrow="联系与校区" title="在上海徐汇，继续了解科瑞特。" copy="AI 科瑞特青少儿科创机器人编程，欢迎家长与学校沟通课程、活动和校园合作。" /><IndexRows items={[{ number: "01", title: "浦北路校区", copy: "徐汇区浦北路 1077 号 2 楼。" }, { number: "02", title: "龙文路校区", copy: "上海市徐汇区龙文路 69 号 2 层。" }, { number: "03", title: "电话咨询", copy: "19921536568。" }]} /></div><Diagram src="/media/site-v3/about/about-map-pins.svg" alt="合作网络与校区位置示意" /></div></section>
    <Callout title="来聊聊孩子的兴趣，或学校的科创教育计划。" copy="我们会结合具体需求，提供课程、活动或合作建议。" />
  </main>;
}

export function ConsultEditorial({ form }: { form: React.ReactNode }) {
  return <main className={styles.page}>
    <Hero eyebrow="课程咨询" title="从年龄、兴趣与目标出发，找到合适的学习起点。" copy="课程不是越难越好。先了解孩子目前喜欢什么、做过什么、希望完成什么，再选择方向与阶段。" image="/media/site-v3/consult/family-course-dialogue-v1.png" alt="家长、孩子与课程老师交流学习方向" primary={{ href: "#consult-form", label: "填写咨询信息" }} secondary={{ href: "tel:19921536568", label: "电话 19921536568" }} note="一次沟通，先把需求说清楚" />
    <section className={styles.paperSection}><SectionHeading eyebrow="咨询依据" title="我们会先了解四件事。" copy="年龄决定理解和操作方式，兴趣决定进入主题，经验帮助判断起点，目标影响课程与项目安排。" /><Diagram src="/media/site-v3/consult/consult-four-factors.svg" alt="年龄、兴趣、经验与目标四项咨询依据" /></section>
    <section className={styles.section}><div className={styles.diagramStory}><Diagram src="/media/site-v3/diagrams/consult-course-map.svg" alt="课程方向选择地图" /><div><SectionHeading eyebrow="方向建议" title="兴趣可以从多个入口发生。" /><IndexRows items={[{ number: "01", title: "喜欢逻辑与挑战", copy: "可以从编程、机器人与任务控制开始。" }, { number: "02", title: "喜欢造型与表达", copy: "可以从 3D 建模、AI 绘画和创意设计开始。" }, { number: "03", title: "喜欢观察与研究", copy: "可以从人工智能、智慧农业与综合科创开始。" }, { number: "04", title: "已有明确目标", copy: "可围绕项目、活动或竞赛制定阶段路径。" }]} /></div></div></section>
    <section id="consult-form" className={styles.formSection}><div><span className={styles.eyebrow}>留下信息</span><h2>告诉我们孩子现在的情况。</h2><p>提交后，我们会根据你留下的联系方式，一起确认合适的学习起点。</p><Image src="/media/site-v3/consult/family-course-dialogue-v1.png" alt="课程沟通场景" width={800} height={600} /></div><div className={styles.formPanel}>{form}</div></section>
    <section className={styles.paperSection}><SectionHeading eyebrow="常见问题" title="在开始前，把重要问题讲清楚。" /><IndexRows items={[{ number: "01", title: "没有基础可以开始吗？", copy: "可以。课程会根据年龄和经验选择合适的任务复杂度。" }, { number: "02", title: "课程会只教工具吗？", copy: "不会。工具服务于理解、实践和表达，项目过程更重要。" }, { number: "03", title: "如何看到学习成果？", copy: "通过草图、程序、原型、测试记录和公开表达形成完整档案。" }, { number: "04", title: "学校可以合作吗？", copy: "可以提供常规课程、社团、主题活动、竞赛项目与教师研修。" }]} /></section>
    <Callout title="也可以直接联系科瑞特。" copy="浦北路 1077 号 2 楼 · 龙文路 69 号 2 层 · 19921536568" label="拨打咨询电话" href="tel:19921536568" />
  </main>;
}

export const courseIcons = { Code2, Boxes, BrainCircuit, Plane, Bot, Lightbulb, Music2, Palette, BookOpen, School, Trophy, GraduationCap, Presentation, Wrench, Cpu, Sparkles, Sprout };
