# 部署指南 - 阿里云 ECS 实例 (8.153.148.60)

本项目已配置好 Docker 化部署环境。请按照以下步骤在您的阿里云服务器上进行部署。

## 1. 准备服务器环境

登录您的服务器（使用 SSH）：
```bash
ssh root@8.153.148.60
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
scp -r . root@8.153.148.60:/root/ai-music
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
2. 找到您的实例 `8.153.148.60`。
3. 点击 **安全组** -> **配置规则**。
4. 添加一条**入方向**规则：
   - **协议类型**: TCP
   - **端口范围**: 3000/3000
   - **授权对象**: 0.0.0.0/0
5. 如果您打算使用 Nginx 反向代理或配置 HTTPS，请后续再配置 80 和 443 端口。

## 5. 验证部署

部署完成后，您可以直接在浏览器访问：
`http://8.153.148.60:3000`

---

## 常用管理命令

*   **查看运行状态**: `sudo docker compose ps`
*   **查看日志**: `sudo docker compose logs -f`
*   **停止应用**: `sudo docker compose down`
*   **重启应用**: `sudo docker compose restart`
