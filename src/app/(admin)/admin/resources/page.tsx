import Link from "next/link";
import { ArrowRight, BookOpen, ImageIcon, LayoutPanelTop, LibraryBig, MonitorCog, Sparkles } from "lucide-react";

const groups = [
  {
    title: "课程与学习",
    copy: "维护课程结构、课时、课件与报名关系。",
    items: [
      ["课程管理", "编辑课程基础信息、发布状态与封面", "/admin/courses"],
      ["课程分类", "维护课程方向与展示顺序", "/admin/course-categories"],
      ["课时与工具", "配置模块、课时和 AI 工具绑定", "/admin/curriculum"],
      ["课件管理", "上传、整理与发布学习课件", "/admin/courseware"],
      ["AI 阅读课文库", "上传课文、AI 拆分场景并生成课程封面", "/admin/reading-lessons"],
      ["报名管理", "查看学员报名与学习访问关系", "/admin/enrollments"],
    ],
    icon: BookOpen,
  },
  {
    title: "主站内容",
    copy: "维护公开展示的活动、成果、师资、校区与合作内容。",
    items: [
      ["内容条目", "编辑主站内容与关联素材", "/admin/content"],
      ["页面区块", "调整首页与专题页面的文字、排序和发布状态", "/admin/site-pages"],
      ["AI 工具目录", "维护工具展示、启停与运营文案", "/admin/ai-tools"],
      ["咨询线索", "跟进课程与校园合作咨询", "/admin/inquiries"],
    ],
    icon: LibraryBig,
  },
];

export default function AdminResourcesPage() {
  return <main className="resource-workspace">
    <header className="resource-hero">
      <div>
        <Link href="/admin" className="resource-back">← 返回运营工作台</Link>
        <h1>平台资源工作面板</h1>
        <p>从一个工作区完成主站内容与学习资源的添加、替换、发布和检查；不再需要在零散入口之间查找。</p>
      </div>
      <div className="resource-hero-art" aria-hidden="true"><Sparkles /><span>内容更新<br />工作流</span></div>
    </header>

    <section className="resource-primary" aria-labelledby="resource-primary-title">
      <div className="resource-section-heading"><span>素材与版位</span><h2 id="resource-primary-title">先上传，再绑定，再发布</h2><p>素材库只负责保存资源；页面媒体位负责把资源准确替换到主站版位。</p></div>
      <div className="resource-actions">
        <Link href="/admin/media" className="resource-action"><ImageIcon /><div><strong>媒体资源库</strong><span>上传图片或视频，补全替代文本和授权说明。</span></div><ArrowRight /></Link>
        <Link href="/admin/media-slots" className="resource-action"><MonitorCog /><div><strong>调整平台资源</strong><span>为首页、课程页等主站版位绑定或替换桌面与移动素材。</span></div><ArrowRight /></Link>
        <Link href="/admin/site-pages" className="resource-action"><LayoutPanelTop /><div><strong>页面区块与版本</strong><span>更新文案、排序与发布状态；每次保存均保留可恢复版本。</span></div><ArrowRight /></Link>
      </div>
    </section>

    <section className="resource-groups" aria-label="运营功能分类">
      {groups.map(({ title, copy, items, icon: Icon }) => <section className="resource-group" key={title}>
        <div className="resource-group-title"><Icon /><div><h2>{title}</h2><p>{copy}</p></div></div>
        <div className="resource-list">{items.map(([label, description, href]) => <Link key={href} href={href}><div><strong>{label}</strong><span>{description}</span></div><ArrowRight size={18} /></Link>)}</div>
      </section>)}
    </section>
  </main>;
}
