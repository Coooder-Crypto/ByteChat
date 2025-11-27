"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChatMessage, MsgStatus } from "./types";

const STORAGE_KEYS = {
  history: (room: string) => `bytechat_history_${room}`,
  ws: "bytechat_ws",
};

export function useChat({ roomId, userId, wsOverride }: { roomId: string; userId: string; wsOverride?: string }) {
  const defaultWs =
    typeof window !== "undefined" && window.location.hostname === "localhost"
      ? "ws://localhost:3000/ws"
      : "ws://10.0.2.2:3000/ws";
  const [wsUrl, setWsUrl] = useState(() => wsOverride || localStorage.getItem(STORAGE_KEYS.ws) || defaultWs);
  const [status, setStatus] = useState<{ text: string; tone: "ok" | "warn" | "fail" | "muted" }>({
    text: "Disconnected",
    tone: "muted",
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyCursor, setHistoryCursor] = useState<string | null>(null);
  const [historyExhausted, setHistoryExhausted] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [input, setInput] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ws, wsUrl.trim());
  }, [wsUrl]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEYS.history(roomId));
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as ChatMessage[];
      setMessages(data.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)));
    } catch (e) {
      console.warn("failed to load cache", e);
    }
  }, [roomId]);

  useEffect(() => {
    const snapshot = messages.slice(-60);
    localStorage.setItem(STORAGE_KEYS.history(roomId), JSON.stringify(snapshot));
  }, [messages, roomId]);

  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    const scroll = () => {
      el.scrollTop = el.scrollHeight;
    };
    requestAnimationFrame(scroll);
  }, [messages]);

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)),
    [messages]
  );

  const connect = () => {
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
      setStatus({ text: "Connecting...", tone: "warn" });

      ws.onopen = () => {
        setStatus({ text: "Connected", tone: "ok" });
      };
      ws.onerror = () => setStatus({ text: "连接出错", tone: "fail" });
      ws.onclose = () => {
        setStatus({ text: "Disconnected", tone: "muted" });
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
      setStatus({ text: "连接出错", tone: "fail" });
    }
  };

  const disconnect = () => {
    if (wsRef.current) wsRef.current.close();
    wsRef.current = null;
    setStatus({ text: "Disconnected", tone: "muted" });
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
  };

  const updateMessageStatus = (id: string, newStatus: MsgStatus) => {
    setMessages((prev) => prev.map((m) => (m.id === id || m.clientId === id ? { ...m, localStatus: newStatus } : m)));
  };

  const loadHistory = async () => {
    if (loadingHistory || historyExhausted) return;
    setLoadingHistory(true);
    const base = wsUrl.replace(/^wss?:\/\//, wsUrl.startsWith("wss") ? "https://" : "http://").replace(/\/ws$/, "");
    const cursorParam = historyCursor ? `&cursor=${encodeURIComponent(historyCursor)}` : "";
    try {
      const res = await fetch(`${base}/history?roomId=${encodeURIComponent(roomId)}&limit=20${cursorParam}`);
      if (!res.ok) throw new Error("bad status");
      const data = await res.json();
      if (Array.isArray(data?.items)) {
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
        if (data.nextCursor) setHistoryCursor(data.nextCursor);
        if (!ordered.length) setHistoryExhausted(true);
      }
    } catch (err) {
      console.warn("history fetch failed", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // auto-connect on mount
  useEffect(() => {
    connect();
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, userId, wsUrl]);

  return {
    state: { status, messages: sortedMessages, input, messagesRef, loadingHistory, wsUrl },
    setInput,
    setWsUrl,
    connect,
    disconnect,
    sendMessage,
    loadHistory,
  };
}

function cryptoRandom() {
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const buf = new Uint32Array(2);
    window.crypto.getRandomValues(buf);
    return `${buf[0].toString(16)}${buf[1].toString(16)}`;
  }
  return Math.random().toString(16).slice(2);
}
