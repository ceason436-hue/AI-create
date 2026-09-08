# AI-create SSH 与部署手册

本手册供后续在同一台 Windows 电脑上维护临时部署站点使用。它不包含私钥、服务器密码或 API 密钥；私钥只保留在本机，严禁复制到聊天、GitHub 或项目目录。

## 服务器信息

- 公网 IP：`47.111.227.165`
- SSH 端口：`22`（不是 3000）
- SSH 用户：`root`
- 系统：Ubuntu 24.04 LTS
- 主站：`https://lingpeak.com`
- GitHub：`https://github.com/ceason436-hue/AI-create`
- 临时部署分支：`codex/temporary-no-db-deploy`
- 服务器指纹：`ED25519 SHA256:ZRONnLv5cyIKZ16jtsmkKrbAz1f9Y9esBZZ7DWAs8sA`

主站证书覆盖 `lingpeak.com`。验收时使用不带 `www` 的 HTTPS 地址，不要使用 `http://47.111.227.165:3000`。

## Windows SSH 密钥

私钥路径：`C:\Users\Eason02\.ssh\id_ed25519_krt`。PowerShell 检查命令：`$keyPath = Join-Path $env:USERPROFILE ".ssh\id_ed25519_krt"; Test-Path $keyPath`，应返回 `True`。

标准连接命令：`ssh -o IdentitiesOnly=yes -o PreferredAuthentications=publickey -o PasswordAuthentication=no -i "$keyPath" -p 22 root@47.111.227.165`。

PowerShell 多行命令必须使用反引号 `` ` `` 续行；不要把 `-p 22` 放进 `-i` 的路径中。

## 服务器运行结构

- 新站源码：`/opt/krt-ai`
- Compose：`/opt/krt-ai/docker-compose.temporary.yml`
- 新站容器：`krt-ai-platform-web`
- Compose 项目：`krt-ai`
- 新站本地端口：`127.0.0.1:3010 -> 3000`
- 旧站回滚容器：`ai-music-app`（原端口 3000）
- Nginx：`/etc/nginx/sites-available/ai-music`，启用链接为 `/etc/nginx/sites-enabled/ai-music`
- 环境变量：`/opt/krt-ai/.env.production.local`

临时版本关闭数据库、Redis、OSS，生成内容保存在浏览器本地；学校账号内容按项目内 7 天策略处理。不要输出或提交 `.env.production.local`。

## 检查与部署命令

登录后依次检查：`cd /opt/krt-ai`、`docker compose -p krt-ai -f docker-compose.temporary.yml ps`、`docker logs --tail 120 krt-ai-platform-web`、`curl -fsS http://127.0.0.1:3010/api/health/ready`、`curl -fsS https://lingpeak.com/api/health/ready`、`nginx -t`。健康接口应返回 `status: ready` 和 `mode: temporary-no-database-no-oss`。

本地测试：`npm.cmd exec tsc -- --noEmit`、`npm.cmd test`；推送分支：`git push origin codex/temporary-no-db-deploy`。

服务器可访问 GitHub 时，在 `/opt/krt-ai` 执行 `git fetch origin codex/temporary-no-db-deploy`、`git pull --ff-only origin codex/temporary-no-db-deploy`、`docker compose -p krt-ai -f docker-compose.temporary.yml up -d --build`，等待约 8 秒后再次执行健康检查。

如果服务器访问 GitHub 的 443 端口超时，可在 Windows 本地用 `scp -o IdentitiesOnly=yes -i "$keyPath" <已审核文件> root@47.111.227.165:/tmp/` 上传到 `/tmp`，服务器先备份原文件，再复制到 `/opt/krt-ai` 并重建。禁止用不完整压缩包覆盖整个项目。

## Nginx、缓存与回滚

修改 Nginx 前先执行 `cp /etc/nginx/sites-available/ai-music /etc/nginx/sites-available/ai-music.before-change-$(date +%Y%m%d-%H%M%S)`；修改后执行 `nginx -t && systemctl reload nginx`。当前缓存为 `/_next/static/` 一年 immutable、`/_next/image` 一天、`/media/` 七天并允许 stale-while-revalidate。

旧容器 `ai-music-app` 当前保留用于回滚。回滚前备份 Nginx，恢复旧配置后执行 `nginx -t && systemctl reload nginx`，再按需执行 `docker start ai-music-app`。未经确认不要删除旧容器、镜像或备份。

## 备份与新对话模板

本地备份目录：`D:\.codex\backups\AI-create-server-old-20260908`，包含旧站源码包、Nginx 回滚包和 `MANIFEST.sha256`。GitHub 备份分支：`backup/server-old-20260908`。

新对话可直接说：**“请先读取项目根目录的 `SSH_DEPLOYMENT_RUNBOOK.md`，使用其中的密钥路径连接 `47.111.227.165:22`，先检查 `/opt/krt-ai`、Docker Compose、Nginx 和健康接口，再按我的明确指令执行部署。不要读取或输出私钥、`.env.production.local` 或 API 密钥；删除、主站切换和推送操作都先确认。”**

