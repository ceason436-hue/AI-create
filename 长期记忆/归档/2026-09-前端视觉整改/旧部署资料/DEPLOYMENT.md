# 部署指南 - 阿里云 ECS 实例 (47.111.227.165)

本项目已配置好 Docker 化部署环境。请按照以下步骤在您的阿里云服务器上进行部署。

> **平台一期上线前置条件（2026-08-31）**
>
> - 不得使用本文旧的“公网开放 `3000` 端口”步骤部署科瑞特 AI 平台。正式环境应只从 Nginx 提供 `80/443`，应用容器端口仅允许本机反向代理访问。
> - PostgreSQL 16 与 Redis 7 应使用 `ai-music-app/docker-compose.infrastructure.yml` 启动，均绑定 `127.0.0.1`，不得添加公网安全组规则。
> - 在数据库启动、备份策略和环境变量就绪后，先执行 `npx prisma migrate deploy`，再运行一次性管理员初始化。初始化命令需要显式确认变量，禁止把真实管理员密码写入仓库或 Shell 历史。
> - MiniMax API Key 必须完成轮换后才可上线。所有 AI 路由要求已登录会话、权益、Redis 限流、幂等键和服务端点数控制；生产环境应保持 `AI_GENERATION_ENABLED=false`，直到点数权重已由管理员确认并配置。
> - `npm run ai:recover` 与 `npm run works:retention` 需要由受控的主机定时任务运行；不得在未配置 PostgreSQL、Redis 或存储驱动时手工执行。

当前根目录 Compose 文件仍为历史部署方式并映射 `3000:3000`。将其改为仅绑定本机端口会影响现有访问路径，需项目负责人确认 Nginx 已接管流量后再变更。

## 1. 准备服务器环境

登录您的服务器（使用 SSH）：
```bash
ssh root@47.111.227.165
```

### 安装 Docker
如果您的服务器尚未安装 Docker，请运行以下命令：
```bash
# 更新软件包索引
sudo apt-get update

# 安装必要的包
sudo apt-get install -y ca-certificates curl gnupg

# 添加 Docker 官方 GPG 密钥
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# 设置仓库
echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker 引擎
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

## 2. 上传代码

您可以将代码推送到 GitHub/Gitee 然后在服务器上 `git clone`，或者使用 SCP 直接上传。

**方式 A: Git (推荐)**
1. 在 GitHub/Gitee 创建仓库并推送代码。
2. 在服务器上克隆：
   ```bash
   git clone <您的仓库地址>
   cd <项目目录>
   ```

**方式 B: SCP 上传**
在您的本地电脑运行：
```bash
scp -r . root@47.111.227.165:/root/ai-music
```

## 3. 部署应用

进入项目根目录（包含 `docker-compose.yml` 的目录）：

```bash
# 启动应用
sudo docker compose up -d --build
```

## 4. 配置阿里云安全组

为了让外网能够访问您的网站，您需要前往阿里云控制台配置**安全组规则**：

1. 登录 [阿里云控制台](https://ecs.console.aliyun.com/)。
2. 找到您的实例 `47.111.227.165`。
3. 点击 **安全组** -> **配置规则**。
4. 添加一条**入方向**规则：
   - **协议类型**: TCP
   - **端口范围**: 3000/3000
   - **授权对象**: 0.0.0.0/0
5. 如果您打算使用 Nginx 反向代理或配置 HTTPS，请后续再配置 80 和 443 端口。

## 5. 验证部署

部署完成后，您可以直接在浏览器访问：
`http://47.111.227.165:3000`

---

## 6. 绑定域名 (可选但推荐)

为了让用户通过您的域名（如 `www.yourdomain.com`）直接访问，且不需要输入 `:3000` 端口，建议使用 Nginx 进行反向代理。

### 步骤 1：域名解析
前往您购买域名的服务商（如阿里云、腾讯云）控制台，添加一条 **A 记录**，将其指向您的服务器 IP：`8.153.148.60`。

### 步骤 2：安装 Nginx
在您的服务器上执行：
```bash
sudo apt-get update
sudo apt-get install nginx -y
```

### 步骤 3：配置 Nginx 反向代理
1. 创建一个新的 Nginx 配置文件：
```bash
sudo nano /etc/nginx/sites-available/ai-music
```

2. 填入以下内容（**记得将 `yourdomain.com` 替换为您的实际域名**）：
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
![alt text![alt text](image-1.png)](image.png)        
        # 增加超时时间以防止 AI 接口长时间生成时 504 Timeout
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
}
```

3. 启用配置并重启 Nginx：
```bash
# 创建软链接启用配置
sudo ln -s /etc/nginx/sites-available/ai-music /etc/nginx/sites-enabled/

# 测试配置是否正确
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 步骤 4：更新安全组
现在您需要让公网能够访问 80 端口。请回到**阿里云安全组**，添加一条入方向规则：
- **协议类型**: TCP
- **端口范围**: 80/80
- **授权对象**: 0.0.0.0/0

完成以上步骤后，您就可以直接通过您的域名访问网站了！

---

## 常用管理命令

*   **查看运行状态**: `sudo docker compose ps`
*   **查看日志**: `sudo docker compose logs -f`
*   **停止应用**: `sudo docker compose down`
*   **重启应用**: `sudo docker compose restart`
