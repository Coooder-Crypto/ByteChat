import { StorageProvider } from "@bytechat/storage-web";
import { webStorage } from "@bytechat/storage-web";

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

const detectNative = (): StorageProvider | null => {
  if (typeof window === "undefined") return null;
  const anyWin = window as any;
  const candidate: NativeBridge | undefined = anyWin.NativeStorage;
  if (candidate && (candidate.get || candidate.set)) {
    return wrapBridge(candidate);
  }
  return null;
};

export const nativeStorage: StorageProvider =
  detectNative() || webStorage;

export const getStorage = (): StorageProvider => nativeStorage;
