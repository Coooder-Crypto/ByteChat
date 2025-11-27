export type MsgStatus = "pending" | "ok" | "fail";

export type ChatMessage = {
  id: string;
  clientId?: string | null;
  roomId: string;
  senderId: string;
  msgType?: string;
  content?: string;
  mediaUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: number;
  localStatus?: MsgStatus;
};
