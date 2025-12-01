import type { NetworkConfigProvider } from "./types";

export const fallbackWs = () =>
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "ws://localhost:3000/ws"
    : "ws://10.0.2.2:3000/ws";

export const fallbackHttp = () =>
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "http://10.0.2.2:3000";

export const webNetwork: NetworkConfigProvider = {
  async getWsUrl() {
    const envWs =
      (typeof process !== "undefined" && (process as any).env?.NEXT_PUBLIC_WS_URL) ||
      (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_WS_URL) ||
      "";
    if (envWs) return envWs;
    return fallbackWs();
  },
  async getHttpBase() {
    const envHttp =
      (typeof process !== "undefined" && (process as any).env?.NEXT_PUBLIC_HTTP_BASE) ||
      (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_HTTP_BASE) ||
      "";
    if (envHttp) return envHttp.replace(/\/$/, "");
    const ws = await this.getWsUrl();
    if (ws.startsWith("ws://")) return ws.replace(/^ws:\/\//, "http://").replace(/\/ws$/, "");
    if (ws.startsWith("wss://")) return ws.replace(/^wss:\/\//, "https://").replace(/\/ws$/, "");
    return fallbackHttp();
  },
};
