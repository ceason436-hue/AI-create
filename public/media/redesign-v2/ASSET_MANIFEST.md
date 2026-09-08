# 科瑞特 AI 全站重构资源清单（v2）

本目录服务于已锁定母版的后续一比一开发。内容依据《AI 科瑞特手册》67 页的事实与主题重新创作，不直接复用手册整页或原照片。所有场景图均为中性概念场景，不代表具体学校、教师、学生、赛事或获奖事实。

视觉规范：冷白底、靛蓝 `#1D2F82`、橙色 `#F05A24`、精细工程线与点阵；不使用黑色霓虹、荧光绿、紫色渐变和不规则纸片。

## 使用边界

- 精确品牌 Logo 继续使用项目已有 `public/logo2.png`。
- 合作学校 Logo、证书、人物肖像、赛事标识不得用生成模型仿造；等待授权原件后无损接入。
- 联系二维码继续使用已验证的 `public/media/krt/contact-wechat.png` 与 `contact-official-account.png`。
- AI 阅读专用资源暂不生成；只保留两张待审核页面预览。

## PNG 场景资源

| 路径 | 页面 / 区块 | 手册依据 | 状态 |
| --- | --- | --- | --- |
| `home/hero-maker-studio-v1.png` | 首页首屏 | P1、P38–42 | 可用 |
| `home/path-interest-v1.png` | 兴趣 | P38–42 | 可用 |
| `home/path-learn-v1.png` | 学习 | P37–42 | 可用 |
| `home/path-build-v1.png` | 实践 | P39–42 | 可用 |
| `home/path-present-v1.png` | 表达 | P40、P42 | 可用 |
| `courses/course-programming-v1.png` | 编程课程 | P11–15 | 可用 |
| `courses/course-3d-v1.png` | 3D 建模 | P16–18 | 可用 |
| `courses/course-ai-v1.png` | 人工智能 | P19–20 | 可用 |
| `courses/course-drone-v1.png` | 无人机 | P21–26 | 可用 |
| `courses/course-robotics-v1.png` | 机器人 | P27–35 | 可用 |
| `courses/course-innovation-v1.png` | 综合科创 | P36、P47–48 | 可用 |
| `ai-space/tool-music-v1.png` | AI 音乐入口 | P19–20 + 真实工具 | 可用 |
| `ai-space/tool-art-v1.png` | AI 绘画入口 | P19–20 + 真实工具 | 可用 |
| `ai-space/tool-code-v1.png` | AI 编程入口 | P11–15、P19–20 | 可用 |
| `cooperation/classroom-concept-v1.png` | 校园合作课堂 | P65–66 | 可用，非具名学校 |
| `activities/workshop-process-v1.png` | 科创活动 | P55–61 | 可用，非具名赛事 |
| `growth/project-review-v1.png` | 学员成长 | P7–9、P62–64 | 可用，非获奖证明 |
| `consult/family-course-dialogue-v1.png` | 课程咨询 | P39–40 | 可用 |
| `about/maker-studio-overview-v1.png` | 走进科瑞特 | P5–6、P36–42 | 可用，非真实校区 |
| `courses/smart-agriculture-system-v1.png` | 智能农业主题 | P47 | 可用 |
| `courses/herbal-iot-project-v1.png` | 中草药与现代科技 | P48 | 可用 |
| `ai-space/creator-lab-overview-v1.png` | AI 创作空间总览 | P11–20 + 真实工具 | 可用，不含阅读专用画面 |
| `cooperation/maker-space-cutaway-v1.png` | 校内空间解决方案 | P65–66 | 可用，概念方案 |
| `cooperation/classroom-kit-v1.png` | 课堂器材配置 | P27–36、P65–66 | 可用，无具体器材品牌 |
| `activities/prototype-testing-v1.png` | 备赛与迭代 | P55–61 | 可用，非具名赛事 |
| `growth/evidence-flatlay-v1.png` | 过程证据 | P7–9、P40、P42 | 可用，非证书或成绩 |
| `auth/maker-desk-side-v1.png` | 登录注册侧图 | P1、P36–42 | 可用 |
| `music/sound-workbench-hero-v1.png` | 音乐创作工具背景 | P19–20 + 真实工具 | 可用 |
| `art/visual-generation-sample-v1.png` | 绘画工具示例输出 | P19–20 + 真实工具 | 可用，原创概念作品 |
| `coding/robot-path-simulation-v1.png` | 编程工具示例输出 | P11–15 + 真实工具 | 可用 |
| `about/curriculum-research-flatlay-v1.png` | 课程研发与造物文化 | P5、P9、P36–42 | 可用，非真实证书 |

## SVG 结构与纹理资源

| 路径 | 用途 | 状态 |
| --- | --- | --- |
| `shared/blueprint-grid.svg` | 工程图纸背景，可平铺 | 可用 |
| `shared/orange-dot-matrix.svg` | 母版橙色精细点阵，可平铺 | 可用 |
| `shared/section-rule.svg` | 标题旁技术线 | 可用 |
| `diagrams/learning-path.svg` | 兴趣→学习→实践→表达 | 可用 |
| `diagrams/course-six-directions.svg` | 六大课程方向 | 可用 |
| `diagrams/course-ladder.svg` | 体验→成长→发明家→小院士 | 可用 |
| `diagrams/pbl-cycle.svg` | 项目式学习七步 | 可用 |
| `diagrams/ai-creation-loop.svg` | 观察→描述→生成→判断→修改 | 可用 |
| `diagrams/cooperation-delivery.svg` | 校园合作实施链路 | 可用 |
| `diagrams/event-prep-loop.svg` | 科创活动准备与复盘 | 可用 |
| `diagrams/growth-five-dimensions.svg` | 技术、认知、表达及工程过程 | 可用，注明非成绩图 |
| `diagrams/consult-course-map.svg` | 年级 / 兴趣 / 目标选课 | 可用 |
| `diagrams/about-five-education.svg` | 科创五育与工程思维 | 可用 |

## 预览审批

AI 阅读修正版预览位于：

- `长期记忆/科瑞特AI全站视觉整改方案/页面预览-待确认/生成效果图/07A-AI阅读-导入与拆分-v2.png`
- `长期记忆/科瑞特AI全站视觉整改方案/页面预览-待确认/生成效果图/07B-AI阅读-逐段绘本工作台-v2.png`
