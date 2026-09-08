# 科瑞特 AI 生产环境验收与资源交接清单

> 更新日期：2026-09-02
> 本清单不包含任何真实密码、密钥、账号或学生资料。请通过受控密码库或部署平台 Secret 注入，不要提交到 Git 仓库、聊天记录或 `.env.example`。

## 当前本地已验证

- Docker 中 `krt-postgres` 与 `krt-redis` 均为 healthy。
- Prisma 9 项迁移为 up to date。
- 锁文件重装、`prisma generate`、TypeScript、39 项 Vitest、凭据扫描和 95 路由生产构建均已通过。
- 公开结构、课程后台、学习中心、AI 工具网关、课件/媒体管理和旧地址迁移已完成本地代码验证。

## 负责人需要提供或确认

### 1. 最小验收账号

仅需临时测试账号，不需要真实学生信息：

- 一名管理员：验证课程/公告/工具开关/媒体/课件与审计写入。
- 一名有效报名个人学员：至少报名一门含已发布课时、课件和工具绑定的测试课程。
- 一名学校共享账号：验证学校配置的工具范围与课堂会话隔离。

提供方式：受控密码库、单次临时口令或部署环境中的一次性初始化流程。验收完成后应立即轮换。

### 2. 生产 Secret 与配置项

| 类别 | 需要配置的变量 | 验收目的 |
|---|---|---|
| 数据与会话 | `DATABASE_URL`、`REDIS_URL`、`SESSION_SECRET`、`NEXT_PUBLIC_SITE_URL` | 数据访问、限流、短会话和绝对 URL |
| 私有对象存储 | `STORAGE_DRIVER=OSS`、`OSS_BUCKET`、`OSS_ENDPOINT`、`OSS_ACCESS_KEY_ID`、`OSS_ACCESS_KEY_SECRET`、可选 `OSS_SECURITY_TOKEN` | 课件原件/预览、媒体和作品私有存储 |
| AI 供应商 | `MINIMAX_API_KEY`、`MINIMAX_GROUP_ID`、`MINIMAX_BASE_URL` | 服务端 AI 网关、匿名试用和点数结算 |
| 课件处理 | `SOFFICE_PATH`、`COURSEWARE_WORKER_TOKEN`、`COURSEWARE_CONVERSION_TIMEOUT_MS` | PPT/PPTX 转 PDF 预览 |
| 视频处理 | `FFMPEG_PATH`、`MEDIA_WORKER_TOKEN`、`MEDIA_PROCESSING_TIMEOUT_MS` | 兼容 MP4、海报和字幕处理 |
| AI 风控 | `AI_GENERATION_ENABLED`、`AI_CONCURRENCY_PER_ACCOUNT`、`AI_REQUESTS_PER_MINUTE`、`AI_TRIAL_TIMEZONE` | 先失败关闭，再按确认的成本参数开启生成 |

生产初始建议：`AI_GENERATION_ENABLED=false`，完成点数权重、供应商成本和并发压测后再启用。

### 3. 部署与网络确认

- 生产域名和 `NEXT_PUBLIC_SITE_URL`。
- Nginx/负载均衡已接管 `80/443`；应用、PostgreSQL 和 Redis 不公开映射端口。
- 受控定时任务：`npm run ai:recover`、`npm run works:retention`、课件与媒体 Worker。
- PostgreSQL 备份、OSS 生命周期与日志留存策略。

## 逐项验收顺序

1. 注入 Secret，执行 `npx prisma migrate deploy`，运行一次性管理员初始化（不将管理员密码写入仓库或 Shell 历史）。
2. 用管理员创建测试课程分类、课程、模块、课时、公告、工具绑定、报名和私有课件。
3. 用学员验证报名有效期、公告可见性、课时进度、课件短会话水印预览、课程内工具和个人作品归属。
4. 用学校账号验证工具许可、共享课堂会话和管理员学校配置。
5. 开启单个 AI 工具并完成匿名 5 次试用、登录使用、点数预占/结算、并发/限流和供应商失败关闭压测。
6. 使用真实授权课件和媒体验证 LibreOffice、FFmpeg、OSS 签名链接、审计、字幕和版本恢复。
7. 在生产域名验证桌面/移动端、动态 sitemap、旧 URL 重定向和公开内容授权标签。
8. 所有生产验收通过后，依据《旧内容迁移与删除核验清单》请求删除旧静态文件的书面确认。

## 暂不需要提供的内容

真实课堂、师资、学生、校区、合作学校、活动、作品与获奖照片可以在上述功能验收完成后再批量交付。当前页面中的品牌占位和手册资料均保留来源标签，不会作为真实事实展示。
