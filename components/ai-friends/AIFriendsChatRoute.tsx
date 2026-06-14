"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { type FriendChatGroup } from "@/lib/ai/friendChatGroups";
import { AIFriendsChatRoom } from "@/components/ai-friends/AIFriendsChatRoom";
import { readStoredFriendChatGroup } from "@/components/ai-friends/friendChatGroupStorage";

type Props = { groupId: string; initialGroup: FriendChatGroup | null };

export function AIFriendsChatRoute({ groupId, initialGroup }: Props) {
  const [group, setGroup] = useState<FriendChatGroup | null>(initialGroup);
  const [loaded, setLoaded] = useState(Boolean(initialGroup));

  useEffect(() => {
    function refresh() { setGroup(readStoredFriendChatGroup(groupId)); setLoaded(true); }
    refresh();
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, [groupId]);

  if (group) return <AIFriendsChatRoom group={group} />;

  return (
    <main className="app-backdrop grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-[340px] rounded-[20px] bg-cream px-5 py-6 text-center shadow-manor-lg border border-gold-200/20">
        <p className="text-sm font-semibold text-ink-deep">{loaded ? "这个群聊不见了" : "正在打开..."}</p>
        <p className="mt-1.5 text-xs text-ink-muted">{loaded ? "可能已被删除。" : "稍等。"}</p>
        <Link className="manor-btn-primary mt-4 inline-flex h-9 items-center px-4 text-sm" href="/ai-friends">回到消息</Link>
      </div>
    </main>
  );
}
