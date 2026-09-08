# 科瑞特 AI 全站可复用媒体资源计划（site-v3）

## 实现原则

- 效果图只用于视觉对照，不作为网页背景、整屏图片或页面切片。
- 文本、按钮、表单、导航、表格、列表、选项卡和交互状态全部使用 React/HTML/CSS 实现。
- 真实照片感场景、复杂插画与结果预览使用高清 PNG；结构图、流程图、雷达图、时间线和装饰线使用独立 SVG。
- PNG 不内嵌网页文案和按钮；SVG 中只保留必要的短标签，长文案由网页排版。
- PDF 手册只提供事实、课程范围与主题参考，不直接复制其原始图片。
- Logo、公共导航和公共页脚继续使用项目已有组件与资源。

## 逐页资源拆解

### 01 首页

- `home/hero-maker-studio-v1.png`：首屏真实创作场景。
- `home/path-interest-v1.png`、`path-learn-v1.png`、`path-build-v1.png`、`path-present-v1.png`：四阶段学习路径照片。
- 已完成：`home/coding-interface.svg`、`modeling-interface.svg`、`ai-dashboard.svg`。
- 已完成：`hardware-drone-v2.png`、`hardware-3d-printer-v2.png`、`hardware-robot-controller-v2.png`、`hardware-agri-sensor-v2.png`；均使用统一暖白底与独立安全留白，避免伪透明棋盘底。
- 已完成：课程主题项目横向场景图，归档在 `courses/smart-agriculture-class-v2.png` 与 `herbal-science-class-v2.png`。
- 复用 SVG：`diagrams/course-six-directions.svg`、`course-ladder.svg`、`pbl-cycle.svg`、`shared/blueprint-grid.svg`、`shared/orange-dot-matrix.svg`。

### 02 课程体系

- `courses/course-programming-v1.png`、`course-3d-v1.png`、`course-ai-v1.png`、`course-drone-v1.png`、`course-robotics-v1.png`、`course-innovation-v1.png`：六大方向照片。
- `courses/smart-agriculture-system-v1.png`、`herbal-iot-project-v1.png`：跨学科主题项目。
- 已完成：`course-collaboration-hero-v2.png` 与 `outcome-*-v2.png` 四张课程成果图。
- 复用 SVG：六方向关系图、年龄进阶阶梯、PBL 循环。

### 03 AI 创作空间

- `tools/creator-lab-overview-v1.png`：总览首屏。
- `tools/tool-music-v1.png`、`tool-art-v1.png`、`tool-code-v1.png`：三类工具场景。
- 已完成：`tools/reading-creation-scene-v2.png`、音乐/绘画/编程对应场景图；四张场景亦作为作品画廊素材。
- 复用 SVG：`diagrams/ai-creation-loop.svg`、`learning-path.svg`。

### 04 AI 音乐

- `music/sound-workbench-hero-v1.png`：音乐学习场景。
- 已完成：`night-city-cover-v2.png`、`music-waveform.svg`、`music-empty-state.svg`、`music-process.svg`。

### 05 AI 绘画

- `art/visual-generation-sample-v1.png`：主生成结果。
- 已完成：`classroom-variant-01.png` 至 `04.png`、`style-*-v2.png` 四张风格参考图。
- 已完成：`art-process.svg`。

### 06 AI 编程

- `coding/robot-path-simulation-v1.png`：迷宫运行结果。
- 已完成：`maze-board.svg`、`coding-flowchart.svg`、`coding-process.svg`。

### 07 AI 阅读

- `reading/story-frame-01.png` 至 `story-frame-06.png`：已确认故事的六段连续画面。
- 已完成：`reading-assistant-avatar.svg`、`reading-stages.svg`、`reading-continuity-frame.svg`。

### 08 校园合作

- `cooperation/classroom-concept-v1.png`、`classroom-kit-v1.png`、`maker-space-cutaway-v1.png`：课堂、教具与空间方案。
- 已完成：`regular-class-v2.png`、`maker-club-v2.png`、`theme-workshop-v2.png`、`competition-training-v2.png`、`teacher-development-v2.png`、`student-presentation-v2.png`。
- 复用 SVG：`diagrams/cooperation-delivery.svg`。

### 09 科创活动

- `activities/prototype-testing-v1.png`、`workshop-process-v1.png`：测试与工作坊过程。
- 已完成：`competition-prep-v2.png`、`team-collaboration-v2.png`、`public-presentation-v2.png`、`prototype-iteration-v2.png`。
- 复用 SVG：`diagrams/event-prep-loop.svg`；已完成 `activity-year-timeline.svg`。

### 10 学员成长

- `growth/evidence-flatlay-v1.png`、`project-review-v1.png`：成长证据与项目复盘。
- 已完成：`student-presentation-v2.png`、`prototype-evolution-v2.png`、`mentor-review-v2.png`、`evidence-archive-v2.png`。
- 复用 SVG：`diagrams/growth-five-dimensions.svg`；已完成 `growth-research-path.svg`。

### 11 课程咨询

- `consult/family-course-dialogue-v1.png`：家长、孩子与教师交流场景。
- 复用 SVG：`diagrams/consult-course-map.svg`、`pbl-cycle.svg`。
- 已完成：`consult-four-factors.svg`。

### 12 走进科瑞特

- `about/maker-studio-overview-v1.png`、`curriculum-research-flatlay-v1.png`：工作室与课程研发场景。
- 已完成：`about-philosophy.svg`、`about-timeline.svg`、`about-map-pins.svg`。

### 13 登录注册

- `auth/maker-desk-side-v1.png`：登录页左侧科创工作台背景。
- 已完成：`auth-engineering-callouts.svg`。

## 资源状态说明

- `*-atlas-source.png` 只作为生成源图与追溯依据，页面禁止直接引用。
- `home/hardware-atlas-source.png` 及旧 `*-cutout.png` 含伪透明棋盘背景，标记为 **rejected**，页面禁止引用。
- 页面可引用资源以 `ASSET_MANIFEST.md` 的 `ready` 状态为准。

## 资源验收

- PNG：可正常解码；主视觉短边不低于 1024 像素；缩略图短边不低于 512 像素。
- SVG：独立 `viewBox`，无外部字体或远程资源依赖，缩放后线条清晰。
- 透明底资源：四周不裁切主体，保留安全留白。
- 同组人物、服装、教室色温与品牌色保持一致；不生成可识别的真实学校、奖项、证书或合作 Logo。
- 每项资源在 `ASSET_MANIFEST.md` 中记录用途、页面和替代文本。
