import { useMemo, useRef, useState } from "react";
import { ChatMessage, MsgStatus } from "../types";
import { cryptoRandom } from "../random";

export function useMessageState() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)),
    [messages]
  );

  const scrollToBottom = () => {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
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
      if (copy.clientId && prev.some((m) => m.clientId && m.clientId === copy.clientId))
        return prev;
      const next = [...prev, copy].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      return next;
    });
    queueMicrotask(scrollToBottom);
  };

  const updateMessageStatus = (id: string, newStatus: MsgStatus) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id || m.clientId === id ? { ...m, localStatus: newStatus } : m))
    );
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

  return {
    messages,
    messagesRef,
    sortedMessages,
    addMessage,
    updateMessageStatus,
    upsertSelfMessage,
    scrollToBottom,
    setMessages,
  };
}
