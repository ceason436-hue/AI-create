const ROOT = "../../AI科瑞特手册素材库/页面图像/";
const MASTER = "../风格预览/全站设计母版-已锁定.png";
const LOGO = "../../../ai音乐/ai-music-app/public/logo2.png";

const header = () => `
  <header class="site-header">
    <img class="site-logo" src="${LOGO}" alt="科瑞特" />
    <nav class="site-nav"><span>课程体系</span><span>AI 创作空间</span><span>校园合作</span><span>科创活动</span><span>学员成长</span><span>走进科瑞特</span></nav>
    <div class="site-actions"><span>登录</span><span>注册</span><a class="solid-btn orange">课程咨询</a></div>
  </header>`;

const footer = () => `
  <footer class="site-footer">
    <div><img src="${LOGO}" alt="科瑞特" /><p>AI 科瑞特青少儿科创机器人编程<br>让孩子在真实创造中理解科技。</p></div>
    <div><strong>学习与服务</strong><ul><li>课程体系</li><li>AI 创作空间</li><li>科创活动</li><li>课程咨询</li></ul></div>
    <div><strong>联系科瑞特</strong><p>19921536568<br>徐汇区浦北路 1077 号 2 楼<br>上海市徐汇区龙文路 69 号 2 层</p></div>
  </footer>`;

const techRule = `<div class="tech-rule"><i></i><i></i><i></i></div>`;

const pages = [
  {
    id: "home", title: "首页 · 锁定母版", sources: "锁定母版 · 手册 P01 / P38–42", render: () => `
      <div class="site-page">
        <img class="master-preview" src="${MASTER}" alt="锁定的首页设计母版" />
        <div class="master-label">首页首屏与“从兴趣到作品”段落：直接以锁定母版为唯一视觉权威，实施时逐项复刻构图、线条、点阵、标题尺度和图片过渡。</div>
        <section class="section compact home-continuation">
          <div class="section-heading"><div><div class="eyebrow">CURRICULUM MAP</div><h2>六条课程方向，通向真实作品</h2></div><p>课程分类严格依据手册 P10，总站不把课程压缩成同质化卡片，而以清晰的学科谱系与真实学习任务组织。</p></div>
          <div class="discipline-band">
            <article><b>01</b><h3>编程</h3><p>Scratch / Python / C++</p></article>
            <article><b>02</b><h3>3D 建模</h3><p>基础 / 进阶</p></article>
            <article><b>03</b><h3>AI 智能</h3><p>AI 小助手 / 编程 / 绘画 / 音乐</p></article>
            <article><b>04</b><h3>无人机</h3><p>四旋翼 / 足球 / 编程 / 竞赛</p></article>
            <article><b>05</b><h3>机器人</h3><p>颗粒结构 / 项目实践</p></article>
            <article><b>06</b><h3>科创</h3><p>启蒙至成果 / 课题创意 + 实物</p></article>
          </div>
        </section>
        <section class="section blueprint">
          <div class="section-heading"><div><div class="eyebrow">HOW WE LEARN</div><h2>从课程选择，到工程思维</h2></div><p>依据手册 P37–42：三层培养维度、课程梯度、项目式学习、五育融合与工程思维不再作为零散口号，而成为连贯的学习方法说明。</p></div>
          <div class="method-flow">
            <article><span class="big-no">01</span><h3>匹配兴趣与阶段</h3><p>从学生年龄、兴趣方向和已有经验出发，找到合适入口。</p></article>
            <article><span class="big-no">02</span><h3>在项目中探索</h3><p>围绕真实问题反复设计、搭建、编程与验证。</p></article>
            <article><span class="big-no">03</span><h3>用作品表达成长</h3><p>将理解、实践与表达汇聚为可以展示和讲述的作品。</p></article>
          </div>
        </section>
        ${footer()}
      </div>`
  },
  {
    id: "courses", title: "课程体系 · B 编辑式", sources: "手册 P10–54", render: () => `
      <div class="site-page">${header()}
        <section class="course-hero">
          <div class="course-hero-copy"><div class="eyebrow">COURSE SYSTEM / 手册 P10–54</div><h1 class="display-title small">不是课程清单，<br>是一条从兴趣走向成果的路径。</h1>${techRule}<p class="lead">把编程、3D 建模、人工智能、无人机、机器人与综合科创，按学习阶段和真实项目重新组织。</p></div>
          <div class="course-hero-visual"><img src="${ROOT}page-10.jpg" alt="手册课程目录第10页" /></div>
        </section>
        <section class="section">
          <div class="course-index"><aside>01 编程课程<br>02 3D 建模<br>03 人工智能<br>04 无人机<br>05 机器人<br>06 综合科创</aside><div>
            <div class="section-heading"><div><div class="eyebrow">SIX DIRECTIONS</div><h2>六大方向，不同入口</h2></div><p>每一行进入独立课程详情；详情页继续承接手册中的课程体系、课程简介、器材、项目和大纲。</p></div>
            <div class="course-rows">
              <div class="course-row"><b>01</b><h3>编程课程</h3><p>Scratch / Python / C++ · 手册 P11–15</p><i>→</i></div>
              <div class="course-row"><b>02</b><h3>3D 建模</h3><p>基础 / 进阶 / 软件建模 · 手册 P16–18</p><i>→</i></div>
              <div class="course-row"><b>03</b><h3>人工智能</h3><p>AI 小助手 / AI 编程 / AI 绘画 / AI 音乐 · 手册 P19–20</p><i>→</i></div>
              <div class="course-row"><b>04</b><h3>无人机</h3><p>四旋翼 / 足球无人机 / 编程无人机 / 竞赛 · 手册 P21–26</p><i>→</i></div>
              <div class="course-row"><b>05</b><h3>机器人</h3><p>颗粒结构 / 神经元 / 点点通 / 项目搭建 · 手册 P27–35</p><i>→</i></div>
              <div class="course-row"><b>06</b><h3>综合科创</h3><p>启蒙 / 基础 / 进阶 / 高阶 / 成果 · 手册 P36、P43–54</p><i>→</i></div>
            </div>
          </div></div>
        </section>
        <section class="section blueprint">
          <div class="section-heading"><div><div class="eyebrow">LEARNING LADDER</div><h2>四段科创成长阶梯</h2></div><p>保持手册真实年龄范围与课程命名，采用横向阶段叙事，避免空白和卡片堆叠。</p></div>
          <div class="stages"><article><b>P43 · 2–3 年级</b><h3>科创体验</h3><p>设备初识、编程基础、传感器基础与复杂项目。</p></article><article><b>P44 · 4–5 年级</b><h3>科创成长</h3><p>进入更完整的结构、控制与主题项目训练。</p></article><article><b>P45 · 6–7 年级</b><h3>科创发明家</h3><p>从问题出发完成设计、验证、优化与表达。</p></article><article><b>P46 · 7 年级以上</b><h3>科创小院士</h3><p>面向高阶研究、课题与成果的长期学习路径。</p></article></div>
        </section>
        <section class="section">
          <div class="section-heading"><div><div class="eyebrow">THEMATIC PROJECTS</div><h2>从真实议题进入跨学科创造</h2></div><p>手册 P47–48 的两组主题课程拥有独立视觉区，不再隐藏在普通列表中。</p></div>
          <div class="theme-split"><article><span class="source-tag">P47 · 6 年级以上</span><h3>智能农业与生态养殖</h3><p>把生物、环境、传感器、控制与工程实践连接到一个可持续观察和改进的系统。</p><img src="${ROOT}page-47.jpg" alt="智能农业与生态养殖" /></article><article><span class="source-tag">P48 · 6 年级以上</span><h3>中草药与现代科技</h3><p>围绕传统知识、科学观察与现代技术形成可研究、可制作、可表达的主题项目。</p><img src="${ROOT}page-48.jpg" alt="中草药与现代科技" /></article></div>
        </section>
        ${footer()}
      </div>`
  },
  {
    id: "ai", title: "AI 创作空间 · 总览", sources: "手册 P19–20", render: () => `
      <div class="site-page">${header()}
        <section class="ai-hero"><div class="ai-hero-copy"><div class="eyebrow">AI CREATION SPACE</div><h1 class="display-title small">把一个想法，做成能听、能看、能读、能运行的作品。</h1>${techRule}<p class="lead">依据人工智能课程内容，孩子在清晰任务中描述、生成、比较、修改与表达。标题尺度收敛，按钮文字采用高对比度。</p></div><div class="ai-hero-source"><img src="${ROOT}page-19.jpg" alt="人工智能课程体系" /></div></section>
        <section class="tool-strips">
          <article class="tool-strip"><span class="tool-no">01</span><div><h3>AI 音乐</h3><p>从主题、情绪与节奏出发，生成并继续修改音乐作品。</p></div><span class="source-tag">声音表达 · 创作过程</span><a class="start">开始创作 →</a></article>
          <article class="tool-strip"><span class="tool-no">02</span><div><h3>AI 绘画</h3><p>描述主体、构图与风格，比较结果并形成自己的视觉叙事。</p></div><span class="source-tag">图像表达 · 迭代判断</span><a class="start">开始创作 →</a></article>
          <article class="tool-strip"><span class="tool-no">03</span><div><h3>AI 编程</h3><p>把问题拆成步骤，在运行、观察和调试中理解程序。</p></div><span class="source-tag">逻辑表达 · 运行反馈</span><a class="start">开始创作 →</a></article>
          <article class="tool-strip"><span class="tool-no">04</span><div><h3>AI 阅读</h3><p>导入文章与教师要求，形成结构化理解与阅读引导。</p></div><span class="source-tag">文本理解 · 学习引导</span><a class="start">开始创作 →</a></article>
        </section>
        <section class="section blueprint compact"><div class="section-heading"><div><div class="eyebrow">CREATE → REVIEW → IMPROVE</div><h2>AI 是创作工具，判断仍由孩子完成</h2></div><p>工作台统一采用“输入—生成—比较—修改—保存”的学习闭环，并提供清楚的空状态、处理中状态、失败反馈与历史作品。</p></div></section>
        ${footer()}
      </div>`
  },
  {
    id: "music", title: "AI 音乐 · 工作台", sources: "手册 P19–20 · 当前真实功能", render: () => workspace("AI 音乐创作", "声音实验台", "从主题和情绪出发，写下你想听见的音乐。", "music")
  },
  {
    id: "paint", title: "AI 绘画 · 工作台", sources: "手册 P19–20 · 当前真实功能", render: () => workspace("AI 绘画创作", "视觉实验台", "描述主体、构图、颜色和画面氛围。", "paint")
  },
  {
    id: "code", title: "AI 编程 · 工作台", sources: "手册 P11–15 / P19–20 · 当前真实功能", render: () => workspace("AI 编程创作", "逻辑实验台", "把问题写清楚，再运行、观察与调试。", "code")
  },
  {
    id: "read", title: "AI 阅读 · 工作台", sources: "手册 P19–20 · 当前真实功能", render: () => workspace("AI 阅读助手", "阅读实验台", "导入文章和学习要求，开始结构化阅读。", "read")
  },
  {
    id: "cooperation", title: "校园合作", sources: "手册 P65–67", render: () => publicPage("校园合作", "让科创课程，进入真实校园与课堂。", "依据手册呈现合作学校、课堂实践和合作沟通，不虚构校名或合作数字。", "page-66.jpg", `
      <section class="section"><div class="section-heading"><div><div class="eyebrow">COOPERATION MODEL</div><h2>从课程共建到课堂落地</h2></div><p>课程方案、师资支持、课堂实施、作品展示与持续复盘形成完整合作链路。</p></div><div class="method-flow"><article><span class="big-no">01</span><h3>需求与课程匹配</h3><p>结合学段、课时和学校科创教育目标明确课程入口。</p></article><article><span class="big-no">02</span><h3>课堂与项目实施</h3><p>围绕真实项目开展搭建、编程、测试和表达。</p></article><article><span class="big-no">03</span><h3>成果与长期成长</h3><p>通过作品、活动与进阶路径持续记录学生成长。</p></article></div></section>
      <section class="section blueprint"><div class="section-heading"><div><div class="eyebrow">SCHOOL PARTNERS · P65</div><h2>手册收录的合作学校</h2></div><p>正式实施时仅使用手册第 65 页中可准确识别并获准展示的校徽，不生成、不替换、不编造。</p></div><div class="logo-source"><img src="${ROOT}page-65.jpg" alt="合作学校来源页" /></div></section>`)
  },
  {
    id: "events", title: "科创活动", sources: "手册 P55–61", render: () => publicPage("科创活动", "让作品走出课堂，在真实任务中接受检验。", "赛事内容与参赛案例只采用手册 P55–61 可核对资料；预览先展示完整信息架构。", "page-55.jpg", `
      <section class="section"><div class="section-heading"><div><div class="eyebrow">EVENT MAP</div><h2>重点赛事与活动入口</h2></div><p>按赛事、学段、方向与准备阶段组织，避免把所有内容堆成相同卡片。</p></div><div class="event-list"><article class="event-item"><b>P56</b><div><h3>重点比赛与参赛案例 01</h3><p>名称、赛项、照片与成果将逐项按手册原文核验。</p></div><span>查看活动说明与准备路径 →</span></article><article class="event-item"><b>P57–58</b><div><h3>重点比赛与参赛案例 02</h3><p>页面承接赛事背景、适合方向、参与过程与真实资料。</p></div><span>查看活动说明与准备路径 →</span></article><article class="event-item"><b>P59–61</b><div><h3>重点比赛与参赛案例 03</h3><p>不新增无法由手册证明的获奖人数、名次或学校。</p></div><span>查看活动说明与准备路径 →</span></article></div></section>
      <section class="section blueprint"><div class="section-heading"><div><div class="eyebrow">BEFORE THE EVENT</div><h2>从兴趣、作品到参赛表达</h2></div><p>选定方向 → 项目准备 → 反复测试 → 展示表达；让活动成为课程成长路径的一部分。</p></div><div class="stages"><article><b>01</b><h3>方向匹配</h3><p>依据兴趣、年级与已有作品选择适合入口。</p></article><article><b>02</b><h3>项目训练</h3><p>把赛事要求转化为可执行的学习任务。</p></article><article><b>03</b><h3>测试优化</h3><p>记录问题，迭代结构、程序与表达。</p></article><article><b>04</b><h3>现场展示</h3><p>说明作品目标、过程、证据和改进。</p></article></div></section>`)
  },
  {
    id: "growth", title: "学员成长", sources: "手册 P07–09 / P62–64", render: () => publicPage("学员成长", "成长不只是一张证书，而是越来越完整的创造能力。", "荣誉、证书、英才计划、强基计划与小研究员内容均严格回溯手册。", "page-62.jpg", `
      <section class="section"><div class="section-heading"><div><div class="eyebrow">GROWTH PATH</div><h2>从作品积累，到研究能力</h2></div><p>用可解释的成长路径承接荣誉内容，避免单纯铺满奖状；真实姓名、奖项与证书仅在授权范围内展示。</p></div><div class="growth-path"><article><b>P07–09</b><h3>作品与荣誉</h3><p>以真实课程作品、证书和研发成果为依据，建立可核验的成长档案。</p></article><article><b>P62–63</b><h3>英才计划与强基计划</h3><p>呈现手册中的规划内容、适合阶段和长期准备方向。</p></article><article><b>P64</b><h3>小研究员</h3><p>从问题意识、资料阅读、实验记录走向更完整的研究表达。</p></article></div></section>
      <section class="section blueprint"><div class="section-heading"><div><div class="eyebrow">EVIDENCE OF LEARNING</div><h2>看见过程，也看见结果</h2></div><p>成长页将以“问题—探索—作品—表达—复盘”组织真实案例；当前预览不虚构任何学员故事。</p></div><div class="logo-source"><img src="${ROOT}page-64.jpg" alt="小研究员手册来源页" /></div></section>`)
  },
  {
    id: "consult", title: "课程咨询", sources: "手册 P39–40 / P67", render: () => publicPage("课程咨询", "先理解孩子，再选择课程。", "咨询页依据手册课程选择与项目式学习内容，不用营销话术替代真实判断。", "page-39.jpg", `
      <section class="section"><div class="consult-grid"><div><div class="eyebrow">COURSE CONSULTATION</div><h2 class="display-title small">用四个问题，找到合适的学习入口。</h2>${techRule}<div class="consult-steps"><article><b>01</b><div><h3>孩子目前几年级？</h3><p>对应手册 P43–46 的阶段课程与年龄范围。</p></div></article><article><b>02</b><div><h3>更喜欢哪类创造？</h3><p>编程、建模、AI、无人机、机器人或综合科创。</p></div></article><article><b>03</b><div><h3>已有怎样的学习经验？</h3><p>了解工具经验、项目经历与表达习惯。</p></div></article><article><b>04</b><div><h3>希望解决什么问题？</h3><p>兴趣探索、系统进阶、作品实践或长期规划。</p></div></article></div></div><form class="consult-form"><h3>留下信息，获取课程建议</h3><div class="field"><label>学生年级</label><input placeholder="请选择当前年级" /></div><div class="field"><label>感兴趣的方向</label><input placeholder="请选择或填写课程方向" /></div><div class="field"><label>联系电话</label><input placeholder="用于课程老师联系" /></div><div class="field"><label>补充说明</label><textarea placeholder="可以写下孩子的兴趣或已有经验"></textarea></div><button type="button" class="generate-btn orange">提交咨询</button></form></div></section>
      <div class="contact-bar"><div><b>浦北路教学点</b><span>徐汇区浦北路 1077 号 2 楼</span></div><div><b>龙文路教学点</b><span>上海市徐汇区龙文路 69 号 2 层</span></div><div><b>咨询电话</b><span>19921536568</span></div></div>`)
  },
  {
    id: "about", title: "走进科瑞特", sources: "手册 P02–09 / P36–42 / P65–67", render: () => publicPage("走进科瑞特", "科创五育，创智先行。", "品牌介绍、政策背景、专家顾问、研发资质、教学方法与联系信息均来自手册。", "page-05.jpg", `
      <section class="section"><div class="about-grid"><div><div class="eyebrow">ABOUT CREATE · P05</div><h2>关于我们</h2>${techRule}</div><div class="about-copy"><p>品牌介绍区将逐字采用手册第 5 页已确认的机构介绍与资质内容，并与第 3–4 页的科创教育背景建立清晰但不过度技术化的阅读顺序。</p><p>网站公开文案只保留家长和学校真正需要理解的信息：我们是谁、如何教、孩子如何成长、怎样开始咨询。</p></div></div></section>
      <section class="expert-band"><img src="${ROOT}page-06.jpg" alt="专家顾问来源页" /><div><span class="source-tag" style="color:#ff9b73">EXPERT ADVISOR · P06</span><h3>专家顾问</h3><p>徐鸿涛博士相关身份与介绍将在正式页面中按手册第 6 页原文核验呈现，不扩写未经资料支持的履历。</p><a class="outline-btn">了解课程研发方法</a></div></section>
      <section class="section blueprint"><div class="section-heading"><div><div class="eyebrow">EDUCATION METHOD</div><h2>五育融合与工程思维</h2></div><p>三层培养维度、课程梯度、项目式学习、五育融合与工程思维来自手册 P37–42，在这里形成品牌方法论总览。</p></div><div class="method-flow"><article><span class="big-no">01</span><h3>理解</h3><p>建立知识、工具与真实问题之间的联系。</p></article><article><span class="big-no">02</span><h3>实践</h3><p>在制作、测试和修改中形成工程经验。</p></article><article><span class="big-no">03</span><h3>表达</h3><p>说明作品目标、过程、证据和进一步设想。</p></article></div></section>`)
  },
  {
    id: "auth", title: "登录 / 注册", sources: "产品功能 · 品牌语汇来自锁定母版", render: () => `
      <div class="auth-page"><section class="auth-story"><img src="${LOGO}" alt="科瑞特" /><div><div class="eyebrow" style="color:#ffb091">CREATE · LEARN · GROW</div><h2>回到你的作品与学习记录。</h2><p>登录注册采用安静、清楚的产品界面方法；不套用营销页大构图，也不使用黑底、荧光描边或低对比文本。</p>${techRule}</div></section><section class="auth-form-wrap"><form class="auth-form"><div class="eyebrow">MEMBER ACCESS</div><h1>欢迎回来</h1><p>登录后继续你的课程、作品与创作记录。</p><div class="auth-tabs"><span class="active">验证码登录</span><span>密码登录</span></div><div class="field"><label>手机号</label><input placeholder="请输入手机号" /></div><div class="field"><label>验证码</label><input placeholder="请输入验证码" /></div><button type="button" class="generate-btn">登录</button><p>还没有账号？<strong style="color:var(--blue)">立即注册</strong></p></form></section></div>`
  }
];

function workspace(title, lab, intro, type) {
  const fields = type === "read" ? `
    <div class="field"><label>导入文章 <span>必填</span></label><textarea placeholder="粘贴需要阅读的文章或故事原文……"></textarea></div>
    <div class="field"><label>教师要求 <span>选填</span></label><textarea placeholder="填写学习重点，也可上传 txt / md / docx 文件"></textarea></div>
    <div class="chips"><span>提炼结构</span><span>关键词</span><span>理解问题</span><span>表达练习</span></div>` : type === "code" ? `
    <div class="field"><label>你想解决的问题 <span>必填</span></label><textarea placeholder="例如：做一个能根据温度变化提醒的小程序……"></textarea></div>
    <div class="field"><label>编程语言 <span>请选择</span></label><div class="chips"><span>Scratch 思路</span><span>Python</span><span>C++</span></div></div>
    <div class="field"><label>已有代码 <span>选填</span></label><textarea placeholder="可以粘贴已有代码，继续解释或调试"></textarea></div>` : type === "paint" ? `
    <div class="field"><label>创意描述 <span>必填</span></label><textarea placeholder="描述主体、场景、构图、颜色和画面氛围……"></textarea></div>
    <div class="field"><label>画面风格 <span>选填</span></label><div class="chips"><span>工程草图</span><span>科幻插画</span><span>自然观察</span><span>3D 模型</span></div></div>
    <div class="field"><label>生成比例 <span>选择</span></label><div class="chips"><span>1:1</span><span>16:9</span><span>9:16</span><span>4:3</span></div></div>` : `
    <div class="field"><label>歌词或主题 <span>0 / 3500 字</span></label><textarea placeholder="写下主题或歌词；留空时也可以依据风格生成……"></textarea></div>
    <div class="field"><label>音乐风格 <span>0 / 2000 字</span></label><textarea placeholder="描述情绪、速度、乐器与声音感觉……"></textarea><div class="chips"><span>电影感</span><span>女声</span><span>钢琴</span><span>律动</span><span>流行</span></div></div>
    <div class="field"><label>歌名 <span>选填</span></label><input placeholder="给作品起一个名字" /></div>`;

  const stage = type === "read" ? `<div class="reader-stage"><aside class="reader-index"><strong>阅读结构</strong><span>01 文章概要</span><span>02 关键词</span><span>03 理解问题</span><span>04 表达练习</span></aside><article class="reader-content"><h3>分析结果</h3><p>导入文章后，这里以清晰的结构呈现概要、线索与问题。文字保持深色高对比，长内容在右侧独立滚动。</p><p>空状态、分析中、失败与完成状态使用同一套视觉反馈。</p></article></div>` : type === "code" ? `<div class="code-stage"><div class="code-editor"># 代码与解释区<br><br>def create_project(idea):<br>&nbsp;&nbsp;&nbsp;&nbsp;steps = plan(idea)<br>&nbsp;&nbsp;&nbsp;&nbsp;return run(steps)<br><br># 运行后继续观察和调试</div><div class="code-preview"><div><strong>运行预览</strong><p>程序结果与错误提示</p></div></div></div>` : type === "paint" ? `<div class="result-stage paint-canvas"></div>` : `<div class="result-stage music"><div><div class="wave"></div><strong>作品将在这里出现</strong><p>生成后可试听、比较、保存与继续修改</p></div></div>`;

  return `<div class="workspace-page"><header class="workspace-topbar"><img src="${LOGO}" alt="科瑞特" /><h1>${title}</h1><span>${lab}</span><span class="source-tag">教育依据：手册 P19–20</span></header><main class="workspace-shell"><section class="workspace-panel"><div class="workspace-panel-head"><strong>创作设置</strong><span>草稿自动保存</span></div><div class="workspace-form"><p style="margin:0;color:#66728c;font-size:12px">${intro}</p>${fields}<button class="generate-btn ${type === "paint" ? "orange" : ""}">开始${type === "read" ? "分析" : "生成"}</button></div></section><section class="workspace-panel result-panel"><div class="workspace-panel-head"><strong>${type === "read" ? "阅读结果" : "当前作品"}</strong><span>历史作品　收藏</span></div>${stage}<div class="result-actions"><span class="equal-note">左右等宽 · 核心操作一屏完成</span><a class="text-btn">查看历史</a></div></section></main></div>`;
}

function publicPage(kicker, title, lead, image, content) {
  return `<div class="site-page">${header()}<section class="page-hero"><div class="page-hero-copy"><div class="eyebrow">${kicker}</div><h1 class="display-title small">${title}</h1>${techRule}<p class="lead">${lead}</p></div><div class="page-hero-visual"><img src="${ROOT}${image}" alt="${kicker}手册来源页" /></div></section>${content}${footer()}</div>`;
}

const nav = document.querySelector("#pageNav");
const pageSelect = document.querySelector("#pageSelect");
const artboard = document.querySelector("#artboard");
const title = document.querySelector("#pageTitle");
const source = document.querySelector("#pageSources");
const index = document.querySelector("#pageIndex");

pages.forEach((page, i) => {
  const button = document.createElement("button");
  button.innerHTML = `<span>${String(i + 1).padStart(2, "0")}</span><strong>${page.title}</strong>`;
  button.addEventListener("click", () => showPage(i));
  nav.appendChild(button);
  const option = document.createElement("option");
  option.value = String(i);
  option.textContent = `${String(i + 1).padStart(2, "0")} · ${page.title}`;
  pageSelect.appendChild(option);
});

function showPage(i) {
  const page = pages[i];
  title.textContent = page.title;
  source.textContent = page.sources;
  index.textContent = `${String(i + 1).padStart(2, "0")} / ${String(pages.length).padStart(2, "0")}`;
  pageSelect.value = String(i);
  artboard.innerHTML = page.render();
  nav.querySelectorAll("button").forEach((button, j) => button.classList.toggle("is-active", i === j));
  document.querySelector(".stage").scrollTo({ top: 0, behavior: "smooth" });
  history.replaceState(null, "", `#${page.id}`);
}

pageSelect.addEventListener("change", event => showPage(Number(event.target.value)));

document.querySelectorAll(".viewport-switch button").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".viewport-switch button").forEach(b => b.classList.remove("is-active"));
    button.classList.add("is-active");
    artboard.classList.toggle("is-mobile", button.dataset.width === "mobile");
  });
});

const initial = Math.max(0, pages.findIndex(page => `#${page.id}` === location.hash));
showPage(initial);
