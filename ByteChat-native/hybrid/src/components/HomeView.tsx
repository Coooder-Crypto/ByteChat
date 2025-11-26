import { HomeProps } from "../core/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

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
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">ByteChat</h1>
        <p className="text-sm text-gray-600">配置用户/房间，点击加入开始聊天</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow border border-gray-100 flex flex-col gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-600">用户 ID</span>
            <Input value={userId} onChange={(e) => onChangeUser(e.target.value)} placeholder="u-123" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-600">WebSocket 地址</span>
            <Input value={wsUrl} onChange={(e) => onChangeWs(e.target.value)} placeholder="ws://10.0.2.2:3000/ws" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-600">房间 ID</span>
            <Input value={roomId} onChange={(e) => onChangeRoom(e.target.value)} placeholder="lobby" />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => onJoin(roomId)}>加入聊天</Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow border border-gray-100 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
            聊天室
          </span>
          <span className="text-sm text-gray-600">点击直接进入</span>
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
