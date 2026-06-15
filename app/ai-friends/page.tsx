"use client";

import { useEffect, useState, useMemo } from "react";
import { AIFriendsInbox } from "@/components/ai-friends/AIFriendsInbox";
import { AIFriendsChatRoom } from "@/components/ai-friends/AIFriendsChatRoom";
import { AIFriendDirectRoute } from "@/components/ai-friends/AIFriendDirectRoute";
import { friendChatGroups, type FriendChatGroup } from "@/lib/ai/friendChatGroups";
import { readStoredFriendChatGroup } from "@/components/ai-friends/friendChatGroupStorage";
import { readStoredAIFriend } from "@/components/ai-friends/aiFriendRosterStorage";
import { defaultUserProfile, type UserProfile, readUserProfile } from "@/components/ai-friends/friendSettings";
import { MessageCircle, UserRound } from "lucide-react";
import Link from "next/link";

type ActivePanel = { type: "group"; id: string } | { type: "dm"; id: string } | null;

export default function AIFriendsPage() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [active, setActive] = useState<ActivePanel>(null);
  const [activeGroup, setActiveGroup] = useState<FriendChatGroup | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>(defaultUserProfile);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener("resize", check);
    setUserProfile(readUserProfile());
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!active) { setActiveGroup(null); return; }

    function loadGroup() {
      if (active!.type === "group") {
        const g = readStoredFriendChatGroup(active!.id) ?? friendChatGroups.find((x) => x.id === active!.id);
        setActiveGroup(g ?? null);
      } else {
        const friend = readStoredAIFriend(active!.id);
        if (friend) {
          setActiveGroup({
            id: `dm-${friend.id}`,
            name: friend.name,
            description: friend.title,
            lastMessage: friend.title,
            lastTime: "刚刚",
            unread: 0,
            accent: friend.color,
            style: `一对一私聊 · ${friend.relationship}`,
            mode: "normal",
            userState: `用户正在和 ${friend.name} 私聊。`,
            friends: [friend],
            initialMessages: [{ friendId: friend.id, content: `我在。今天想跟我聊点什么？` }]
          });
        } else {
          setActiveGroup(null);
        }
      }
    }

    loadGroup();
    window.addEventListener("storage", loadGroup);
    return () => window.removeEventListener("storage", loadGroup);
  }, [active]);

  // Desktop layout: left inbox + right chat
  if (isDesktop) {
    return (
      <main className="app-backdrop h-dvh overflow-hidden flex">
        {/* Left panel: inbox */}
        <div className="flex-shrink-0 w-[360px] border-r border-gold-200/20 bg-cream-warm h-dvh flex flex-col">
          <AIFriendsInbox
            onSelectConversation={(id, type) => setActive({ type, id })}
            activeConversationId={active?.id ?? null}
          />
        </div>

        {/* Right panel: chat */}
        <div className="flex-1 min-w-0 h-dvh">
          {activeGroup ? (
            <AIFriendsChatRoom group={activeGroup} fullWidth />
          ) : (
            <div className="flex h-full items-center justify-center bg-cream-warm">
              <div className="text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-manor-100">
                  <MessageCircle size={28} className="text-ink-muted" />
                </div>
                <p className="mt-4 text-[15px] font-semibold text-ink-soft">ziki 的朋友庄园</p>
                <p className="mt-1 text-[13px] text-ink-muted">选择左侧对话开始聊天</p>
                <div className="flex items-center justify-center gap-3 mt-5">
                  <Link className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[14px] bg-manor-100 text-[13px] font-medium text-ink-soft hover:bg-manor-200" href="/ai-friends/people">
                    <UserRound size={15} />
                    人物
                  </Link>
                  <Link className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[14px] bg-manor-100 text-[13px] font-medium text-ink-soft hover:bg-manor-200" href="/ai-friends/setting">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                    设置
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  // Mobile layout: standard phone-shell inbox
  return <AIFriendsInbox />;
}
