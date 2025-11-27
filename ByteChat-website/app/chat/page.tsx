"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useChat } from "../../components/useChat";
import { MessageBubble } from "../../components/MessageBubble";
import { Textarea } from "../../components/ui/textarea";
import { Button } from "../../components/ui/button";

export default function ChatPage() {
  const search = useSearchParams();
  const router = useRouter();
  const roomId = search.get("roomId") || "lobby";
  const userId = search.get("userId") || `u-${Math.floor(Math.random() * 9000 + 1000)}`;
  const ws = search.get("ws") || undefined;

  const {
    state: { status, messages, input, messagesRef },
    setInput,
    connect,
    disconnect,
    sendMessage,
  } = useChat({ roomId, userId, wsOverride: ws });

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-gray-900 flex flex-col">
      <div className="sticky top-0 z-20 w-full bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm px-4 py-5 pt-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 transition-colors"
              onClick={() => {
                disconnect();
                router.push("/");
              }}
              aria-label="返回"
            >
              ←
            </button>
            <span className="text-lg font-semibold truncate">房间：{roomId}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="inline-block w-3 h-3 rounded-full" style={{ background: toneColor(status.tone) }} />
              <span>{status.text}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={disconnect}>
                断开
              </Button>
              <Button size="sm" onClick={connect}>
                连接
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col px-3 pt-3 gap-3">
        <div
          ref={messagesRef}
          className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 pb-2"
        >
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} isMe={msg.senderId === userId} />
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 w-full bg-white border-t border-gray-100 shadow-inner">
        <div className="flex gap-2 items-end p-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="输入消息，Cmd/Ctrl + Enter 发送"
            rows={2}
            className="flex-1"
          />
          <Button onClick={sendMessage}>发送</Button>
        </div>
      </div>
    </main>
  );
}

function toneColor(tone: "ok" | "warn" | "fail" | "muted") {
  if (tone === "ok") return "#16a34a";
  if (tone === "warn") return "#2563eb";
  if (tone === "fail") return "#e11d48";
  return "#94a3b8";
}
