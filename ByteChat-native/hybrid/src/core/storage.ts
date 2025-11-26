import { ChatMessage } from "./types";

export const STORAGE_KEYS = {
  user: "bytechat_user",
  room: "bytechat_room",
  ws: "bytechat_ws",
  history: (room: string) => `bytechat_history_${room}`,
  roomList: "bytechat_room_list",
};

export function loadCache(roomId: string): ChatMessage[] {
  const raw = localStorage.getItem(STORAGE_KEYS.history(roomId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ChatMessage[];
    return parsed.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  } catch {
    return [];
  }
}

export function saveCache(roomId: string, messages: ChatMessage[]) {
  const snapshot = messages.slice(-60);
  localStorage.setItem(STORAGE_KEYS.history(roomId), JSON.stringify(snapshot));
}

export function loadRoomList(): string[] {
  const raw = localStorage.getItem(STORAGE_KEYS.roomList);
  if (!raw) return ["lobby", "dev", "support"];
  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.from(new Set(parsed.filter(Boolean))).slice(0, 10);
  } catch {
    return ["lobby", "dev", "support"];
  }
}

export function saveRoomList(list: string[]) {
  localStorage.setItem(STORAGE_KEYS.roomList, JSON.stringify(list.slice(0, 10)));
}
