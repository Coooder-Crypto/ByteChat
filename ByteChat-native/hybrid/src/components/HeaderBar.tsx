import { ArrowLeft } from "lucide-react";
import { toneColor } from "../utils/theme";
import { cn } from "../core/utils";

type HeaderBarProps = {
  view: "home" | "chat";
  roomId?: string;
  status?: { text: string; tone: "ok" | "warn" | "fail" | "muted" };
  onBack?: () => void;
};

export function HeaderBar({ view, roomId, status, onBack }: HeaderBarProps) {
  const isChat = view === "chat";
  return (
    <div className="sticky top-0 z-20 w-full bg-white px-4 py-4 border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {isChat && (
            <button
              aria-label="返回"
              onClick={() => onBack?.()}
              className={cn(
                "inline-flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 text-gray-700",
                "hover:bg-gray-200 active:bg-gray-300 transition-colors"
              )}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <span className="text-lg font-semibold truncate">{isChat ? `房间：${roomId || ""}` : "ByteChat"}</span>
        </div>
        {isChat && status && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ background: toneColor(status.tone) }}
            />
            <span>{status.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}
