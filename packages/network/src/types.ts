export type BaseUrls = { httpBase: string; wsUrl: string };

export interface NetworkConfigProvider {
  getWsUrl(): Promise<string>;
  getHttpBase(): Promise<string>;
}
