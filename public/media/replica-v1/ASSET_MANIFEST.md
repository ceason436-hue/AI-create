# 科瑞特 AI 精确复刻资源清单（replica-v1）

本目录是“生成效果图”到网页实现之间的正式媒体资源层。公开页面的 Logo、导航栏与页脚继续使用项目现有组件；其余非交互展示区域优先使用这里的 PNG，以避免浏览器代码绘制与已确认效果图产生视觉偏差。

## 使用边界

- 来源：已确认的页面生成效果图，以及基于手册事实和已确认视觉方向重新生成的连续绘本画面。
- 未直接引用《AI 科瑞特手册》的原始图片。
- `home`、`courses`、`tools`、`cooperation`、`activities`、`growth`、`consult`、`about` 中的图片是页面分区静态视觉；链接和表单由网页叠加真实交互。
- `music`、`art`、`coding`、`reading` 中的图片只承担结果预览、示例或流程图展示；输入、生成、保存、下载、历史记录和页面跳转保持真实交互。
- 图片不应被标注为真实获奖、真实学校合作或真实学员个人记录；事实表述仍以项目资料为准。

## 公开页面分区

- 首页：`home/hero.png`、`journey.png`、`curriculum.png`、`growth-ladder.png`、`pbl.png`、`topics.png`、`activities.png`、`cooperation.png`、`cta.png`
- 课程体系：`courses/hero.png`、`six-directions.png`、`panorama.png`、`ladder.png`、`themes.png`、`pbl-and-works.png`、`cta.png`
- AI 创作空间：`tools/hero.png`、`tool-shelves.png`、`create-loop.png`、`work-growth.png`、`course-map.png`、`responsible-ai.png`、`gallery.png`、`cta.png`
- 校园合作：`cooperation/hero.png`、`path.png`、`modes.png`、`matrix.png`、`class-process.png`、`space-support.png`、`projects.png`、`logos-cta.png`
- 科创活动：`activities/hero.png`、`stages-timeline.png`、`catalogue.png`、`checklist.png`、`process.png`、`scenes.png`、`cta.png`
- 学员成长：`growth/hero.png`、`radar-archive.png`、`evidence.png`、`certificates.png`、`pathways.png`、`research-flow.png`、`cta.png`
- 课程咨询：`consult/hero.png`、`four-facts.png`、`direction-map.png`、`compare-form.png`、`compare-left.png`、`pbl-faq-contact.png`
- 走进科瑞特：`about/hero.png`、`facts-philosophy.png`、`timeline-contact.png`
- 登录注册：`auth/maker-desk-side-v1.png`（重新生成的科创工作台背景；真实登录与注册表单位于右侧）

## AI 工作台资源

- AI 音乐：`music/empty-state.png`、`example-result.png`、`process-strip.png`
- AI 绘画：`art/main-result.png`、`result-thumbnails.png`、`process-strip.png`
- AI 编程：`coding/maze-result.png`、`flowchart.png`、`process-strip.png`
- AI 阅读参考：`reading/guide-rail.png`、`apple-scene-reference.png`、`continuity-strip-reference.png`
- AI 阅读连续绘本：`reading/story-frame-01.png` 至 `story-frame-06.png`

## 响应式策略

- 桌面端：各分区按效果图原始顺序无缝拼接，并按容器宽度等比缩放。
- 移动端：分区保持原始比例和顺序，不裁掉事实内容；真实表单和工具控制区改为单列。
- 所有叠加链接保留键盘焦点；所有真实输入保留加载、错误、成功和禁用状态。
