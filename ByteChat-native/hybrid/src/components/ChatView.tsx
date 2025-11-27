import { useEffect, useRef, useState } from "react";
import { ChatProps } from "../core/types";
import { MessageBubble } from "./MessageBubble";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function ChatView({
  roomId,
  status,
  messages,
  input,
  onChangeInput,
  onSend,
  onSendMedia,
  messagesRef,
  isMe,
  loadingHistory,
}: ChatProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  const handlePreview = (file?: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return url;
    });
  };

  const clearPreview = () => {
    setSelectedFile(null);
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
  };

  const handleSend = () => {
    if (selectedFile) {
      onSendMedia(selectedFile, input);
      clearPreview();
      onChangeInput("");
      return;
    }
    onSend();
  };

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
        <div className="flex flex-col gap-2 p-3">
          {previewUrl && (
            <div className="relative inline-flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-2 pr-4">
              <img src={previewUrl} alt="预览" className="h-16 w-16 object-cover rounded-md border border-gray-200" />
              <button
                type="button"
                aria-label="移除预览"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-black/70 text-white text-xs flex items-center justify-center shadow"
                onClick={() =>
                  setPreviewUrl((old) => {
                    if (old) URL.revokeObjectURL(old);
                    return null;
                  })
                }
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
                if (file) handlePreview(file);
                if (fileRef.current) fileRef.current.value = "";
              }}
            />
            <Input
              value={input}
              onChange={(e) => onChangeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="输入消息，Enter 发送"
              className="flex-1 text-gray-900 placeholder:text-gray-500 h-11"
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              图片
            </Button>
            <Button onClick={handleSend}>发送</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
