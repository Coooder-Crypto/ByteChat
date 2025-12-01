# ByteChat 
> 字节前端工程训练营 Task3 + Task4

一个覆盖 Hybrid（Android WebView H5）、Web（Next.js）、Node.js后端 (Koa) 的即时聊天示例，采用 pnpm workspace 管理。后端用 Postgres 持久化，前端通过 WebSocket 实时收发消息并支持图片上传。


## Monorepo 结构
- **apps/**
  - `web/` — Next.js + Tailwind，纯浏览器聊天室。
  - `hybrid-h5/` — Vite + React + Tailwind，供 WebView 使用，产物输出到 `native/android/app/src/main/assets/`。
- **native/**
  - `android/` — 原生宿主，WebView + JSBridge（存储、配置等）。
- **backend/** — Koa + ws + pg，HTTP / WS / 上传，Postgres 持久化。
- **packages/**
  - `core/` — 聊天核心逻辑（状态、消息、WS、媒体 URL 处理等）。
  - `ui/` — 共享 UI 组件（Tailwind + Radix）。
  - `storage/` — 存储适配层（web：localStorage/IndexedDB；native：JSBridge + SQLite 预留）。
  - `network/` — 网络地址适配（env / JSBridge / 默认本地）。
- **doc/** — 截图与文档资料。

> 导师提到了 hybrid 端可以用 JSB 封装到本地 sqlite，也就是说借助 native 的能力而不是一味依赖 web 端的能力（localstorage）。顺着这个方向研究了下，还有一些其他的模块有类似的问题，比如调用本机设备、网络适配。开发过程中也遇到了网络适配的问题，因为本地开发 hybrid 的模拟器和 web 的浏览器要走不同的端口，因此在处理 monorepo 的时候特意做了 `network/` 网络地址适配，类比 `storage/` 的处理方法。共享部分还可以做进一步的拆分，但是对于组件拆分部分我一直有些疑惑，尤其是怎么更好地拆分ui和业务逻辑，之前都是凭感觉拆愈发感觉不够研究，等我去学一下，后续会持续优化这部分。

## 技术栈
- **前端**：React 18 + Tailwind。Vite（Hybrid H5）、Next.js（Web）；UI/逻辑通过 workspace 包复用。
- **原生**：Android WebView，JSBridge 提供存储/配置等桥接能力。
- **后端**：Koa + ws；koa-body 处理上传；pg 连接 Postgres。
- **数据库**：Postgres（docker-compose 一键启动），schema 见 `backend/schema.sql`。

## 效果
本地同时运行模拟器（Hybrid）和浏览器（Web），后端在本机：

- 首页（Web / Hybrid）  
  ![Homepage](./doc/homepage.png)
- Web 上传图片  
  ![WebImg](./doc/WebImg.png)
- 长文本展示  
  ![LongText](./doc/LongText.png)
- Hybrid 调用相机  
  ![NativeCreama](./doc/NativeCreama.png)
- Hybrid 上传拍照  
  ![NativeImg](./doc/NativeImg.png)

## 快速开始
前置：Node.js ≥ 18、pnpm ≥ 8、Docker（用于本地 Postgres）。

1) 安装依赖  
```bash
pnpm install
```

2) 启动数据库（本地）  
```bash
cd backend
docker compose up -d        # 暴露 5433 -> 5432
```

3) 初始化数据表  
```bash
cd backend
export DATABASE_URL="postgresql://bytechat:bytechat@localhost:5433/bytechat"
psql "$DATABASE_URL" -f schema.sql
```

4) 启动后端（Koa + WS）  
```bash
cd ..
pnpm --filter bytechat-backend dev   # 或 pnpm start:backend
```
- WS 入口：`/ws?userId=u-xxxx&roomId=lobby`  
- 历史：`GET /history?roomId=...&limit=20&cursor=<ts>_<id>`  
- 上传：`POST /upload` (form-data file=image) 返回 `/uploads/<filename>`  
- 健康：`GET /health`

5) Web 前端  
```bash
pnpm dev:website        # http://localhost:3000 默认端口由 next 决定
```
可在 `apps/web/.env.local` 配置：
```
NEXT_PUBLIC_WS_URL=ws://localhost:3000/ws
NEXT_PUBLIC_HTTP_BASE=http://localhost:3000
```

6) Hybrid H5（开发或打包给 WebView）  
```bash
pnpm dev:hybrid         # Vite 开发
pnpm build:hybrid       # 产物输出到 native/android/app/src/main/assets
```
可在 `apps/hybrid-h5/.env` 配置：
```
VITE_WS_URL=ws://localhost:3000/ws
VITE_HTTP_BASE=http://localhost:3000
```
然后用 Android Studio 打开 `native/android`，运行模拟器/真机即可加载最新资产。

## 地址与环境
- 前端地址解析由 `@bytechat/network` 负责：
  - Web：优先 `NEXT_PUBLIC_WS_URL` / `NEXT_PUBLIC_HTTP_BASE`（或 Vite 同名变量），否则回退 `ws://localhost:3000/ws`（浏览器） / `ws://10.0.2.2:3000/ws`（Android 模拟器）。
  - Native：优先 JSBridge (`NativeConfig.getWsUrl/getBaseUrl`)，否则走 Web 逻辑。
- 后端环境（`backend/.env`）：  
  - `PORT=3000`  
  - `DATABASE_URL=postgresql://bytechat:bytechat@localhost:5433/bytechat`

## 共享包要点
- `@bytechat/core`：消息状态、历史懒加载、WS 连接/重连、媒体 URL 规范化、上传协同。
- `@bytechat/ui`：按钮、输入、消息气泡、列表、头部、输入栏、房间表单等。
- `@bytechat/storage`：按平台切换存储实现（web：localStorage/IndexedDB；native：JSBridge + SQLite 预留）。
- `@bytechat/network`：按平台/env/JSBridge 解析 WS/HTTP 基础地址。

## 构建与常用脚本（根目录）
- `pnpm dev:backend` / `pnpm start:backend`
- `pnpm dev:website` / `pnpm build:website`
- `pnpm dev:hybrid` / `pnpm build:hybrid`
- `pnpm lint`（聚合前端 lint）

## API 摘要
- WebSocket `/ws?userId=&roomId=`  
  - 客户端：`{ type:"message", id:"c-xxx", msgType:"text"|"image", content, mediaUrl?, metadata?, createdAt? }`  
  - ACK：`{ type:"ack", id, serverId, createdAt }`  
  - 广播：`{ type:"message", ... }`
- 历史：`GET /history?roomId=&limit=&cursor=`（倒序，游标由 `createdAt_ms_id` 组成）
- 上传：`POST /upload` (form-data `file`) → `{ url: "/uploads/xxx" }`
- 健康：`GET /health`

## 数据库
- 推荐 Docker（见 `backend/docker-compose.yml`，本地端口 5433）。
- 初始化：`psql "$DATABASE_URL" -f schema.sql`。
- 表：`users`, `rooms`, `room_members`, `messages`, `delivery_receipts`（可选投递状态），`messages.client_id` 唯一用于幂等。
