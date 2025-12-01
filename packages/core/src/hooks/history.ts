import { useState } from "react";
import { ChatMessage } from "../types";
import { loadCache, saveCache } from "../storage";

type Params = {
  roomId: string;
  wsUrl: string;
  withAbsoluteMedia: (url?: string | null) => string | null | undefined;
  messagesRef: React.RefObject<HTMLDivElement>;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
};

export function useHistory({ roomId, wsUrl, withAbsoluteMedia, messagesRef, setMessages }: Params) {
  const [historyCursor, setHistoryCursor] = useState<string | null>(null);
  const [historyExhausted, setHistoryExhausted] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const resetHistory = () => {
    setHistoryCursor(null);
    setHistoryExhausted(false);
  };

  const loadCachedMessages = () => {
    loadCache(roomId).then((cached) => setMessages(cached));
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
        const el = messagesRef.current;
        const prevHeight = el?.scrollHeight || 0;
        const ordered = data.items
          .slice()
          .sort((a: any, b: any) => (a.createdAt || 0) - (b.createdAt || 0))
          .reverse();
        setMessages((prev) => {
          const merged = [...ordered, ...prev]
            .filter((m, idx, arr) => {
              const sameId = arr.findIndex((x) => x.id === m.id) === idx;
              const sameClient =
                !m.clientId || arr.findIndex((x) => x.clientId && x.clientId === m.clientId) === idx;
              return sameId && sameClient;
            })
            .map((m) => {
              if (!m.mediaUrl) return m;
              return { ...m, mediaUrl: withAbsoluteMedia(m.mediaUrl) };
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

  const persistMessages = (messages: ChatMessage[]) => {
    saveCache(roomId, messages);
  };

  return {
    historyCursor,
    historyExhausted,
    loadingHistory,
    loadHistory,
    resetHistory,
    loadCachedMessages,
    persistMessages,
  };
}
