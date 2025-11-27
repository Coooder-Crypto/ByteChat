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
    <div className="sticky top-0 z-20 w-full bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm px-4 py-5 pt-14">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {isChat && (
            <button
              aria-label="返回"
              onClick={() => onBack?.()}
              className={cn(
                "inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 shrink-0",
                "hover:bg-gray-200 active:bg-gray-300 transition-colors"
              )}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <span className="text-lg font-semibold truncate text-gray-900">
            {isChat ? `房间：${roomId || ""}` : "ByteChat Hybrid"}
          </span>
        </div>
        {isChat && status && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ background: toneColor(status.tone) }}
            />
            <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
            <span>{status.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}
