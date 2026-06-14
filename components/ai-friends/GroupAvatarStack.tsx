"use client";

import { useEffect, useState } from "react";
import { type AIFriend } from "@/lib/ai/friendGroup";
import { getGroupAvatar } from "@/components/ai-friends/groupAvatarStorage";

type GroupAvatarStackProps = {
  friends: AIFriend[];
  accent: string;
  size?: "sm" | "md" | "lg";
  groupId?: string;
};

const sizes = {
  sm: { wrapper: "h-10 w-10", item: "h-7 w-7", offset: ["left-0 top-0", "right-0 top-0", "bottom-0 left-2"] },
  md: { wrapper: "h-12 w-12", item: "h-9 w-9", offset: ["left-0 top-0", "right-0 top-0", "bottom-0 left-2.5"] },
  lg: { wrapper: "h-14 w-14", item: "h-10 w-10", offset: ["left-0 top-0", "right-0 top-0", "bottom-0 left-3"] }
};

export function GroupAvatarStack({ friends, accent, size = "md", groupId }: GroupAvatarStackProps) {
  const config = sizes[size];
  const visibleFriends = friends.slice(0, 3);
  const [customAvatar, setCustomAvatar] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (groupId) {
      setCustomAvatar(getGroupAvatar(groupId));
      const handler = () => setCustomAvatar(getGroupAvatar(groupId));
      window.addEventListener("group-avatar-changed", handler);
      window.addEventListener("storage", handler);
      return () => {
        window.removeEventListener("group-avatar-changed", handler);
        window.removeEventListener("storage", handler);
      };
    }
  }, [groupId]);

  if (customAvatar) {
    return (
      <div className={`relative shrink-0 ${config.wrapper}`} aria-hidden="true">
        <div
          className="absolute inset-0 rounded-2xl bg-cover bg-center shadow-sm ring-[2.5px] ring-cream/80"
          style={{ backgroundImage: `url("${customAvatar}")` }}
        />
      </div>
    );
  }

  return (
    <div className={`relative shrink-0 ${config.wrapper}`} aria-hidden="true">
      <div className="absolute inset-0 rounded-2xl opacity-10" style={{ backgroundColor: accent }} />
      {visibleFriends.map((friend, index) => (
        <span
          key={`${friend.id}-${index}`}
          className={`absolute grid shrink-0 place-items-center rounded-full border-[2.5px] border-cream shadow-sm ${config.item} ${config.offset[index]}`}
          style={{ background: `linear-gradient(145deg, ${friend.color}22, ${friend.color}14)` }}
          aria-hidden="true"
        >
          <span className="leading-none select-none" style={{ fontSize: "calc(55% + 1px)" }}>
            {friend.emoji || "🧩"}
          </span>
        </span>
      ))}
    </div>
  );
}
