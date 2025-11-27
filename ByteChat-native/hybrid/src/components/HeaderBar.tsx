import { ChatHeader } from "@bytechat/ui";

type HeaderBarProps = {
  view: "home" | "chat";
  roomId?: string;
  status?: { text: string; tone: "ok" | "warn" | "fail" | "muted" };
  onBack?: () => void;
};

export function HeaderBar({ view, roomId, status, onBack }: HeaderBarProps) {
  const isChat = view === "chat";
  return (
    <ChatHeader
      title={isChat ? `房间：${roomId || ""}` : "ByteChat Hybrid"}
      roomId={isChat ? roomId : undefined}
      status={status}
      onBack={isChat ? onBack : undefined}
    />
  );
}
