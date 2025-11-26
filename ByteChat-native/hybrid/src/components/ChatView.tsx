import { ChatProps } from "../core/types";
import { MessageBubble } from "./MessageBubble";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

export function ChatView({
  roomId,
  status,
  messages,
  input,
  onBack,
  onChangeInput,
  onSend,
  messagesRef,
  isMe,
  loadingHistory,
}: ChatProps) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="flex-1 min-h-0 flex flex-col px-3 pt-2 gap-2">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold">房间：{roomId}</span>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
              <span>{status.text}</span>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500">
          {loadingHistory ? "加载中..." : "上滑加载更多历史"}
        </div>

        <div
          ref={messagesRef}
          className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 pb-2"
        >
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} isMe={isMe(msg.senderId)} />
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 w-full bg-white border-t border-gray-100">
        <div className="flex gap-2 items-end p-3">
          <Textarea
            value={input}
            onChange={(e) => onChangeInput(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="输入消息，Cmd/Ctrl + Enter 发送"
            rows={2}
            className="flex-1"
          />
          <Button onClick={onSend}>发送</Button>
        </div>
      </div>
    </div>
  );
}
