export type CourseTrack = {
  slug: string;
  name: string;
  english: string;
  intro: string;
  image: string;
  age: string;
  outcome: string;
  topics: string[];
};

export type PathwayCourse = {
  slug: string;
  name: string;
  grade: string;
  label: string;
  statement: string;
  rhythm: string;
  stages: string[];
  outcomes: string[];
};

export const courseTracks: CourseTrack[] = [
  {
    slug: "programming",
    name: "编程",
    english: "Programming",
    intro: "从图形化指令到程序逻辑，让孩子用代码控制角色、装置与真实任务。",
    image: "/media/krt/course-programming.png",
    age: "小学至初中",
    outcome: "互动程序与创意游戏",
    topics: ["图形化编程", "Python 入门", "算法思维"],
  },
  {
    slug: "3d-modeling",
    name: "3D 建模",
    english: "3D Modeling",
    intro: "把纸上的构想转成可制造的数字模型，在尺寸、结构与材料之间反复验证。",
    image: "/media/krt/course-3d.png",
    age: "小学中高年级起",
    outcome: "数字模型与实体零件",
    topics: ["空间认知", "结构设计", "3D 打印"],
  },
  {
    slug: "ai",
    name: "AI 智能",
    english: "Artificial Intelligence",
    intro: "在可理解、可验证的任务里认识人工智能，并把它变成创作与研究工具。",
    image: "/media/krt/course-ai.png",
    age: "小学中高年级起",
    outcome: "AI 创作与智能应用",
    topics: ["生成式 AI", "视觉识别", "数据与模型"],
  },
  {
    slug: "drone",
    name: "无人机",
    english: "Drone",
    intro: "从安全规范、飞行原理到任务编程，理解空中机器如何感知与行动。",
    image: "/media/krt/course-drone.png",
    age: "小学中高年级起",
    outcome: "飞行任务与编队挑战",
    topics: ["飞行原理", "操控训练", "编程任务"],
  },
  {
    slug: "robotics",
    name: "机器人",
    english: "Robotics",
    intro: "把机械、电子、传感器和程序组合起来，让一个想法真正动起来。",
    image: "/media/krt/course-robotics.png",
    age: "二年级起",
    outcome: "可运行的机器人作品",
    topics: ["机械结构", "传感器", "智能控制"],
  },
  {
    slug: "innovation",
    name: "科创",
    english: "Innovation",
    intro: "从生活里的真实问题出发，完成调研、原型、测试、改进与公开表达。",
    image: "/media/krt/course-innovation.png",
    age: "二年级起",
    outcome: "发明原型与研究展示",
    topics: ["项目制学习", "工程思维", "公开表达"],
  },
];

export const pathwayCourses: PathwayCourse[] = [
  {
    slug: "experience",
    name: "科创体验",
    grade: "2—3 年级",
    label: "从会玩到会做",
    statement: "用看得见、摸得着的装置建立最初的工程直觉。",
    rhythm: "两学期 · 每学期 16 次 · 每次 1.5 小时",
    stages: ["器件认知", "编程基础", "传感器基础", "综合项目"],
    outcomes: ["感应式小夜灯", "智能垃圾桶", "智能导盲杖"],
  },
  {
    slug: "growth",
    name: "科创成长",
    grade: "4—5 年级",
    label: "从照着做到主动探究",
    statement: "围绕项目持续提问，开始使用激光切割与 3D 打印完成结构。",
    rhythm: "探究学习 · 项目制作 · 实践基础",
    stages: ["问题发现", "方案草图", "数字制造", "测试改进"],
    outcomes: ["结构模型", "智能装置", "项目过程册"],
  },
  {
    slug: "inventor",
    name: "科创发明家",
    grade: "6—7 年级",
    label: "从项目制作到发明创造",
    statement: "用跨学科知识回应真实问题，让技术方案经得起解释与验证。",
    rhythm: "主题研究 · 原型迭代 · 成果表达",
    stages: ["持续探究", "技术整合", "原型迭代", "公开展示"],
    outcomes: ["发明原型", "研究报告", "路演答辩"],
  },
  {
    slug: "young-scholar",
    name: "科创小院士",
    grade: "7 年级及以上",
    label: "从解决问题到开展研究",
    statement: "围绕数据、健康、社区与环境议题，完成更长期的跨学科研究。",
    rhythm: "课题研究 · 工程实践 · 展示答辩",
    stages: ["课题定义", "资料与数据", "工程验证", "成果答辩"],
    outcomes: ["研究型作品", "完整项目文档", "公开答辩"],
  },
];

export const themeProjects = [
  {
    title: "智慧农业与生态养殖",
    grade: "6 年级及以上",
    description: "结合生态、养殖与信息技术，使用传感器观察水质与环境，理解现代农业系统。",
    keywords: "生态系统 · 传感器 · 数据观察",
  },
  {
    title: "中草药与现代科技",
    grade: "6 年级及以上",
    description: "从种植箱与生长记录开始，引入 AI 与物联网工具，完成研究展示。",
    keywords: "生命科学 · AI · 物联网",
  },
];

export function findPathwayCourse(slug: string) {
  return pathwayCourses.find((course) => course.slug === slug);
}

export function findCourseTrack(slug: string) {
  return courseTracks.find((course) => course.slug === slug);
}
