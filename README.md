# ByteChat

一个包含原生 Android（WebView Hybrid）、Web 前端（React H5），以及 Node.js 后端的简单聊天项目骨架。后端使用 Postgres 持久化，前端使用本地 WebView 载入 H5 页面。

## 目录结构
- `ByteChat-native/` — Android 项目，WebView 加载本地 H5 模板（`app/src/main/assets/index.html`）。
- `ByteChat-website/` — Web 前端目录（当前为空/自定义）。
- `ByteChat-backend/` — Node.js 后端（Express + ws + pg），提供 WebSocket + HTTP 历史查询。
- `ByteChat-native/hybrid/` — Vite + React 项目（构建产物输出到 `ByteChat-native/app/src/main/assets` 供 WebView 使用）。


## 效果（本地分别在模拟器运行 Hybrid 和浏览器运行 web 端，nodejs后端也是跑在本地的）

### Web 和 Hybrid 的首页 
![Homepage](./doc/homepage.png)

### web 端上传图片
![WebImg](./doc/WebImg.png)

### 文字 
![LongText](./doc/LongText.png)

### hybrid 调用相机（没研究明白为啥默认使用了iphone的相机而不是mac的前置摄像头）
![NativeCreama](./doc/NativeCreama.png)

### hybrid 上传拍的图片
![NativeCreama](./doc/NativeImg.png)


## 技术栈
- **前端 (H5 模板)**：React 18 UMD + 自定义样式，运行于 Android WebView。
- **原生容器**：Android WebView（Kotlin），加载本地资产。
- **后端**：Node.js 18+，Express（HTTP）、ws（WebSocket）、pg（Postgres）。
- **数据库**：Postgres（推荐 Docker 运行）。

## 后端快速部署
1) 准备 Postgres（可用 Docker） — 这里端口用 5432，和后端默认 `DATABASE_URL` 一致  
   ```bash
   cat > docker-compose.yml <<'EOF'
   version: "3.9"
   services:
     postgres:
       image: postgres:16-alpine
       container_name: bytechat-postgres
       environment:
         POSTGRES_USER: bytechat
         POSTGRES_PASSWORD: bytechat
         POSTGRES_DB: bytechat
       ports:
         - "5432:5432"
       volumes:
         - pgdata:/var/lib/postgresql/data
       healthcheck:
         test: ["CMD-SHELL", "pg_isready -U bytechat"]
         interval: 5s
         timeout: 3s
         retries: 5
   volumes:
     pgdata:
   EOF
   docker compose up -d
   ```
2) 初始化后端（确保 Node 18+）  
   ```bash
   cd ByteChat-backend
   cp .env.example .env
   # 填入或确认：
   # PORT=3000
   # DATABASE_URL=postgresql://bytechat:bytechat@localhost:5432/bytechat
   npm install
   psql "$DATABASE_URL" -f schema.sql   # 保证 DATABASE_URL 指向上面 5432 的实例
   npm run start          # 或 npm run dev（Node 18+）
   ```
   - WS 入口：`ws://localhost:3000/ws?userId=...&roomId=...`
   - 历史：`GET /history?roomId=xxx&limit=20&cursor=<createdAt_ms>_<id>`
   - 健康：`GET /health`

## pnpm workspace（根目录）
- 目录已配置 `pnpm-workspace.yaml`，工作区含：`ByteChat-native/hybrid`、`ByteChat-website`、`ByteChat-backend`，以及共享包 `packages/core`（类型/存储/工具）、`packages/ui`（按钮/输入框/气泡等基础 UI）。
- 常用命令（在项目根执行，需要 pnpm 8+/Node 18+）：
  - `pnpm install`            # 安装各子包依赖
  - `pnpm dev:hybrid`         # 运行 hybrid 前端（Vite）
  - `pnpm build:hybrid`       # 构建 hybrid 并输出到 Android assets
  - `pnpm dev:website` / `pnpm build:website`
  - `pnpm dev:backend` / `pnpm start:backend`

## Android 前端（Hybrid）
- 代码在 `ByteChat-native/`，WebView 加载 `app/src/main/assets/index.html`（React 模板，无聊天逻辑，可自行扩展）。
- 前端源码在 `ByteChat-native/hybrid/`，使用 Vite + React；构建命令会把产物输出到 `app/src/main/assets`：
  ```bash
  cd ByteChat-native/hybrid
  npm install
  npm run build   # 产物写入 ../app/src/main/assets
  ```
- 运行：用 Android Studio 打开 `ByteChat-native`，选择设备/模拟器运行。

## API 与消息协议（后端）
- WebSocket `/ws?userId=&roomId=`  
  - 客户端发送：`{ type:"message", id:"c-uuid", msgType:"text", content:"hi", createdAt?:ms, mediaUrl?, metadata? }`
  - 服务端 ACK：`{ type:"ack", id:"c-uuid", serverId:"...", createdAt:ms }`
  - 广播：`{ type:"message", id, roomId, senderId, msgType, content, mediaUrl, metadata, createdAt }`
- 历史：`GET /history?roomId=xxx&limit=20&cursor=<createdAt_ms>_<id>`（游标基于 `created_at,id` 倒序）
- 健康：`GET /health`

## 数据库（Postgres）
- 运行 `schema.sql` 创建基础表：`users`, `rooms`, `room_members`, `messages`, `delivery_receipts`（可选）。
- 消息表索引：`(room_id, created_at desc, id desc)`；`client_id` 唯一用于幂等。
- 默认连接串：`postgresql://bytechat:bytechat@localhost:5433/bytechat`。


## 环境变量（后端）
- `PORT`：HTTP/WS 监听端口，默认 3000
- `DATABASE_URL`：Postgres 连接串，默认 `postgresql://bytechat:bytechat@localhost:5433/bytechat`
