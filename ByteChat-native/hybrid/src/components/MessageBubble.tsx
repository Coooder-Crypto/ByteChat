import { ChatMessage } from "../core/types";
import { toneColor } from "../utils/theme";

export function MessageBubble({ msg, isMe }: { msg: ChatMessage; isMe: boolean }) {
  return (
    <div
      data-mid={msg.id}
      className="max-w-[96%] rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm"
      style={{ alignSelf: isMe ? "flex-end" : "flex-start", background: isMe ? "#eaf2ff" : "#f7f8fa" }}
    >
      <div className="flex justify-between mb-1 text-xs text-gray-500">
        <span>{msg.senderId || "unknown"}</span>
        <span>{new Date(msg.createdAt || Date.now()).toLocaleTimeString()}</span>
      </div>
      <div className="text-sm text-gray-800 whitespace-pre-wrap">{msg.content || ""}</div>
      {msg.localStatus && (
        <div
          className="text-xs mt-1"
          style={{
            color: toneColor(
            msg.localStatus === "ok" ? "ok" : msg.localStatus === "fail" ? "fail" : "muted"
            ),
          }}
        >
          {msg.localStatus === "ok" ? "已送达" : msg.localStatus === "fail" ? "失败" : "发送中"}
        </div>
      )}
    </div>
  );
}
