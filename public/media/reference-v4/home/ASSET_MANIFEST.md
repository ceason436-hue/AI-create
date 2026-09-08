# 首页资源出处

`master-source.png`：原有已锁定母版的无损副本，1586×992。首屏通过 SVG viewBox=650 96 936 562 展示右侧摄影区域；三个价值图标另通过 48×48 的小视窗提取（x=110、308、489；y=528）。页面不展示母版中的导航、文案、按钮或学习路径。摄影中的人物是设计概念图，不代表真实学员。

`hero-background.png`：内置 imagegen 基于同一母版生成的无文字背景。原文件位于 `C:/Users/Eason02/.codex/generated_images/01a06b30-297c-7540-8427-e3273a50e8b4/exec-958b3065-d52f-48b9-ba3e-6de37798aaf1.png`。页面使用其纸张、工程草图和过渡区域；核心人物摄影由原母版资源覆盖，以保持原构图。

生成提示：Use case: precise-object-edit. Create a production website hero background plate from this exact approved reference. Output only the TOP HERO AREA from y=96 through y=658, full original width 1586, at high resolution same wide aspect ratio. Preserve EXACTLY the boys' identities, faces, poses, robot, laptop, tools, classroom, photographic framing, right-hand foreground boy and white paper left fade, faint engineering blueprint lower left. Remove ALL website typography, headings, buttons, three feature icons and captions, orange dots and blue graphic lines from the left half and inpaint only the white paper texture and faint engineering sketches beneath them. Exclude the navigation/header and the bottom '从兴趣到作品' section entirely. It is crucial this is the SAME photograph, not a new scene. No text, no UI, no boxes. Keep photography on right and blank off-white paper on left. Return the clean background asset only.

局部图像视窗另引用原有 `/media/replica-v1/home/` 下的 journey、curriculum、pbl、topics、activities、cooperation、cta PNG。SVG viewBox 展示指定摄影、设备、图标或草图坐标，图片中的文字不承担网页文案。源图宽度为 864px；viewBox 可以控制比例与裁切，但不能增加位图清晰度，桌面放大仍存在细节限制。

课程连线、中心六边形与节点、中心文字、编号与阶梯由 SVG/DOM/CSS 构建。成长人物、对勾与电话图标来自已安装 lucide-react；价值说明及多处课程、流程、主题图标实际由参考图裁切。手机端采用独立排版，不将桌面整页压缩成不可读长图。

全站锁定母版：`长期记忆/科瑞特AI全站视觉整改方案/风格预览/全站设计母版-已锁定.png`。本轮九段首页构图参考：`长期记忆/科瑞特AI全站视觉整改方案/页面预览-待确认/生成效果图/01-首页-母版扩展-v1.png`。首页当前实施与验收边界详见根目录 `.impeccable/surfaces/home-reference.md`；当前资源说明不构成像素一致验收结论。
