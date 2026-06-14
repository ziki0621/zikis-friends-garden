import Link from "next/link";
import { RoomView } from "@/components/room/RoomView";
import { createClient } from "@/lib/supabase/server";
import { defaultAvatarConfig, type FurnitureItem, type ManorMessage, type Profile, type Room } from "@/lib/db/types";

type RoomPageProps = {
  params: Promise<{ userId: string }>;
};

export default async function RoomPage({ params }: RoomPageProps) {
  const { userId } = await params;

  if (userId === "ziki") {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <RoomView owner={zikiProfile} room={zikiRoom} furniture={[]} messages={[]} />
      </main>
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return <MissingConfig />;
  }

  const [{ data: owner }, { data: room }, { data: auth }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("rooms").select("*").eq("owner_id", userId).maybeSingle(),
    supabase.auth.getUser()
  ]);

  if (!owner || !room) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-3xl font-black">这个房间还没有建好</h1>
        <p className="mt-3 text-ink/70">可能朋友还没有创建 Avatar，或者房间暂时不可访问。</p>
        <Link className="mt-6 inline-flex rounded-2xl bg-ink px-5 py-3 font-black text-white" href="/garden">
          回庄园
        </Link>
      </main>
    );
  }

  const [{ data: furniture }, { data: messages }] = await Promise.all([
    supabase.from("furniture_items").select("*").eq("room_id", room.id),
    supabase.from("messages").select("*").eq("room_id", room.id).order("created_at", { ascending: false }).limit(40)
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <RoomView
        owner={owner as Profile}
        room={room as Room}
        furniture={(furniture ?? []) as FurnitureItem[]}
        messages={(messages ?? []) as ManorMessage[]}
        currentUserId={auth.user?.id}
      />
    </main>
  );
}

function MissingConfig() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-3xl font-black">还没连接 Supabase</h1>
      <p className="mt-3 text-ink/70">复制 `.env.example` 为 `.env.local` 并填入 Supabase 环境变量后，房间数据就能读取了。</p>
    </main>
  );
}

const zikiProfile: Profile = {
  id: "ziki",
  nickname: "ziki",
  bio: "庄园主人，留下了一个温暖的小主屋。",
  avatar_config: {
    ...defaultAvatarConfig,
    hairStyle: "bob",
    hairColor: "#7C3AED",
    outfit: "jacket",
    accessory: "glasses",
    expression: "calm"
  },
  personality_tag: "庄园主人",
  favorite_color: "#8B5CF6",
  created_at: null,
  updated_at: null
};

const zikiRoom: Room = {
  id: "ziki-room",
  owner_id: "ziki",
  name: "ziki 的主屋",
  description: "这里是庄园的起点。你可以看看布置，也可以去 AI ziki 那边聊聊。",
  theme: "cozy",
  layout: {},
  is_public: true,
  created_at: null,
  updated_at: null
};
