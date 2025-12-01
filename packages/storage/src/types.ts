export type StorageProvider = {
  get(key: string, uid?: string): Promise<string | null>;
  set(key: string, value: string, uid?: string): Promise<void>;
  remove(key: string, uid?: string): Promise<void>;
  keys?(uid?: string): Promise<string[]>;
  clear?(uid?: string): Promise<void>;
};
