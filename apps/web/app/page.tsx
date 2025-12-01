"use client";

import { useEffect, useState } from "react";
import { loadBasics, persistBasics } from "../components/storage";
import { RoomForm } from "@bytechat/ui";

// TODO: monorepo with native app
export default function HomePage() {
  const basics = loadBasics();
  const [userId, setUserId] = useState(basics.userId);
  const [roomId, setRoomId] = useState(basics.roomId);
  const wsUrl = basics.wsUrl;
  const roomList = ["lobby", "dev", "support"];

  useEffect(() => {
    persistBasics(userId, roomId, wsUrl);
  }, [userId, roomId, wsUrl]);

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-gray-900 p-4 flex flex-col gap-4">
      <RoomForm
        userId={userId}
        roomId={roomId}
        wsUrl={wsUrl}
        roomList={roomList}
        onChangeUser={setUserId}
        onChangeRoom={setRoomId}
        onChangeWs={() => {}}
        onJoin={(room) => {
          const href = `/chat?roomId=${encodeURIComponent(room)}&userId=${encodeURIComponent(
            userId
          )}&ws=${encodeURIComponent(wsUrl)}`;
          window.location.href = href;
        }}
      />
    </main>
  );
}
