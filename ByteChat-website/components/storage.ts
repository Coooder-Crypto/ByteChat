export function loadBasics() {
  const user = localStorage.getItem("bytechat_user") || `u-${Math.floor(Math.random() * 9000 + 1000)}`;
  const room = localStorage.getItem("bytechat_room") || "lobby";
  const ws =
    typeof window !== "undefined" && window.location.hostname === "localhost"
      ? "ws://localhost:3000/ws"
      : "ws://10.0.2.2:3000/ws";
  const savedWs = localStorage.getItem("bytechat_ws") || ws;
  return { userId: user, roomId: room, wsUrl: savedWs };
}

export function persistBasics(userId: string, roomId: string, wsUrl: string) {
  localStorage.setItem("bytechat_user", userId.trim());
  localStorage.setItem("bytechat_room", roomId.trim());
  localStorage.setItem("bytechat_ws", wsUrl.trim());
}
