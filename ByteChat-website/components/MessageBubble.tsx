import { ChatMessage } from "./types";

export function MessageBubble({ msg, isMe }: { msg: ChatMessage; isMe: boolean }) {
  const avatar = (
    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-sm font-semibold uppercase shrink-0">
      {(msg.senderId || "U").charAt(0)}
    </div>
  );

  return (
    <div className="flex items-start gap-2 max-w-full" style={{ justifyContent: isMe ? "flex-end" : "flex-start" }}>
      {!isMe && avatar}
      <div
        data-mid={msg.id}
        className="max-w-[86%] rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm"
        style={{ background: isMe ? "#eaf2ff" : "#f7f8fa" }}
      >
        <div className="flex justify-between mb-1 text-xs text-gray-500">
          <span className="truncate">{new Date(msg.createdAt || Date.now()).toLocaleTimeString()}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{msg.content || ""}</div>
          {msg.localStatus && (
            <span
              className="inline-block w-2 h-2 rounded-full shrink-0"
              style={{
                background:
                  msg.localStatus === "ok"
                    ? "#16a34a"
                    : msg.localStatus === "fail"
                    ? "#e11d48"
                    : "#a1a1aa",
              }}
            />
          )}
        </div>
      </div>
      {isMe && avatar}
    </div>
  );
}
