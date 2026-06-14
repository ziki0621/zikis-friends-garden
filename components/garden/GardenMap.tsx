"use client";

import Link from "next/link";
import { Bot, Home, MessageSquare, Sparkles, Users } from "lucide-react";
import { AvatarRenderer } from "@/components/avatar/AvatarRenderer";
import { type Profile, defaultAvatarConfig } from "@/lib/db/types";

type GardenMapProps = {
  friends: Profile[];
  currentUserId?: string;
};

const buildings = [
  { href: "/room/ziki", title: "ziki 的主屋", icon: Home, className: "left-[38%] top-[12%] bg-honey" },
  { href: "/message-wall", title: "留言墙", icon: MessageSquare, className: "left-[8%] top-[54%] bg-white" },
  { href: "/avatar/create", title: "创建 Avatar", icon: Sparkles, className: "right-[8%] top-[56%] bg-white" },
  { href: "/chat/ziki", title: "AI ziki", icon: Bot, className: "right-[18%] top-[18%] bg-grape text-white" }
];

export function GardenMap({ friends, currentUserId }: GardenMapProps) {
  const visibleFriends = friends.length > 0 ? friends : demoFriends;
  const mine = currentUserId ? friends.find((friend) => friend.id === currentUserId) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="relative min-h-[620px] overflow-hidden rounded-[28px] bg-meadow p-4 manor-tile pixel-border">
        <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-white/90 px-5 py-3 text-center font-black shadow">
          欢迎来到庄园，今天也适合串门。
        </div>
        {buildings.map((building) => {
          const Icon = building.icon;
          return (
            <Link
              key={building.href}
              className={`absolute flex min-w-36 items-center gap-2 rounded-3xl border-4 border-ink px-4 py-4 font-black shadow-pixel transition hover:-translate-y-1 ${building.className}`}
              href={building.href}
            >
              <Icon size={20} />
              {building.title}
            </Link>
          );
        })}
        <Link
          className="absolute bottom-[14%] left-[39%] flex min-w-44 items-center gap-2 rounded-3xl border-4 border-ink bg-white px-4 py-4 font-black shadow-pixel transition hover:-translate-y-1"
          href={mine ? `/room/${mine.id}` : "/avatar/create"}
        >
          <Home size={20} />
          我的房间
        </Link>
        {visibleFriends.slice(0, 10).map((friend, index) => (
          <Link
            href={`/room/${friend.id}`}
            key={friend.id}
            className="absolute flex flex-col items-center gap-1 rounded-2xl bg-white/70 p-2 text-xs font-black transition hover:-translate-y-1"
            style={{
              left: `${12 + ((index * 17) % 70)}%`,
              top: `${24 + ((index * 23) % 54)}%`
            }}
          >
            <AvatarRenderer config={friend.avatar_config ?? defaultAvatarConfig} size="small" />
            <span className="max-w-24 truncate">{friend.nickname}</span>
          </Link>
        ))}
      </section>
      <aside className="rounded-[24px] bg-white p-5 pixel-border">
        <div className="flex items-center gap-2">
          <Users size={22} />
          <h2 className="text-2xl font-black">最近加入的朋友</h2>
        </div>
        <div className="mt-5 space-y-3">
          {visibleFriends.slice(0, 8).map((friend) => (
            <Link href={`/room/${friend.id}`} key={friend.id} className="flex items-center gap-3 rounded-2xl bg-cream p-3 hover:bg-honey/30">
              <AvatarRenderer config={friend.avatar_config ?? defaultAvatarConfig} size="small" />
              <div className="min-w-0">
                <p className="truncate font-black">{friend.nickname}</p>
                <p className="truncate text-sm text-ink/60">{friend.bio || friend.personality_tag || "刚来到庄园"}</p>
              </div>
            </Link>
          ))}
        </div>
      </aside>
    </div>
  );
}

const demoFriends: Profile[] = [
  { id: "demo-moon", nickname: "月亮访客", bio: "喜欢在留言墙写小纸条", avatar_config: { ...defaultAvatarConfig, hairStyle: "bob", outfit: "dress", hairColor: "#7C3AED" }, personality_tag: "夜间散步", favorite_color: "#8B5CF6", created_at: null, updated_at: null },
  { id: "demo-sun", nickname: "橘子汽水", bio: "正在寻找最舒服的沙发", avatar_config: { ...defaultAvatarConfig, skinColor: "#D99B73", outfit: "shirt", expression: "excited" }, personality_tag: "热闹朋友", favorite_color: "#F59E0B", created_at: null, updated_at: null },
  { id: "demo-leaf", nickname: "薄荷叶", bio: "带着一盆植物入住", avatar_config: { ...defaultAvatarConfig, hairStyle: "curly", hairColor: "#111827", accessory: "glasses" }, personality_tag: "植物管理员", favorite_color: "#A7D977", created_at: null, updated_at: null }
];
