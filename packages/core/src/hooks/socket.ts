import { MutableRefObject, useRef } from "react";
import { ChatMessage, MsgStatus } from "../types";

type StatusSetter = (text: string, tone?: MsgStatus | "warn" | "fail" | "muted" | "ok") => void;

type SocketDeps = {
  wsRef: MutableRefObject<WebSocket | null>;
  getRoomId: () => string;
  getUserId: () => string;
  getWsUrl: () => string;
  setConnected: (v: boolean) => void;
  updateStatus: StatusSetter;
  addMessage: (m: ChatMessage, incoming?: boolean) => void;
  upsertSelfMessage: (m: ChatMessage) => void;
  updateMessageStatus: (id: string, status: MsgStatus) => void;
  withAbsoluteMedia: (raw?: string | null) => string | null | undefined;
};

export function useChatSocket(deps: SocketDeps) {
  const { wsRef, getRoomId, getUserId, getWsUrl, setConnected, updateStatus, addMessage, upsertSelfMessage, updateMessageStatus, withAbsoluteMedia } = deps;
  const shouldReconnect = useRef(true);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleConnect = (targetRoom?: string, targetUser?: string, targetWs?: string) => {
    const room = targetRoom || getRoomId();
    const user = targetUser || getUserId();
    const wsAddr = targetWs || getWsUrl();
    shouldReconnect.current = true;
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }

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
        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current);
          reconnectTimer.current = null;
        }
      };
      ws.onerror = () => updateStatus("连接出错", "fail");
      ws.onclose = () => {
        setConnected(false);
        updateStatus("Disconnected", "muted");
        if (shouldReconnect.current) {
          if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
          reconnectTimer.current = setTimeout(() => handleConnect(room, user, wsAddr), 1500);
        }
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
              mediaUrl: withAbsoluteMedia(data.mediaUrl),
              metadata: data.metadata,
              createdAt: data.createdAt || Date.now(),
              localStatus: "ok",
            };
            if (data.senderId === getUserId() && data.clientId) {
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
    shouldReconnect.current = false;
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
  };

  return { handleConnect, handleDisconnect, shouldReconnect, reconnectTimer };
}
