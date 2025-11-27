import http from "http";
import url from "url";
import express from "express";
import { WebSocketServer } from "ws";
import { randomUUID } from "crypto";
import cors from "cors";
import path from "path";
import fs from "fs";
import multer from "multer";
import { config } from "./config.js";
import { pool, initDb } from "./db.js";

const app = express();
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    cb(null, `${Date.now()}-${randomUUID()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only images allowed"));
    }
    cb(null, true);
  },
});

// Health
app.get("/health", (_req, res) => res.json({ ok: true }));

// History pagination: cursor = "<createdAtMs>_<id>"
app.get("/history", async (req, res) => {
  const { roomId, cursor } = req.query;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  if (!roomId) return res.status(400).json({ error: "roomId required" });

  const [cursorTs, cursorId] = cursor ? cursor.split("_") : [Date.now(), ""];
  const cursorDate = new Date(Number(cursorTs) || Date.now());

  try {
    const { rows } = await pool.query(
      `
      SELECT id, client_id, room_id, sender_id, msg_type, content, media_url, metadata,
             EXTRACT(EPOCH FROM created_at) * 1000 AS created_at_ms
      FROM messages
      WHERE room_id = $1
        AND (
          created_at < to_timestamp($2 / 1000.0)
          OR (created_at = to_timestamp($2 / 1000.0) AND id < $3)
        )
      ORDER BY created_at DESC, id DESC
      LIMIT $4
      `,
      [roomId, cursorDate.getTime(), cursorId || "ffffffff-ffff-ffff-ffff-ffffffffffff", limit]
    );

    const items = rows.map((r) => ({
      id: r.id,
      clientId: r.client_id,
      roomId: r.room_id,
      senderId: r.sender_id,
      msgType: r.msg_type,
      content: r.content,
      mediaUrl: r.media_url,
      metadata: r.metadata,
      createdAt: Number(r.created_at_ms),
    }));

    const last = items[items.length - 1];
    const nextCursor = last ? `${last.createdAt}_${last.id}` : null;
    res.json({ items, nextCursor });
  } catch (err) {
    console.error("history error", err);
    res.status(500).json({ error: "history_failed" });
  }
});

// Upload image
// TODO: use blob service instead
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "no_file" });
  }
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });
const rooms = new Map(); // roomId -> Set<WebSocket>

server.on("upgrade", (request, socket, head) => {
  const { pathname, query } = url.parse(request.url, true);
  if (pathname !== "/ws") {
    socket.destroy();
    return;
  }
  request.upgradeQuery = query;
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

wss.on("connection", (ws, request) => {
  const query = request.upgradeQuery || {};
  const userId = (query.userId || "").toString().trim();
  const roomId = (query.roomId || "").toString().trim();
  if (!userId || !roomId) {
    ws.close(1008, "userId and roomId required");
    return;
  }

  ws.meta = { userId, roomId, isAlive: true };
  joinRoom(roomId, ws);
  console.log(`ws connected user=${userId} room=${roomId}`);

  ws.on("pong", () => (ws.meta.isAlive = true));

  ws.on("message", async (raw) => {
    let data;
    try {
      data = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (data.type === "ping") {
      ws.send(JSON.stringify({ type: "pong" }));
      return;
    }
    if (data.type === "message") {
      await handleIncomingMessage(ws, data);
    }
  });

  ws.on("close", () => {
    leaveRoom(roomId, ws);
    console.log(`ws closed user=${userId} room=${roomId}`);
  });
});

async function handleIncomingMessage(ws, payload) {
  const { userId, roomId } = ws.meta;
  const msg = {
    id: randomUUID(),
    clientId: payload.clientId || payload.id || null,
    roomId,
    senderId: userId,
    msgType: payload.msgType || "text",
    content: payload.content || "",
    mediaUrl: payload.mediaUrl || null,
    metadata: payload.metadata || null,
    createdAt: payload.createdAt ? new Date(payload.createdAt) : new Date(),
  };

  try {
    await ensureUserAndRoom(userId, roomId);
    const saved = await saveMessage(msg);
    // ack to sender
    ws.send(
      JSON.stringify({
        type: "ack",
        id: payload.id || null,
        serverId: saved.id,
        createdAt: saved.createdAt,
      })
    );
    // broadcast to room
    broadcast(roomId, {
      type: "message",
      id: saved.id,
      clientId: msg.clientId,
      roomId,
      senderId: userId,
      msgType: msg.msgType,
      content: msg.content,
      mediaUrl: msg.mediaUrl,
      metadata: msg.metadata,
      createdAt: saved.createdAt,
    });
  } catch (err) {
    console.error("handleIncomingMessage error", err);
    ws.send(
      JSON.stringify({
        type: "error",
        code: "message_failed",
        message: "message persist failed",
      })
    );
  }
}

async function ensureUserAndRoom(userId, roomId) {
  await pool.query("INSERT INTO users(id) VALUES($1) ON CONFLICT (id) DO NOTHING", [userId]);
  await pool.query("INSERT INTO rooms(id) VALUES($1) ON CONFLICT (id) DO NOTHING", [roomId]);
  await pool.query(
    "INSERT INTO room_members(room_id, user_id) VALUES($1, $2) ON CONFLICT DO NOTHING",
    [roomId, userId]
  );
}

async function saveMessage(msg) {
  const { rows } = await pool.query(
    `
    INSERT INTO messages (id, client_id, room_id, sender_id, msg_type, content, media_url, metadata, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, to_timestamp($9 / 1000.0))
    ON CONFLICT (client_id) DO NOTHING
    RETURNING id, EXTRACT(EPOCH FROM created_at) * 1000 AS created_at_ms
    `,
    [
      msg.id,
      msg.clientId,
      msg.roomId,
      msg.senderId,
      msg.msgType,
      msg.content,
      msg.mediaUrl,
      msg.metadata,
      msg.createdAt.getTime(),
    ]
  );

  if (rows[0]) {
    return { id: rows[0].id, createdAt: Number(rows[0].created_at_ms) };
  }

  // If duplicate client_id, fetch existing record
  const existing = await pool.query(
    "SELECT id, EXTRACT(EPOCH FROM created_at) * 1000 AS created_at_ms FROM messages WHERE client_id = $1 LIMIT 1",
    [msg.clientId]
  );
  if (existing.rows[0]) {
    return { id: existing.rows[0].id, createdAt: Number(existing.rows[0].created_at_ms) };
  }
  // fallback
  return { id: msg.id, createdAt: msg.createdAt.getTime() };
}

function joinRoom(roomId, ws) {
  if (!rooms.has(roomId)) rooms.set(roomId, new Set());
  rooms.get(roomId).add(ws);
}

function leaveRoom(roomId, ws) {
  const set = rooms.get(roomId);
  if (set) {
    set.delete(ws);
    if (!set.size) rooms.delete(roomId);
  }
}

function broadcast(roomId, payload) {
  const set = rooms.get(roomId);
  if (!set) return;
  const data = JSON.stringify(payload);
  for (const client of set) {
    if (client.readyState === 1) {
      client.send(data);
    }
  }
}

// Heartbeat
setInterval(() => {
  for (const set of rooms.values()) {
    for (const ws of set) {
      if (!ws.meta) continue;
      if (ws.meta.isAlive === false) {
        ws.terminate();
        continue;
      }
      ws.meta.isAlive = false;
      ws.ping();
    }
  }
}, 30_000);

async function start() {
  try {
    await initDb();
    server.listen(config.port, () => {
      console.log(`HTTP/WS server listening on :${config.port}`);
    });
  } catch (err) {
    console.error("server init failed", err);
    process.exit(1);
  }
}

start();
