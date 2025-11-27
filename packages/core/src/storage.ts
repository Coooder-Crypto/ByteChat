import { ChatMessage } from "./types";
import { getStorage } from "@bytechat/storage-native";

export const STORAGE_KEYS = {
  user: "bytechat_user",
  room: "bytechat_room",
  ws: "bytechat_ws",
  history: (room: string) => `bytechat_history_${room}`,
  roomList: "bytechat_room_list",
};

const provider = () => getStorage();

export async function loadCache(roomId: string): Promise<ChatMessage[]> {
  try {
    const raw = await provider().get(STORAGE_KEYS.history(roomId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return parsed.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  } catch {
    return [];
  }
}

export async function saveCache(roomId: string, messages: ChatMessage[]) {
  const snapshot = messages.slice(-60);
  try {
    await provider().set(STORAGE_KEYS.history(roomId), JSON.stringify(snapshot));
  } catch {
    /* ignore */
  }
}

export async function loadRoomList(): Promise<string[]> {
  try {
    const raw = await provider().get(STORAGE_KEYS.roomList);
    if (!raw) return ["lobby", "dev", "support"];
    const parsed = JSON.parse(raw) as string[];
    return Array.from(new Set(parsed.filter(Boolean))).slice(0, 10);
  } catch {
    return ["lobby", "dev", "support"];
  }
}

export async function saveRoomList(list: string[]) {
  try {
    await provider().set(STORAGE_KEYS.roomList, JSON.stringify(list.slice(0, 10)));
  } catch {
    /* ignore */
  }
}
