import React, { useRef } from "react";
import { Button } from "./button";
import { Input } from "./input";

export type ChatInputBarProps = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onPickImage: (file: File) => void;
  previewUrl?: string | null;
  onCancelPreview?: () => void;
};

export function ChatInputBar({ value, onChange, onSend, onPickImage, previewUrl, onCancelPreview }: ChatInputBarProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="sticky bottom-0 w-full bg-white border-top border-gray-100 shadow-inner">
      <div className="flex flex-col gap-2 p-3">
        {previewUrl && (
          <div className="relative inline-flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-2 pr-4">
            <img src={previewUrl} alt="预览" className="h-16 w-16 object-cover rounded-md border border-gray-200" />
            <button
              type="button"
              aria-label="移除预览"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-black/70 text-white text-xs flex items-center justify-center shadow"
              onClick={onCancelPreview}
            >
              ×
            </button>
          </div>
        )}
        <div className="flex gap-2 items-end">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onPickImage(file);
              if (fileRef.current) fileRef.current.value = "";
            }}
          />
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="输入消息，Enter 发送"
            className="flex-1 h-11"
          />
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            图片
          </Button>
          <Button onClick={onSend}>发送</Button>
        </div>
      </div>
    </div>
  );
}
