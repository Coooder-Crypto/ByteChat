"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useChat } from "../../components/useChat";
import { ChatHeader, ChatInputBar, MessageList } from "@bytechat/ui";
import { useRef, useState } from "react";

function ChatContent() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
    uploadAndSend,
  } = useChat({ roomId, userId, wsOverride: ws });

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
      uploadAndSend(selectedFile, input);
      clearPreview();
      setInput("");
      return;
    }
    sendMessage();
  };

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-gray-900 flex flex-col">
      <ChatHeader
        title={`房间：${roomId}`}
        roomId={roomId}
        status={status}
        onBack={() => {
          disconnect();
          router.push("/");
        }}
      />

      <MessageList messages={messages} isMe={(id) => id === userId} messagesRef={messagesRef} />

      <ChatInputBar
        value={input}
        onChange={setInput}
        onSend={handleSend}
        onPickImage={(file) => handlePreview(file)}
        previewUrl={previewUrl}
        onCancelPreview={clearPreview}
      />
    </main>
  );
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatContent />
    </Suspense>
  );
}
