import { HomeProps } from "@bytechat/core";
import { Button, Input } from "@bytechat/ui";

export function HomeView({
  userId,
  wsUrl,
  roomId,
  roomList,
  onChangeUser,
  onChangeWs,
  onChangeRoom,
  onJoin,
}: HomeProps) {
  return (
    <div className="flex flex-col gap-4 p-4 bg-[#f7f8fb] min-h-screen text-gray-900">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="用户 ID">
            <Input value={userId} onChange={(e) => onChangeUser(e.target.value)} placeholder="u-123" />
          </Field>
          <Field label="房间 ID">
            <Input value={roomId} onChange={(e) => onChangeRoom(e.target.value)} placeholder="lobby" />
          </Field>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => onJoin(roomId)}>加入聊天</Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
            聊天室
          </span>
          <span className="text-sm text-gray-700">点击直接进入</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {roomList.map((r) => (
            <Button key={r} variant="outline" size="sm" onClick={() => onJoin(r)}>
              {r}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-gray-800">{label}</span>
      {children}
    </div>
  );
}
