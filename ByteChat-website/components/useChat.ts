import { useEffect } from "react";
import { useChatCore } from "@bytechat/core";

type Props = { roomId: string; userId: string; wsOverride?: string };

// Thin wrapper around core hook to keep web API兼容
export function useChat({ roomId, userId, wsOverride }: Props) {
  const chat = useChatCore();

  // Sync inbound props to core state
  useEffect(() => {
    chat.setUserId(userId);
    chat.setRoomId(roomId);
    if (wsOverride) chat.setWsUrl(wsOverride);
  }, [userId, roomId, wsOverride]);

  // Auto connect/disconnect
  useEffect(() => {
    chat.handleConnect(roomId, userId, wsOverride || chat.state.wsUrl);
    return () => chat.handleDisconnect();
  }, [roomId, userId, wsOverride, chat.state.wsUrl]);

  return {
    state: {
      status: chat.state.status,
      messages: chat.state.messages,
      input: chat.state.input,
      messagesRef: chat.state.messagesRef,
      loadingHistory: chat.state.loadingHistory,
      wsUrl: chat.state.wsUrl,
    },
    setInput: chat.setInput,
    setWsUrl: chat.setWsUrl,
    connect: chat.handleConnect,
    disconnect: chat.handleDisconnect,
    sendMessage: chat.sendMessage,
    uploadAndSend: chat.uploadAndSend,
    sendMediaMessage: chat.sendMediaMessage,
    loadHistory: chat.loadHistory,
  };
}
