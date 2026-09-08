export function CourseCreateFields({ categories }: { categories: Array<Record<string, unknown>> }) {
  return <>
    <label>课程分类<select name="categoryId" required><option value="">选择分类</option>{categories.map((category) => <option key={String(category.id)} value={String(category.id)}>{String(category.name)}</option>)}</select></label>
    <label>课程名称<input name="name" required maxLength={180} /></label>
    <label>Slug<input name="slug" required pattern="[a-z0-9-]+" placeholder="例如 ai-creation" /></label>
    <label>一句话介绍<textarea name="shortDescription" required maxLength={500} /></label>
    <label>公开详细介绍<textarea name="fullDescription" maxLength={20_000} /></label>
    <label>适合人群与先修要求<input name="targetAudience" maxLength={500} placeholder="例如：小学三至六年级，有动手创作兴趣" /></label>
    <label>年龄/年级范围<input name="gradeRange" maxLength={80} placeholder="例如：小学三至六年级" /></label>
    <label>难度<select name="difficulty" defaultValue="基础"><option>启蒙</option><option>基础</option><option>进阶</option><option>竞赛</option><option>项目制</option></select></label>
    <label>授课方式<textarea name="deliveryModes" maxLength={300} defaultValue="线下" placeholder="多个方式用逗号或换行分隔，例如：线下，校内合作" /></label>
    <label>课时/学习周期<input name="durationText" maxLength={80} placeholder="例如：8 次课 / 16 小时" /></label>
    <label>招生状态<select name="enrollmentStatus" defaultValue="OPEN"><option value="OPEN">招生中</option><option value="COMING_SOON">即将开课</option><option value="FULL">已满班</option><option value="CONSULT">欢迎咨询</option><option value="ARCHIVED">展示归档</option></select></label>
    <label>课程封面媒体 ID<input name="coverAssetId" maxLength={128} placeholder="先从媒体库复制资源 ID" /></label>
    <label>发布状态<select name="publishStatus" defaultValue="DRAFT"><option>DRAFT</option><option>REVIEW</option><option>PUBLISHED</option></select></label>
    <p className="admin-form-note">课程可先保存为草稿，再在“课程结构与工具绑定”中新增并发布模块/课时。发布课程时，服务端会检查适合人群、封面和已发布模块。</p>
  </>;
}
