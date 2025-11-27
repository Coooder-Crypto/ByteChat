export type StorageProvider = {
  get(key: string, uid?: string): Promise<string | null>;
  set(key: string, value: string, uid?: string): Promise<void>;
  remove(key: string, uid?: string): Promise<void>;
  keys?(uid?: string): Promise<string[]>;
  clear?(uid?: string): Promise<void>;
};

const ns = (uid?: string) => (uid ? `bytechat:${uid}:` : "bytechat:");

export const webStorage: StorageProvider = {
  async get(key, uid) {
    try {
      return localStorage.getItem(ns(uid) + key);
    } catch {
      return null;
    }
  },
  async set(key, value, uid) {
    try {
      localStorage.setItem(ns(uid) + key, value);
    } catch {
      /* ignore quota errors */
    }
  },
  async remove(key, uid) {
    try {
      localStorage.removeItem(ns(uid) + key);
    } catch {
      /* ignore */
    }
  },
  async keys(uid) {
    const prefix = ns(uid);
    const res: string[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) {
          res.push(k.slice(prefix.length));
        }
      }
    } catch {
      /* ignore */
    }
    return res;
  },
  async clear(uid) {
    const prefix = ns(uid);
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) toRemove.push(k);
      }
      toRemove.forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
  },
};
