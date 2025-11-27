import { useEffect } from "react";
import { ChatProps } from "../core/types";
import { MessageBubble } from "./MessageBubble";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

export function ChatView({
  roomId,
  status,
  messages,
  input,
  onChangeInput,
  onSend,
  messagesRef,
  isMe,
  loadingHistory,
}: ChatProps) {
  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    const scroll = () => {
      el.scrollTop = el.scrollHeight;
    };
    requestAnimationFrame(scroll);
  }, []);

  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    const scroll = () => {
      el.scrollTop = el.scrollHeight;
    };
    requestAnimationFrame(scroll);
  }, [messagesRef, messages]);

  return (
    <div className="flex flex-col min-h-screen bg-[#f7f8fb]">
      <div className="flex-1 min-h-0 flex flex-col px-3 pt-3 gap-3">
        {/* <div className="text-center text-xs text-gray-500">
          {loadingHistory ? "加载中..." : "上滑加载更多历史"}
        </div> */}

        <div ref={messagesRef} className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 pb-2">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} isMe={isMe(msg.senderId)} />
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 w-full bg-white border-t border-gray-100 shadow-inner">
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
            className="flex-1 text-gray-900 placeholder:text-gray-500"
          />
          <Button onClick={onSend}>发送</Button>
        </div>
      </div>
    </div>
  );
}
