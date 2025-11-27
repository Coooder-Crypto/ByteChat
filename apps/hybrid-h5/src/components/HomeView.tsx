import { HomeProps } from "@bytechat/core";
import { RoomForm } from "@bytechat/ui";

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
      <RoomForm
        userId={userId}
        roomId={roomId}
        wsUrl={wsUrl}
        roomList={roomList}
        onChangeUser={onChangeUser}
        onChangeRoom={onChangeRoom}
        onChangeWs={onChangeWs}
        onJoin={onJoin}
      />
    </div>
  );
}
