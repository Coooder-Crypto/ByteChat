import { nativeNetwork } from "./native";
import { webNetwork, fallbackWs, fallbackHttp } from "./web";

const hasNativeConfig = () => typeof window !== "undefined" && (window as any).NativeConfig;

const network = hasNativeConfig() ? nativeNetwork : webNetwork;

export { nativeNetwork, webNetwork, network, fallbackWs, fallbackHttp };
