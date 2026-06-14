"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { type AIFriend } from "@/lib/ai/friendGroup";
import { type FriendChatGroup } from "@/lib/ai/friendChatGroups";
import { AIFriendsChatRoom } from "@/components/ai-friends/AIFriendsChatRoom";
import { readStoredAIFriend } from "@/components/ai-friends/aiFriendRosterStorage";

type Props = { friendId: string };

export function AIFriendDirectRoute({ friendId }: Props) {
  const [friend, setFriend] = useState<AIFriend | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    function refresh() { setFriend(readStoredAIFriend(friendId)); setLoaded(true); }
    refresh();
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, [friendId]);

  if (friend) return <AIFriendsChatRoom group={buildDM(friend)} />;

  return (
    <main className="app-backdrop grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-[340px] rounded-[20px] bg-cream px-5 py-6 text-center shadow-manor-lg border border-gold-200/20">
        <p className="text-sm font-semibold text-ink-deep">{loaded ? "找不到这个朋友" : "正在打开..."}</p>
        <p className="mt-1.5 text-xs text-ink-muted">{loaded ? "可能已被删除。" : "稍等。"}</p>
        <Link className="manor-btn-primary mt-4 inline-flex h-9 items-center px-4 text-sm" href="/ai-friends">回到消息</Link>
      </div>
    </main>
  );
}

function buildDM(friend: AIFriend): FriendChatGroup {
  return {
    id: `dm-${friend.id}`, name: friend.name, description: friend.title,
    lastMessage: "私聊", lastTime: "刚刚", unread: 0, accent: friend.color,
    style: `一对一私聊。${friend.relationship} ${friend.style}`, mode: "normal",
    userState: `用户正在和 ${friend.name} 私聊。`, friends: [friend],
    initialMessages: [{ friendId: friend.id, content: `我在。今天想跟我聊点什么？` }]
  };
}
