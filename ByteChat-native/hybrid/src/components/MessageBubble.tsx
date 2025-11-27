import { ChatMessage } from "../core/types";

const detectMediaKind = (msg: ChatMessage) => {
  const hint = (msg.msgType || "").toLowerCase();
  if (hint.startsWith("image")) return "image";
  if (hint.startsWith("video")) return "video";
  if (msg.mediaUrl) {
    const lower = msg.mediaUrl.toLowerCase();
    if (/\.(png|jpe?g|gif|webp|bmp|heic|heif)(\?|$)/.test(lower)) return "image";
    if (/\.(mp4|mov|webm|m4v|avi|mkv)(\?|$)/.test(lower)) return "video";
  }
  return null;
};

export function MessageBubble({ msg, isMe }: { msg: ChatMessage; isMe: boolean }) {
  const avatar = (
    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-sm font-semibold uppercase shrink-0">
      {(msg.senderId || "U").charAt(0)}
    </div>
  );

  const renderBody = () => {
    const kind = detectMediaKind(msg);
    if (msg.mediaUrl && kind === "image") {
      return (
        <div className="flex flex-col gap-1">
          <img
            src={msg.mediaUrl}
            alt="图片"
            className="max-h-60 rounded-lg border border-gray-200 object-contain"
          />
          {msg.content ? (
            <div className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{msg.content}</div>
          ) : null}
        </div>
      );
    }
    if (msg.mediaUrl && kind === "video") {
      return (
        <div className="flex flex-col gap-1">
          <video
            src={msg.mediaUrl}
            controls
            className="max-h-60 rounded-lg border border-gray-200 bg-black"
          />
          {msg.content ? (
            <div className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{msg.content}</div>
          ) : null}
        </div>
      );
    }
    return <div className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{msg.content || ""}</div>;
  };

  return (
    <div
      className="flex items-start gap-2 max-w-full"
      style={{ justifyContent: isMe ? "flex-end" : "flex-start" }}
    >
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
          {renderBody()}
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
