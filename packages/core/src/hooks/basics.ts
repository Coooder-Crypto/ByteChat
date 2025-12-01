import { useEffect, useState } from "react";
import { STORAGE_KEYS, loadRoomList, saveRoomList } from "../storage";
import { network, fallbackWs } from "@bytechat/network";

export function useChatBasics() {
  const initialDefaultWs = fallbackWs();
  const [defaultWsState, setDefaultWsState] = useState(initialDefaultWs);

  const [userId, setUserId] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEYS.user) || `u-${Math.floor(Math.random() * 9000 + 1000)}`
      : ""
  );
  const [roomId, setRoomId] = useState(
    typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.room) || "lobby" : "lobby"
  );
  const [wsUrl, setWsUrl] = useState(
    typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.ws) || defaultWsState : defaultWsState
  );
  const [roomList, setRoomList] = useState<string[]>([]);

  useEffect(() => {
    loadRoomList().then((list) => {
      if (Array.isArray(list) && list.length) setRoomList(list);
    });
  }, []);

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

  useEffect(() => {
    saveRoomList(roomList);
  }, [roomList]);

  useEffect(() => {
    let active = true;
    network
      .getWsUrl()
      .then((url) => {
        if (active && url) {
          setDefaultWsState(url);
          setWsUrl((prev) => (prev === defaultWsState || prev === initialDefaultWs ? url : prev));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return {
    userId,
    roomId,
    wsUrl,
    roomList,
    setUserId,
    setRoomId,
    setWsUrl,
    setRoomList,
    defaultWs: defaultWsState,
  };
}
