import { STORAGE_KEYS } from "@bytechat/core";

const resolveDefaultWs = () => {
  const envWs = (typeof process !== "undefined" && (process as any).env?.NEXT_PUBLIC_WS_URL) || "";
  if (envWs) return envWs;
  return typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "ws://localhost:3000/ws"
    : "ws://10.0.2.2:3000/ws";
};

export function loadBasics() {
  if (typeof window === "undefined") {
    return { userId: `u-${Math.floor(Math.random() * 9000 + 1000)}`, roomId: "lobby", wsUrl: resolveDefaultWs() };
  }
  const user = localStorage.getItem(STORAGE_KEYS.user) || `u-${Math.floor(Math.random() * 9000 + 1000)}`;
  const room = localStorage.getItem(STORAGE_KEYS.room) || "lobby";
  const ws = resolveDefaultWs();
  const savedWs = localStorage.getItem(STORAGE_KEYS.ws) || ws;
  return { userId: user, roomId: room, wsUrl: savedWs };
}

export function persistBasics(userId: string, roomId: string, wsUrl: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.user, userId.trim());
  localStorage.setItem(STORAGE_KEYS.room, roomId.trim());
  localStorage.setItem(STORAGE_KEYS.ws, wsUrl.trim());
}
