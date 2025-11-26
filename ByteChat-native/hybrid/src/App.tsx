import "./styles.css";
import { useEffect, useMemo, useRef, useState } from "react";

type MsgStatus = "pending" | "ok" | "fail";
type ChatMessage = {
  id: string;
  clientId?: string | null;
  roomId: string;
  senderId: string;
  msgType?: string;
  content?: string;
  mediaUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: number;
  localStatus?: MsgStatus;
};

const STORAGE_KEYS = {
  user: "bytechat_user",
  room: "bytechat_room",
  ws: "bytechat_ws",
  history: (room: string) => `bytechat_history_${room}`,
  roomList: "bytechat_room_list",
};

export function App() {
  const [userId, setUserId] = useState(
    localStorage.getItem(STORAGE_KEYS.user) || `u-${Math.floor(Math.random() * 9000 + 1000)}`
  );
  const [roomId, setRoomId] = useState(localStorage.getItem(STORAGE_KEYS.room) || "lobby");
  const [wsUrl, setWsUrl] = useState(localStorage.getItem(STORAGE_KEYS.ws) || "ws://10.0.2.2:3000/ws");
  const [status, setStatus] = useState<{ text: string; tone: "ok" | "warn" | "fail" | "muted" }>({
    text: "Disconnected",
    tone: "muted",
  });
  const [view, setView] = useState<"home" | "chat">("home");
  const [roomList, setRoomList] = useState<string[]>(() => {
    const raw = localStorage.getItem(STORAGE_KEYS.roomList);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as string[];
        return Array.from(new Set(parsed.filter(Boolean)));
      } catch {
        /* ignore */
      }
    }
    return ["lobby", "dev", "support"];
  });
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyCursor, setHistoryCursor] = useState<string | null>(null);
  const [historyExhausted, setHistoryExhausted] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [input, setInput] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const currentRoomRef = useRef(roomId);

  // persist basics
  useEffect(() => localStorage.setItem(STORAGE_KEYS.user, userId.trim()), [userId]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.room, roomId.trim()), [roomId]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.ws, wsUrl.trim()), [wsUrl]);
  useEffect(
    () => localStorage.setItem(STORAGE_KEYS.roomList, JSON.stringify(roomList.slice(0, 20))),
    [roomList]
  );

  // load cached messages on room change
  useEffect(() => {
    currentRoomRef.current = roomId;
    setHistoryCursor(null);
    setHistoryExhausted(false);
    const raw = localStorage.getItem(STORAGE_KEYS.history(roomId));
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as ChatMessage[];
        setMessages(parsed.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)));
        queueMicrotask(scrollToBottom);
      } catch (e) {
        console.warn("failed to restore cache", e);
      }
    } else {
      setMessages([]);
    }
  }, [roomId]);

  // persist messages cache
  useEffect(() => {
    const snapshot = messages.slice(-60);
    localStorage.setItem(STORAGE_KEYS.history(roomId), JSON.stringify(snapshot));
  }, [messages, roomId]);

  // scroll listener for history
  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    const onScroll = () => {
      if (loadingHistory || historyExhausted) return;
      if (el.scrollTop < 80) loadHistory();
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [loadingHistory, historyExhausted]);

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)),
    [messages]
  );

  const nearBottom = () => {
    const el = messagesRef.current;
    if (!el) return false;
    const delta = el.scrollHeight - el.clientHeight - el.scrollTop;
    return delta < 120;
  };

  const scrollToBottom = () => {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  const updateStatus = (text: string, tone: "ok" | "warn" | "fail" | "muted" = "muted") =>
    setStatus({ text, tone });

  const addMessage = (msg: ChatMessage, incoming = false) => {
    const copy: ChatMessage = {
      ...msg,
      id: msg.id || msg.clientId || cryptoRandom(),
      createdAt: msg.createdAt || Date.now(),
      localStatus: incoming ? msg.localStatus : msg.localStatus || "pending",
    };
    setMessages((prev) => {
      if (prev.some((m) => m.id === copy.id)) return prev;
      if (copy.clientId && prev.some((m) => m.clientId && m.clientId === copy.clientId)) return prev;
      const next = [...prev, copy].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      return next;
    });
    if (nearBottom()) queueMicrotask(scrollToBottom);
  };

  const updateMessageStatus = (id: string, newStatus: MsgStatus) => {
    setMessages((prev) => prev.map((m) => (m.id === id || m.clientId === id ? { ...m, localStatus: newStatus } : m)));
  };

  const handleConnect = () => {
    if (!wsUrl || !userId || !roomId) {
      alert("请填写用户、房间与 WebSocket 地址");
      return;
    }
    if (wsRef.current) wsRef.current.close();

    try {
      const url = new URL(wsUrl);
      url.searchParams.set("userId", userId);
      url.searchParams.set("roomId", roomId);
      const ws = new WebSocket(url.toString());
      wsRef.current = ws;
      updateStatus("Connecting...", "warn");

      ws.onopen = () => {
        setConnected(true);
        updateStatus("Connected", "ok");
      };
      ws.onerror = () => updateStatus("连接出错", "fail");
      ws.onclose = () => {
        setConnected(false);
        updateStatus("Disconnected", "muted");
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string);
          if (data.type === "ack" && (data.id || data.clientId)) {
            updateMessageStatus(data.id || data.clientId, "ok");
          } else if (data.type === "message") {
            const incoming: ChatMessage = {
              id: data.id,
              clientId: data.clientId,
              roomId: data.roomId,
              senderId: data.senderId,
              msgType: data.msgType,
              content: data.content,
              mediaUrl: data.mediaUrl,
              metadata: data.metadata,
              createdAt: data.createdAt || Date.now(),
              localStatus: "ok",
            };
            if (data.senderId === userId && data.clientId) {
              upsertSelfMessage(incoming);
            } else {
              addMessage(incoming, true);
            }
          }
        } catch (err) {
          console.warn("invalid payload", err);
        }
      };
    } catch (err) {
      console.warn("invalid ws url", err);
      updateStatus("连接出错", "fail");
    }
  };

  const handleDisconnect = () => {
    if (wsRef.current) wsRef.current.close();
    wsRef.current = null;
    setConnected(false);
    updateStatus("Disconnected", "muted");
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    const text = input.trim();
    const msgId = `c-${cryptoRandom()}`;
    const payload = {
      type: "message",
      id: msgId,
      clientId: msgId,
      msgType: "text",
      content: text,
      roomId,
      senderId: userId,
      createdAt: Date.now(),
    };

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      addMessage({ ...(payload as any), localStatus: "fail" } as ChatMessage);
      setInput("");
      return;
    }
    addMessage({ ...(payload as any), localStatus: "pending" } as ChatMessage);
    wsRef.current.send(JSON.stringify(payload));
    setInput("");
  };

  const cryptoRandom = () => {
    if (window.crypto?.getRandomValues) {
      const buf = new Uint32Array(2);
      window.crypto.getRandomValues(buf);
      return `${buf[0].toString(16)}${buf[1].toString(16)}`;
    }
    return Math.random().toString(16).slice(2);
  };

  const loadHistory = async () => {
    if (loadingHistory || historyExhausted) return;
    setLoadingHistory(true);
    const base = wsUrl
      .replace(/^wss?:\/\//, wsUrl.startsWith("wss") ? "https://" : "http://")
      .replace(/\/ws$/, "");
    const cursorParam = historyCursor ? `&cursor=${encodeURIComponent(historyCursor)}` : "";
    try {
      const res = await fetch(`${base}/history?roomId=${encodeURIComponent(roomId)}&limit=20${cursorParam}`);
      if (!res.ok) throw new Error("bad status");
          const data = await res.json();
          if (Array.isArray(data?.items)) {
            const el = messagesRef.current;
            const prevHeight = el?.scrollHeight || 0;
            const ordered = data.items
              .slice()
              .sort((a: any, b: any) => (a.createdAt || 0) - (b.createdAt || 0))
              .reverse();
            setMessages((prev) => {
              const merged = [...ordered, ...prev].filter((m, idx, arr) => {
                const sameId = arr.findIndex((x) => x.id === m.id) === idx;
                const sameClient =
                  !m.clientId || arr.findIndex((x) => x.clientId && x.clientId === m.clientId) === idx;
                return sameId && sameClient;
              });
              return merged.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
            });
            if (data.nextCursor) {
              setHistoryCursor(data.nextCursor);
            } else if (!ordered.length) {
          setHistoryExhausted(true);
        }
        queueMicrotask(() => {
          if (!el) return;
          const delta = el.scrollHeight - prevHeight;
          el.scrollTop = delta + el.scrollTop;
        });
      }
    } catch (err) {
      console.warn("history fetch failed", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const upsertSelfMessage = (incoming: ChatMessage) => {
    setMessages((prev) => {
      const idx = incoming.clientId
        ? prev.findIndex((m) => m.clientId && m.clientId === incoming.clientId)
        : -1;
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          ...incoming,
          localStatus: "ok",
          id: incoming.id || next[idx].id,
          createdAt: incoming.createdAt || next[idx].createdAt,
        };
        return next.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      }
      if (prev.some((m) => m.id === incoming.id)) return prev;
      return [...prev, incoming].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    });
  };

  const joinRoom = (target: string) => {
    const trimmed = target.trim();
    if (!trimmed) return;
    setRoomId(trimmed);
    setRoomList((prev) => {
      const next = [trimmed, ...prev.filter((r) => r !== trimmed)];
      return next.slice(0, 10);
    });
    setView("chat");
    handleConnect();
  };

  const Home = (
    <div className="home">
      <section className="connection">
        <label>
          用户 ID
          <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="u-123" />
        </label>
        <label>
          WebSocket 地址
          <input value={wsUrl} onChange={(e) => setWsUrl(e.target.value)} placeholder="ws://10.0.2.2:3000/ws" />
        </label>
        <label>
          房间 ID
          <input value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder="lobby" />
        </label>
        <div className="actions">
          <button onClick={() => joinRoom(roomId)}>加入聊天</button>
        </div>
      </section>

      <section className="room-list">
        <div className="pill">聊天室</div>
        <div className="rooms">
          {roomList.map((r) => (
            <button key={r} className="room-btn" onClick={() => joinRoom(r)}>
              {r}
            </button>
          ))}
        </div>
      </section>
    </div>
  );

  const Chat = (
    <div className="chat-page">
      <header>
        <button className="secondary" onClick={() => { handleDisconnect(); setView("home"); }}>
          返回
        </button>
        <div className="badge">房间：{roomId}</div>
        <div className="pill">
          <div className="dot" style={{ background: toneColor(status.tone) }} />
          <span>{status.text}</span>
        </div>
      </header>

      <section className="chat">
        <div className="history-tip">{loadingHistory ? "加载中..." : "上滑加载更多历史"}</div>
        <div className="messages" ref={messagesRef}>
          {sortedMessages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} isMe={msg.senderId === userId} />
          ))}
        </div>
      </section>

      <section className="composer">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="输入消息，Cmd/Ctrl + Enter 发送"
        />
        <button onClick={sendMessage}>发送</button>
      </section>
    </div>
  );

  return <div className="app">{view === "home" ? Home : Chat}</div>;
}

function MessageBubble({ msg, isMe }: { msg: ChatMessage; isMe: boolean }) {
  return (
    <div className={`bubble ${isMe ? "me" : "other"}`} data-mid={msg.id}>
      <div className="meta">
        <span>{msg.senderId || "unknown"}</span>
        <span>{new Date(msg.createdAt || Date.now()).toLocaleTimeString()}</span>
      </div>
        <div className="content">{msg.content || ""}</div>
        {msg.localStatus && (
        <div
          className={`status ${msg.localStatus === "ok" ? "ok" : msg.localStatus === "fail" ? "fail" : ""}`}
        >
          {msg.localStatus === "ok" ? "已送达" : msg.localStatus === "fail" ? "失败" : "发送中"}
        </div>
      )}
    </div>
  );
}

function toneColor(tone: "ok" | "warn" | "fail" | "muted") {
  if (tone === "ok") return "var(--success)";
  if (tone === "warn") return "var(--accent)";
  if (tone === "fail") return "var(--danger)";
  return "var(--muted)";
}
