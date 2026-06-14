import { AvatarRenderer } from "@/components/avatar/AvatarRenderer";
import { FurnitureGrid } from "@/components/room/FurnitureGrid";
import { RoomEditor } from "@/components/room/RoomEditor";
import { MessageComposer } from "@/components/messages/MessageComposer";
import { MessageCard } from "@/components/messages/MessageCard";
import { type FurnitureItem, type ManorMessage, type Profile, type Room, defaultAvatarConfig } from "@/lib/db/types";

type RoomViewProps = {
  owner: Profile;
  room: Room;
  furniture: FurnitureItem[];
  messages: ManorMessage[];
  currentUserId?: string;
};

export function RoomView({ owner, room, furniture, messages, currentUserId }: RoomViewProps) {
  const isOwner = currentUserId === owner.id;

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <section className="rounded-[24px] bg-white p-6 pixel-border">
        <div className="flex flex-col items-center text-center">
          <AvatarRenderer config={owner.avatar_config ?? defaultAvatarConfig} size="large" />
          <h1 className="mt-4 text-3xl font-black">{room.name}</h1>
          <p className="mt-2 max-w-md text-ink/70">{room.description || "这个房间还在慢慢布置中。"}</p>
          <div className="mt-4 rounded-full bg-cream px-4 py-2 text-sm font-bold">
            房主：{owner.nickname} · 主题：{room.theme}
          </div>
          {isOwner ? <RoomEditor room={room} /> : null}
        </div>
        <div className="mt-6">
          <FurnitureGrid items={furniture} />
        </div>
      </section>
      <section className="rounded-[24px] bg-white p-6 pixel-border">
        <h2 className="text-2xl font-black">房间留言板</h2>
        <div className="mt-4">
          <MessageComposer roomId={room.id} />
        </div>
        <div className="mt-5 space-y-3">
          {messages.length > 0 ? (
            messages.map((message) => (
              <MessageCard key={message.id} message={message} canDelete={currentUserId === message.author_id || isOwner} />
            ))
          ) : (
            <div className="rounded-2xl bg-cream p-5 text-center font-bold text-ink/60">还没有留言，第一张纸条正在等你。</div>
          )}
        </div>
      </section>
    </div>
  );
}
