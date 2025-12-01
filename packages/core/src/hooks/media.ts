import { MutableRefObject } from "react";
import { ChatMessage } from "../types";

export function wsToHttpBase(addr: string) {
  return addr.replace(/^wss?:\/\//, addr.startsWith("wss") ? "https://" : "http://").replace(/\/ws$/, "");
}

export function normalizeMediaUrl(raw: string | null | undefined, wsUrl: string) {
  const withAbsolute = (url?: string | null) => {
    if (!url) return url;
    try {
      const wsHost = new URL(wsUrl).hostname;
      const base = wsToHttpBase(wsUrl);
      if (url.startsWith("http")) {
        const u = new URL(url);
        if (["10.0.2.2", "localhost", "127.0.0.1"].includes(u.hostname) && wsHost) {
          u.hostname = wsHost;
        }
        return u.toString();
      }
      return `${base}${url}`;
    } catch {
      return url;
    }
  };

  if (!raw) return { payloadUrl: raw, displayUrl: raw };
  try {
    if (raw.startsWith("http")) {
      const u = new URL(raw);
      const pathOnly = `${u.pathname}${u.search || ""}`;
      const display = withAbsolute(pathOnly);
      return { payloadUrl: pathOnly, displayUrl: display };
    }
  } catch {
    // ignore
  }
  const display = withAbsolute(raw);
  return { payloadUrl: raw, displayUrl: display };
}

export async function uploadAndSendFile(params: {
  file: File;
  text?: string;
  wsUrl: string;
  roomId: string;
  userId: string;
  wsRef: MutableRefObject<WebSocket | null>;
  addMessage: (m: ChatMessage, incoming?: boolean) => void;
  updateStatus: (text: string, tone?: "ok" | "warn" | "fail" | "muted") => void;
  createMsgId: () => string;
}) {
  const { file, text, wsUrl, roomId, userId, wsRef, addMessage, updateStatus, createMsgId } = params;
  const base = wsToHttpBase(wsUrl);
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${base}/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error("upload failed");
  const data = await res.json();
  if (!data?.url) throw new Error("no url");
  const { payloadUrl, displayUrl } = normalizeMediaUrl(data.url, wsUrl);
  const type = file.type.startsWith("video") ? "video" : "image";
  const msgId = createMsgId();
  const payload = {
    type: "message",
    id: msgId,
    clientId: msgId,
    msgType: type,
    content: text || "",
    mediaUrl: payloadUrl,
    roomId,
    senderId: userId,
    createdAt: Date.now(),
  };
  addMessage(
    {
      ...(payload as any),
      mediaUrl: displayUrl || payloadUrl || undefined,
      localStatus: wsRef.current && wsRef.current.readyState === WebSocket.OPEN ? "pending" : "fail",
    } as ChatMessage,
    false
  );
  if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
    wsRef.current.send(JSON.stringify(payload));
  }
}
