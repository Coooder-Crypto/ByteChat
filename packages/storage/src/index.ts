import { nativeStorage } from "./native";
import { webStorage } from "./web";
export * from "./types";

// 默认导出：运行时优先使用 NativeStorage（JSBridge），否则回退 web
export const storage = nativeStorage;

export const storageWeb = webStorage;
export const storageNative = nativeStorage;
