import { useEffect, useState } from "react";
import { STORAGE_KEYS, loadRoomList, saveRoomList } from "../storage";

export function useChatBasics() {
  const resolveDefaultWs = () => {
    // 优先取环境变量：Vite (VITE_WS_URL) 或 Next (NEXT_PUBLIC_WS_URL)
    const viteWs = (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_WS_URL) || "";
    const nextWs = (typeof process !== "undefined" && (process as any).env?.NEXT_PUBLIC_WS_URL) || "";
    const envWs = viteWs || nextWs;
    if (envWs) return envWs;
    // 回退：本机浏览器用 localhost，模拟器用 10.0.2.2
    return typeof window !== "undefined" && window.location?.hostname === "localhost"
      ? "ws://localhost:3000/ws"
      : "ws://10.0.2.2:3000/ws";
  };

  const defaultWs = resolveDefaultWs();

  const [userId, setUserId] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEYS.user) || `u-${Math.floor(Math.random() * 9000 + 1000)}`
      : ""
  );
  const [roomId, setRoomId] = useState(
    typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.room) || "lobby" : "lobby"
  );
  const [wsUrl, setWsUrl] = useState(
    typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.ws) || defaultWs : defaultWs
  );
  const [roomList, setRoomList] = useState<string[]>(() => loadRoomList());

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.user, userId.trim());
  }, [userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.room, roomId.trim());
  }, [roomId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.ws, wsUrl.trim());
  }, [wsUrl]);

  useEffect(() => saveRoomList(roomList), [roomList]);

  return {
    userId,
    roomId,
    wsUrl,
    roomList,
    setUserId,
    setRoomId,
    setWsUrl,
    setRoomList,
    defaultWs,
  };
}
