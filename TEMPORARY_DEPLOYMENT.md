# 临时无数据库部署

此版本用于数据库、Redis 和 OSS 尚不可用时的短期部署。启用 `KRT_TEMPORARY_DEPLOYMENT=true` 后：

- 只保留学校账号登录：`KRT01` / `123456`；
- 四个 AI 工具（阅读、绘画、编程、音乐）不校验权益、不扣点、不使用 Redis 限流或数据库用量记录；
- AI 仍会调用服务端配置的 MiniMax；没有有效的 `MINIMAX_API_KEY` 时，工具不能生成内容；
- AI 阅读仅显示已审核预制课文《大青树下的小学》，作品与历史只保存在当前浏览器；
- 不写入 OSS 或数据库，云端作品库、课程管理与后台管理不在此版本范围内。

## 服务器环境

将 `.env.temporary-deploy.example` 的非密钥配置复制到服务器私有环境文件，并单独设置 `MINIMAX_API_KEY`。不要把生产数据库、Redis 或 OSS 凭据填入此临时版本。

线上 HTTPS 部署时不要设置 `KRT_TEMPORARY_ALLOW_INSECURE_HTTP=true`。这个开关仅供本机 `http://127.0.0.1` 验收预览使用。

## 回切正式版本

数据库、Redis、OSS 验证完成后，设置 `KRT_TEMPORARY_DEPLOYMENT=false`，恢复正式环境变量，再使用正式发布流程和健康检查。临时版本不会把登录、作品和使用记录迁移到正式数据库。
