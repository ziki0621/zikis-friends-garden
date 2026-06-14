import Link from "next/link";
import { MessageCard } from "@/components/messages/MessageCard";
import { createClient } from "@/lib/supabase/server";
import type { ManorMessage, Room } from "@/lib/db/types";

type WallMessage = ManorMessage & {
  roomOwnerId?: string;
};

export default async function MessageWallPage() {
  const supabase = await createClient();
  let messages: WallMessage[] = [];
  let currentUserId: string | undefined;

  if (supabase) {
    const [{ data }, { data: auth }] = await Promise.all([
      supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(80),
      supabase.auth.getUser()
    ]);
    const baseMessages = (data ?? []) as ManorMessage[];
    const roomIds = Array.from(new Set(baseMessages.map((message) => message.room_id).filter(Boolean))) as string[];
    const { data: rooms } = roomIds.length
      ? await supabase.from("rooms").select("id, owner_id").in("id", roomIds)
      : { data: [] };
    const ownerByRoom = new Map((rooms as Pick<Room, "id" | "owner_id">[]).map((room) => [room.id, room.owner_id]));
    messages = baseMessages.map((message) => ({
      ...message,
      roomOwnerId: message.room_id ? ownerByRoom.get(message.room_id) : undefined
    }));
    currentUserId = auth.user?.id;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl font-black">全局留言墙</h1>
          <p className="mt-2 text-ink/70">所有公开纸条都会飘到这里。</p>
        </div>
        <Link className="rounded-2xl bg-ink px-5 py-3 text-center font-black text-white" href="/garden">
          回庄园
        </Link>
      </div>
      <div className="space-y-3 rounded-[24px] bg-cream p-4 pixel-border">
        {messages.length > 0 ? (
          messages.map((message) => (
            <div key={message.id}>
              <MessageCard message={message} canDelete={currentUserId === message.author_id} />
              {message.roomOwnerId ? (
                <Link className="ml-4 mt-2 inline-flex text-sm font-bold text-grape" href={`/room/${message.roomOwnerId}`}>
                  进入相关房间
                </Link>
              ) : null}
            </div>
          ))
        ) : (
          <div className="rounded-2xl bg-white p-10 text-center font-bold text-ink/60">
            还没有公开留言。去朋友房间写下第一张纸条吧。
          </div>
        )}
      </div>
    </main>
  );
}
