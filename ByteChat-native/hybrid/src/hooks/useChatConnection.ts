import { useEffect, useMemo, useRef, useState } from "react";
import { ChatMessage, MsgStatus } from "../core/types";
import { STORAGE_KEYS, saveCache, loadCache, saveRoomList, loadRoomList } from "../core/storage";
import { cryptoRandom } from "../utils/random";

export function useChatConnection() {
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
  const [roomList, setRoomList] = useState<string[]>(() => loadRoomList());
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
  useEffect(() => saveRoomList(roomList), [roomList]);

  // load cached messages on room change
  useEffect(() => {
    currentRoomRef.current = roomId;
    setHistoryCursor(null);
    setHistoryExhausted(false);
    const cached = loadCache(roomId);
    setMessages(cached);
    if (cached.length) queueMicrotask(scrollToBottom);
  }, [roomId]);

  // persist messages cache
  useEffect(() => {
    saveCache(roomId, messages);
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

  const handleConnect = (targetRoom?: string, targetUser?: string, targetWs?: string) => {
    const room = targetRoom || roomId;
    const user = targetUser || userId;
    const wsAddr = targetWs || wsUrl;

    if (!wsAddr || !user || !room) {
      alert("请填写用户、房间与 WebSocket 地址");
      return;
    }
    if (wsRef.current) wsRef.current.close();

    try {
      const url = new URL(wsAddr);
      url.searchParams.set("userId", user);
      url.searchParams.set("roomId", room);
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
    handleConnect(trimmed);
  };

  return {
    state: {
      userId,
      roomId,
      wsUrl,
      status,
      view,
      roomList,
      connected,
      messages: sortedMessages,
      loadingHistory,
      messagesRef,
      input,
    },
    setUserId,
    setRoomId,
    setWsUrl,
    setInput,
    setView,
    joinRoom,
    sendMessage,
    loadHistory,
    handleDisconnect,
    handleConnect,
    messagesRef,
  };
}
