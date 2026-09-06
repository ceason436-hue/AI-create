import Image from "next/image";
import {BookOpen,Compass,Heart,MapPin,Phone,School,Target,Users} from "lucide-react";
import s from "./reference-consult.module.css";
const stages=[
  ["阶段定位","兴趣启蒙","能力进阶","项目提升","创新研究"],
  ["学习重点","工具与规则、趣味搭建","结构编程、任务解决","跨学科设计与数据","课题研究与公开表达"],
  ["能力培养","好奇心、动手力","逻辑思维、协作力","工程迭代、解决力","研究力、创新表达"],
  ["典型成果","可运行的小作品","完整课程项目","竞赛或主题项目","研究报告与实物成果"],
  ["学习方式","模仿体验、即时反馈","任务挑战、小组协作","PBL项目、测试优化","自主选题、导师指导"]
];
export function ReferenceConsult({form}:{form:React.ReactNode}){return <main className={s.page}>
  <section className={s.hero}><Image src="/media/site-v3/consult/family-course-dialogue-v1.png" alt="家长孩子与老师沟通课程" fill priority/><div><small>课程咨询 · 学习规划</small><h1>先理解孩子，<br/>再选择课程。</h1><i/><p>从兴趣、年龄、经验与目标出发，<br/>匹配适合的课程方向和项目路径。</p></div></section>
  <section><h2><b>1</b>四步了解孩子，找到更合适的课程方向</h2><div className={s.four}>{[{i:School,t:"当前阶段",c:"孩子目前所处的年级与学习阶段"},{i:Heart,t:"兴趣方向",c:"最愿意持续探索的科技主题"},{i:BookOpen,t:"已有经验",c:"搭建、编程或项目实践基础"},{i:Target,t:"学习目标",c:"兴趣启蒙、能力提升或成果表达"}].map(({i:Icon,t,c},n)=><article key={t}><span>{String(n+1).padStart(2,"0")}</span><Icon/><div><h3>{t}</h3><p>{c}</p></div></article>)}</div></section>
  <section><h2><b>2</b>课程体系与方向地图：找到孩子的热爱与擅长</h2><Image className={s.mapImage} src="/media/reference-v4/hd/consult-course-map.svg" width={1500} height={470} alt="六大课程方向依据兴趣、年龄、经验和目标匹配四类课程形态"/><div className={s.mapNotes}><p><Users/>先选 1—2 个真正感兴趣的方向</p><p><Compass/>再按年级和已有经验确定起点</p><p><Target/>每个阶段都用真实项目验证成长</p></div></section>
  <section className={s.split}><div><h2><b>3</b>阶段目标与能力培养对照表</h2><table><thead><tr><th>比较项目</th><th>科创体验<br/>2—3年级</th><th>科创成长<br/>4—5年级</th><th>科创发明家<br/>6—7年级</th><th>科创小院士<br/>7年级以上</th></tr></thead><tbody>{stages.map(row=><tr key={row[0]}>{row.map((cell,i)=>i===0?<th key={cell}>{cell}</th>:<td key={cell}>{cell}</td>)}</tr>)}</tbody></table><h2><b>4</b>项目式学习的核心价值</h2><Image className={s.valueDiagram} src="/media/reference-v4/hd/consult-pbl-values.svg" width={1080} height={680} alt="项目式学习围绕创造能力形成七项核心价值"/></div><div><h2><b>5</b>获取一对一课程建议</h2><p className={s.formIntro}>填写孩子的年级、兴趣和目标，课程顾问将据此提供起点建议。</p><div className={s.form}>{form}</div></div></section>
  <section className={s.bottom}><div><h2><b>6</b>常见问题</h2>{[["课程如何分班？","综合年级、已有经验与课堂观察分班，首次到访可先做体验和沟通。"],["没有基础可以学习吗？","可以。低龄与初学课程从工具安全、结构认知和图形化任务开始。"],["需要额外购买设备吗？","常规课堂器材由课程配套，个别长期项目会提前说明材料需求。"],["如何了解学习进度？","通过作品、过程记录、测试数据与阶段展示共同反馈。"]].map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div><div><h2><b>7</b>联系我们</h2><p><School/>AI科瑞特青少儿科创机器人编程</p><p><MapPin/>徐汇区浦北路1077号2楼</p><p><MapPin/>上海市徐汇区龙文路69号2层</p><p className={s.phone}><Phone/>19921536568</p></div></section>
</main>}
