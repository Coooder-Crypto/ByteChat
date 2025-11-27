import { useEffect, useState } from "react";
import { STORAGE_KEYS, loadRoomList, saveRoomList } from "../storage";

export function useChatBasics() {
  const defaultWs =
    typeof window !== "undefined" && window.location?.hostname === "localhost"
      ? "ws://localhost:3000/ws"
      : "ws://10.0.2.2:3000/ws";

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
