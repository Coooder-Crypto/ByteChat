import { useEffect, useRef, useState } from "react";
import { ChatProps } from "@bytechat/core";
import { ChatInputBar, MessageList } from "@bytechat/ui";

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
      <MessageList messages={messages} isMe={(id) => isMe(id)} messagesRef={messagesRef} loadingHistory={loadingHistory} />
      <ChatInputBar
        value={input}
        onChange={onChangeInput}
        onSend={handleSend}
        onPickImage={(file) => handlePreview(file)}
        previewUrl={previewUrl}
        onCancelPreview={clearPreview}
      />
    </div>
  );
}
