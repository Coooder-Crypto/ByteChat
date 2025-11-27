"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadBasics, persistBasics } from "../components/storage";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

// TODO: monorepo with native app
export default function HomePage() {
  const basics = loadBasics();
  const [userId, setUserId] = useState(basics.userId);
  const [roomId, setRoomId] = useState(basics.roomId);
  const wsUrl = basics.wsUrl;

  useEffect(() => {
    persistBasics(userId, roomId, wsUrl);
  }, [userId, roomId, wsUrl]);

  const joinHref = `/chat?roomId=${encodeURIComponent(roomId)}&userId=${encodeURIComponent(
    userId
  )}&ws=${encodeURIComponent(wsUrl)}`;

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-gray-900 p-4 flex flex-col gap-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">ByteChat Web</h1>
          <p className="text-sm text-gray-600">配置用户和房间，点击进入聊天室</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="用户 ID">
            <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="u-123" />
          </Field>
          <Field label="房间 ID">
            <Input value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder="lobby" />
          </Field>
        </div>
        <div className="flex justify-end">
          <Link href={joinHref}>
            <Button>进入聊天室</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-gray-700">{label}</span>
      {children}
    </div>
  );
}
