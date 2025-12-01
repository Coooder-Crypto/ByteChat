import type { StorageProvider } from "./types";
import { webStorage } from "./web";

type NativeBridge = {
  get?: (key: string, uid?: string) => Promise<string | null> | string | null;
  set?: (key: string, value: string, uid?: string) => Promise<void> | void;
  remove?: (key: string, uid?: string) => Promise<void> | void;
  keys?: (uid?: string) => Promise<string[]> | string[];
  clear?: (uid?: string) => Promise<void> | void;
};

const ns = (uid?: string) => (uid ? `bytechat:${uid}:` : "bytechat:");

function wrapBridge(bridge: NativeBridge): StorageProvider {
  return {
    async get(key, uid) {
      const k = ns(uid) + key;
      const res = bridge.get?.(k, uid);
      return res instanceof Promise ? res : (res as string | null);
    },
    async set(key, value, uid) {
      const k = ns(uid) + key;
      await bridge.set?.(k, value, uid);
    },
    async remove(key, uid) {
      const k = ns(uid) + key;
      await bridge.remove?.(k, uid);
    },
    async keys(uid) {
      if (!bridge.keys) return [];
      const res = bridge.keys(uid);
      const arr = res instanceof Promise ? await res : (res as string[]);
      return Array.isArray(arr) ? arr.map((k) => k.replace(ns(uid), "")) : [];
    },
    async clear(uid) {
      if (!bridge.clear) return;
      await bridge.clear(uid);
    },
  };
}

export const nativeStorage = (() => {
  if (typeof window === "undefined") return webStorage;
  const anyWin = window as any;
  const bridge: NativeBridge | undefined = anyWin.NativeStorage;
  if (bridge && (bridge.get || bridge.set)) return wrapBridge(bridge);
  return webStorage;
})();
