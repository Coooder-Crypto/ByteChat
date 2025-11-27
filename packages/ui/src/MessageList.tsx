import React from "react";
import { ChatMessage } from "@bytechat/core";
import { MessageBubble } from "./MessageBubble";

export type MessageListProps = {
  messages: ChatMessage[];
  isMe: (senderId: string) => boolean;
  messagesRef: React.RefObject<HTMLDivElement>;
  loadingHistory?: boolean;
};

export function MessageList({ messages, isMe, messagesRef }: MessageListProps) {
  return (
    <div className="flex-1 min-h-0 flex flex-col px-3 pt-3 gap-3">
      <div ref={messagesRef} className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 pb-2">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} isMe={isMe(msg.senderId)} />
        ))}
      </div>
    </div>
  );
}
