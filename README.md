# ByteChat

一个包含原生 Android（WebView Hybrid）、Web 前端（React H5），以及 Node.js 后端的简单聊天项目骨架。后端使用 Postgres 持久化，前端使用本地 WebView 载入 H5 页面。

## 目录结构
- `ByteChat-native/` — Android 项目，WebView 加载本地 H5 模板（`app/src/main/assets/index.html`）。
- `ByteChat-website/` — Web 前端目录（当前为空/自定义）。
- `ByteChat-backend/` — Node.js 后端（Express + ws + pg），提供 WebSocket + HTTP 历史查询。
- `ByteChat-native/hybrid/` — Vite + React 项目（构建产物输出到 `ByteChat-native/app/src/main/assets` 供 WebView 使用）。

## 技术栈
- **前端 (H5 模板)**：React 18 UMD + 自定义样式，运行于 Android WebView。
- **原生容器**：Android WebView（Kotlin），加载本地资产。
- **后端**：Node.js 18+，Express（HTTP）、ws（WebSocket）、pg（Postgres）。
- **数据库**：Postgres（推荐 Docker 运行）。

## 后端快速部署
1) 准备 Postgres（可用 Docker）  
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
         - "5433:5432"
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
2) 初始化后端  
   ```bash
   cd ByteChat-backend
   cp .env.example .env   # 如需修改端口或 DB URL
   npm install
   psql "$DATABASE_URL" -f schema.sql   # 默认指向 5433
   npm run start          # 或 npm run dev（Node 18+）
   ```
   - WS 入口：`ws://localhost:3000/ws?userId=...&roomId=...`
   - 历史：`GET /history?roomId=xxx&limit=20&cursor=<createdAt_ms>_<id>`
   - 健康：`GET /health`

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

## 自定义与扩展
- 在 `ByteChat-website/` 构建 Web 前端产物后，可替换 Android 资产或部署为独立站点。
- 后端可扩展：鉴权、上传接口（媒体）、已读/撤回、typing、搜索、限流等。
- DB schema 可按需增加字段/索引，或迁移到生产 Postgres。

## 环境变量（后端）
- `PORT`：HTTP/WS 监听端口，默认 3000
- `DATABASE_URL`：Postgres 连接串，默认 `postgresql://bytechat:bytechat@localhost:5433/bytechat`
