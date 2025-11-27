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

export type HomeProps = {
  userId: string;
  wsUrl: string;
  roomId: string;
  roomList: string[];
  onChangeUser: (v: string) => void;
  onChangeWs: (v: string) => void;
  onChangeRoom: (v: string) => void;
  onJoin: (room: string) => void;
};

export type ChatProps = {
  roomId: string;
  status: { text: string; tone: "ok" | "warn" | "fail" | "muted" };
  messages: ChatMessage[];
  input: string;
  onBack: () => void;
  onChangeInput: (v: string) => void;
  onSend: () => void;
  onSendMedia: (file: File, text?: string) => void | Promise<void>;
  messagesRef: React.RefObject<HTMLDivElement>;
  isMe: (senderId: string) => boolean;
  loadingHistory: boolean;
};
