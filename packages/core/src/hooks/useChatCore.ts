import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "../types";
import { cryptoRandom } from "../random";
import { uploadAndSendFile, wsToHttpBase, normalizeMediaUrl } from "./media";
import { useMessageState } from "./messages";
import { useHistory } from "./history";
import { useChatBasics } from "./basics";
import { useChatSocket } from "./socket";
import { loadCache, saveCache, loadRoomList, saveRoomList } from "../storage";

// 组合 Hook：对外 API 不变，内部拆分为 basics / messages / history / socket / media
export function useChatCore() {
  const { userId, roomId, wsUrl, roomList, setUserId, setRoomId, setWsUrl, setRoomList, defaultWs } = useChatBasics();
  const [status, setStatus] = useState<{ text: string; tone: "ok" | "warn" | "fail" | "muted" }>({
    text: "Disconnected",
    tone: "muted",
  });
  const [view, setView] = useState<"home" | "chat">("home");
  const [connected, setConnected] = useState(false);
  const [input, setInput] = useState("");

  const {
    messages,
    messagesRef,
    sortedMessages,
    addMessage,
    updateMessageStatus,
    upsertSelfMessage,
    scrollToBottom,
    setMessages,
  } = useMessageState();

  const wsRef = useRef<WebSocket | null>(null);

  const updateStatus = (text: string, tone: "ok" | "warn" | "fail" | "muted" = "muted") =>
    setStatus({ text, tone });

  const history = useHistory({
    roomId,
    wsUrl,
    withAbsoluteMedia: (url) => normalizeMediaUrl(url, wsUrl).displayUrl,
    messagesRef,
    setMessages,
  });

  // 监听房间切换，加载缓存
  useEffect(() => {
    history.resetHistory();
    loadCache(roomId).then((cached) => {
      setMessages(cached);
      if (cached.length) queueMicrotask(scrollToBottom);
    });
  }, [roomId]);

  // 持久化消息缓存
  useEffect(() => {
    saveCache(roomId, messages);
  }, [messages, roomId]);

  // 加载房间列表（异步）
  useEffect(() => {
    loadRoomList().then((list) => {
      if (list.length) setRoomList(list);
    });
  }, []);

  useEffect(() => {
    saveRoomList(roomList);
  }, [roomList]);

  // 历史上拉加载
  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    const onScroll = () => {
      if (history.loadingHistory || history.historyExhausted) return;
      if (el.scrollTop < 80) history.loadHistory();
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [history.loadingHistory, history.historyExhausted]);

  // 保持滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const socket = useChatSocket({
    wsRef,
    getRoomId: () => roomId,
    getUserId: () => userId,
    getWsUrl: () => wsUrl,
    setConnected,
    updateStatus,
    addMessage,
    upsertSelfMessage,
    updateMessageStatus,
    withAbsoluteMedia,
  });

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

  const sendMediaMessage = (mediaUrl: string, msgType: string = "image", content?: string) => {
    const msgId = `c-${cryptoRandom()}`;
    const payload = {
      type: "message",
      id: msgId,
      clientId: msgId,
      msgType,
      content: content || "",
      mediaUrl,
      roomId,
      senderId: userId,
      createdAt: Date.now(),
    };
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      addMessage({ ...(payload as any), localStatus: "fail" } as ChatMessage);
      return;
    }
    addMessage({ ...(payload as any), localStatus: "pending" } as ChatMessage);
    wsRef.current.send(JSON.stringify(payload));
  };

  const uploadAndSend = async (file: File, text?: string) => {
    if (!file) return;
    try {
      await uploadAndSendFile({
        file,
        text,
        wsUrl,
        roomId,
        userId,
        wsRef,
        addMessage,
        updateStatus,
        withAbsoluteMedia,
        createMsgId: () => `c-${cryptoRandom()}`,
      });
    } catch (err) {
      console.warn("upload failed", err);
      updateStatus("上传失败", "fail");
    }
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
    socket.handleConnect(trimmed);
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
      loadingHistory: history.loadingHistory,
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
    sendMediaMessage,
    uploadAndSend,
    loadHistory: history.loadHistory,
    handleDisconnect: socket.handleDisconnect,
    handleConnect: socket.handleConnect,
    messagesRef,
  };
}
