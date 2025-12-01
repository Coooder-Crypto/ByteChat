import type { NetworkConfigProvider } from "./types";
import { webNetwork } from "./web";

type NativeConfigBridge = {
  getBaseUrl?: () => Promise<string> | string; // http base
  getWsUrl?: () => Promise<string> | string; // optional direct ws
};

const fallbackWs = () =>
  typeof window !== "undefined" && window.location?.hostname === "localhost"
    ? "ws://localhost:3000/ws"
    : "ws://10.0.2.2:3000/ws";

const fromBridge = async (): Promise<{ wsUrl?: string; httpBase?: string }> => {
  if (typeof window === "undefined") return {};
  const cfg: NativeConfigBridge | undefined = (window as any).NativeConfig;
  if (!cfg) return {};
  try {
    if (cfg.getWsUrl) {
      const ws = await Promise.resolve(cfg.getWsUrl());
      if (ws) return { wsUrl: ws };
    }
    if (cfg.getBaseUrl) {
      const httpBase = await Promise.resolve(cfg.getBaseUrl());
      if (httpBase) return { httpBase };
    }
  } catch {
    // ignore
  }
  return {};
};

export const nativeNetwork: NetworkConfigProvider = {
  async getWsUrl() {
    const bridge = await fromBridge();
    if (bridge.wsUrl) return bridge.wsUrl;
    if (bridge.httpBase) return `${bridge.httpBase.replace(/\/$/, "")}/ws`;
    // fallback to env / web logic
    return webNetwork.getWsUrl() ?? fallbackWs();
  },
  async getHttpBase() {
    const bridge = await fromBridge();
    if (bridge.httpBase) return bridge.httpBase.replace(/\/$/, "");
    const ws = await this.getWsUrl();
    if (ws.startsWith("ws://")) return ws.replace(/^ws:\/\//, "http://").replace(/\/ws$/, "");
    if (ws.startsWith("wss://")) return ws.replace(/^wss:\/\//, "https://").replace(/\/ws$/, "");
    return webNetwork.getHttpBase();
  },
};
