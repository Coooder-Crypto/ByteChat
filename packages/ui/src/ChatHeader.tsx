import React from "react";
import { cn } from "@bytechat/core";

type StatusTone = "ok" | "warn" | "fail" | "muted";

export type ChatHeaderProps = {
  title?: string;
  roomId?: string;
  status?: { text: string; tone: StatusTone };
  onBack?: () => void;
  rightContent?: React.ReactNode;
};

const toneColor = (tone: StatusTone = "muted") => {
  if (tone === "ok") return "#16a34a";
  if (tone === "warn") return "#2563eb";
  if (tone === "fail") return "#e11d48";
  return "#94a3b8";
};

export function ChatHeader({ title = "ByteChat", roomId, status, onBack, rightContent }: ChatHeaderProps) {
  return (
    <div className="sticky top-0 z-20 w-full bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm px-4 py-5 pt-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 transition-colors"
            aria-label="返回"
            onClick={onBack}
          >
            ←
          </button>
          <div className="flex flex-col min-w-0">
            <span className="text-lg font-semibold truncate">{title}</span>
            {roomId ? <span className="text-xs text-gray-500 truncate">房间：{roomId}</span> : null}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {status && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="inline-block w-3 h-3 rounded-full" style={{ background: toneColor(status.tone) }} />
              <span>{status.text}</span>
            </div>
          )}
          {rightContent}
        </div>
      </div>
    </div>
  );
}
