"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { GitBranch, Key, Pin, PinOff, Search, Settings, Trash2, UserRound, Users } from "lucide-react";
import { type AIFriend } from "@/lib/ai/friendGroup";
import { friendChatGroups, type FriendChatGroup } from "@/lib/ai/friendChatGroups";
import { GroupAvatarStack } from "@/components/ai-friends/GroupAvatarStack";
import { AvatarCircle } from "@/components/ai-friends/AvatarCircle";
import {
  type FriendSettingsMap,
  getConfiguredFriends,
  readFriendSettings
} from "@/components/ai-friends/friendSettings";
import {
  deleteStoredFriendChatGroup,
  readVisibleFriendChatGroups
} from "@/components/ai-friends/friendChatGroupStorage";
import {
  deleteStoredAIFriend,
  readVisibleAIFriends
} from "@/components/ai-friends/aiFriendRosterStorage";
import { getPinnedChats, pinChat, unpinChat } from "@/components/ai-friends/pinStorage";
import { getLastActivity } from "@/components/ai-friends/activityStorage";
import { clearUnread, getUnread, seedInitialUnreads } from "@/components/ai-friends/unreadStorage";

/* ═══ 统一的对话项类型 ═══ */
type ConversationItem = {
  id: string;
  type: "group" | "dm";
  name: string;
  description: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  accent: string;
  style: string;
  friends: AIFriend[];
  configuredFriends: AIFriend[];
  friendLine: string;
  /** 最近活动时间戳 */
  lastActivity: number;
};

export function AIFriendsInbox() {
  const [query, setQuery] = useState("");
  const [settings, setSettings] = useState<FriendSettingsMap>({});
  const [sourceGroups, setSourceGroups] = useState<FriendChatGroup[]>(friendChatGroups);
  const [friends, setFriends] = useState<AIFriend[]>([]);
  const [mounted, setMounted] = useState(false);
  const [pinned, setPinned] = useState<string[]>([]);
  const [menuTarget, setMenuTarget] = useState<string | null>(null);
  const [splash, setSplash] = useState(true);

  const [unreadRefresh, setUnreadRefresh] = useState(0);

  useEffect(() => {
    setSettings(readFriendSettings());
    setSourceGroups(readVisibleFriendChatGroups());
    setFriends(readVisibleAIFriends());
    setPinned(getPinnedChats());
    seedInitialUnreads();
    requestAnimationFrame(() => setMounted(true));
    // 首次加载开场动画
    const timer = setTimeout(() => setSplash(false), 1400);
    // 从聊天页返回时刷新未读数
    const onFocus = () => setUnreadRefresh((c) => c + 1);
    const onStorage = () => setUnreadRefresh((c) => c + 1);
    const refreshAll = () => {
      setSettings(readFriendSettings());
      setSourceGroups(readVisibleFriendChatGroups());
      setFriends(readVisibleAIFriends());
      setUnreadRefresh((c) => c + 1);
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    window.addEventListener("user-profile-changed", refreshAll);
    window.addEventListener("friend-updated", refreshAll);
    window.addEventListener("group-avatar-changed", refreshAll);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("user-profile-changed", refreshAll);
      window.removeEventListener("friend-updated", refreshAll);
      window.removeEventListener("group-avatar-changed", refreshAll);
    };
  }, []);

  /* ── 合并所有对话 ── */
  const conversations = useMemo<ConversationItem[]>(() => {
    // 群聊
    const groupItems: ConversationItem[] = sourceGroups.map((group) => {
      const cfg = getConfiguredFriends(group.id, group.friends, settings);
      return {
        id: group.id,
        type: "group" as const,
        name: group.name,
        description: group.description,
        lastMessage: group.lastMessage,
        lastTime: group.lastTime,
        unread: getUnread(group.id),
        accent: group.accent,
        style: group.style,
        friends: group.friends,
        configuredFriends: cfg,
        friendLine: cfg.map((f) => f.name).join("、"),
        lastActivity: getLastActivity(group.id)
      };
    });

    // 私聊（已创建的 AI 朋友）
    const dmItems: ConversationItem[] = friends.map((friend) => ({
      id: `dm-${friend.id}`,
      type: "dm" as const,
      name: friend.name,
      description: friend.title,
      lastMessage: friend.title,
      lastTime: "",
      unread: getUnread(`dm-${friend.id}`),
      accent: friend.color,
      style: `一对一私聊 · ${friend.relationship}`,
      friends: [friend],
      configuredFriends: [friend],
      friendLine: "",
      lastActivity: getLastActivity(`dm-${friend.id}`)
    }));

    const all = [...groupItems, ...dmItems];

    // 排序：置顶在前，其余按最近活动倒序，无活动的保持原序
    const pinnedSet = new Set(pinned);
    return all.sort((a, b) => {
      const aPin = pinnedSet.has(a.id) ? 1 : 0;
      const bPin = pinnedSet.has(b.id) ? 1 : 0;
      if (aPin !== bPin) return bPin - aPin;
      if (aPin && bPin) return b.lastActivity - a.lastActivity;
      return b.lastActivity - a.lastActivity;
    });
  }, [sourceGroups, friends, settings, pinned, unreadRefresh]);

  const filtered = useMemo(() => {
    const kw = query.trim().toLowerCase();
    if (!kw) return conversations;
    return conversations.filter((c) =>
      `${c.name} ${c.friendLine} ${c.lastMessage}`.toLowerCase().includes(kw)
    );
  }, [conversations, query]);

  /* ── 操作 ── */
  function deleteConversation(c: ConversationItem) {
    if (!window.confirm(`删除「${c.name}」？聊天记录也会移除。`)) return;
    if (c.type === "group") {
      deleteStoredFriendChatGroup(c.id);
      window.localStorage.removeItem(`ziki-ai-chat-history-v1:${c.id}`);
      setSourceGroups(readVisibleFriendChatGroups());
    } else {
      const friendId = c.id.replace("dm-", "");
      deleteStoredAIFriend(friendId);
      window.localStorage.removeItem(`ziki-ai-chat-history-v1:${c.id}`);
      setFriends(readVisibleAIFriends());
      setSettings(readFriendSettings());
    }
    clearUnread(c.id);
    unpinChat(c.id);
    setPinned(getPinnedChats());
    setUnreadRefresh((c2) => c2 + 1);
  }

  function togglePin(c: ConversationItem) {
    if (pinned.includes(c.id)) {
      unpinChat(c.id);
    } else {
      pinChat(c.id);
    }
    setPinned(getPinnedChats());
    setMenuTarget(null);
  }

  const totalUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + c.unread, 0),
    [conversations]
  );

  return (
    <main className="app-backdrop h-dvh overflow-hidden relative">
      {/* ═══ 入场动画 ═══ */}
      <div
        className={`absolute inset-0 z-50 flex items-center justify-center bg-cream-warm transition-all duration-700 ease-out pointer-events-none ${
          splash ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden={!splash}
      >
        <div className={`flex flex-col items-center gap-4 transition-all duration-700 delay-100 ${splash ? "translate-y-0 scale-100" : "translate-y-6 scale-95"}`}>
          <div
            className="text-[64px] animate-bounce select-none"
            style={{ animationDuration: "2s" }}
          >
            🌿
          </div>
          <p className="font-semibold text-ink-deep tracking-[-0.01em]" style={{ fontFamily: "Playfair Display, serif" }}>
            ziki 的朋友庄园
          </p>
          <div className="flex gap-1.5 pt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-sage-400 animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" style={{ animationDelay: "0.15s" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" style={{ animationDelay: "0.3s" }} />
          </div>
        </div>
      </div>

      <div className="phone-shell mx-auto flex h-dvh min-h-0 max-w-[440px] flex-col bg-cream-warm">

        {/* ═══ 头部 ═══ */}
        <header className="sticky top-0 z-10 bg-cream-warm/95 backdrop-blur-2xl px-5 pb-3 pt-5">
          <div className="flex items-center justify-between">
            <h1 className="text-[26px] font-bold leading-[1.15] tracking-[-0.02em] text-ink-deep">
              消息
            </h1>
            <div className="flex items-center gap-1">
              <Link
                className="grid h-8 w-8 place-items-center rounded-full text-ink-muted transition hover:bg-manor-100 hover:text-ink-soft"
                href="/ai-friends/setting"
                title="API 设置"
              >
                <Key size={15} />
              </Link>
              <Link
                className="grid h-8 w-8 place-items-center rounded-full text-ink-muted transition hover:bg-manor-100 hover:text-ink-soft"
                href="/ai-friends/people"
                title="人物"
              >
                <GitBranch size={16} />
              </Link>
            </div>
          </div>

          <label className="mt-3 flex h-9 items-center gap-2.5 rounded-[14px] bg-white/80 px-3.5 text-ink-muted shadow-sm ring-1 ring-black/[0.03] transition focus-within:ring-gold-200/50">
            <Search size={15} />
            <input
              className="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-faint"
              maxLength={40} placeholder="搜索" value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </header>

        {/* ═══ 统一对话列表 ═══ */}
        <section className="soft-scrollbar min-h-0 flex-1 overflow-y-auto">
          <div>
            {filtered.map((c, i) => {
              const isPinned = pinned.includes(c.id);
              return (
                <div
                  key={c.id}
                  className="group relative"
                  style={{
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? "translateY(0)" : "translateY(6px)",
                    transition: `all 0.3s ease ${i * 0.03}s`
                  }}
                >
                  <Link
                    className={`flex items-center gap-3 px-4 py-3 transition-colors duration-150 active:bg-manor-100 ${
                      isPinned ? "bg-gold-50/30" : ""
                    }`}
                    href={c.type === "dm" ? `/ai-friends/dm/${c.id.replace("dm-", "")}` : `/ai-friends/${c.id}`}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setMenuTarget(menuTarget === c.id ? null : c.id);
                    }}
                  >
                    {/* 1. 头像 */}
                    {c.type === "group" ? (
                      <GroupAvatarStack accent={c.accent} friends={c.configuredFriends} groupId={c.id} size="sm" />
                    ) : (
                      <AvatarCircle avatar={c.configuredFriends[0]?.avatar} emoji={c.configuredFriends[0]?.emoji} className="h-11 w-11 text-sm" color={c.accent} label={c.name} />
                    )}

                    {/* 主体 */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        {/* 2. 名称 */}
                        <h2 className="truncate text-[15px] font-semibold leading-5 text-ink-deep">
                          {isPinned && <Pin size={10} className="inline mr-1 text-gold-500 -translate-y-px" />}
                          {c.name}
                        </h2>
                        {/* 4. 时间 */}
                        {c.lastTime ? (
                          <span className="shrink-0 text-[11px] text-ink-faint">{c.lastTime}</span>
                        ) : null}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        {/* 3. 最后一条消息 */}
                        <p className="min-w-0 flex-1 truncate text-[13px] leading-5 text-ink-soft">{c.lastMessage}</p>
                        {/* 5. 未读数 */}
                        {c.unread > 0 && <span className="manor-badge">{c.unread}</span>}
                      </div>
                    </div>
                  </Link>

                  {/* 右键/长按菜单 */}
                  {menuTarget === c.id && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setMenuTarget(null)} />
                      <div className="absolute right-4 top-10 z-40 w-32 overflow-hidden rounded-[14px] bg-cream/97 shadow-manor-lg border border-gold-200/20 backdrop-blur-2xl animate-fade-up py-1">
                        <button
                          className="flex items-center gap-2 h-9 w-full px-3.5 text-[12px] text-ink hover:bg-manor-100"
                          onClick={() => togglePin(c)}
                        >
                          {isPinned ? <><PinOff size={13} /> 取消置顶</> : <><Pin size={13} /> 置顶</>}
                        </button>
                        {c.type === "group" && (
                          <Link
                            className="flex items-center gap-2 h-9 w-full px-3.5 text-[12px] text-ink hover:bg-manor-100"
                            href={`/ai-friends/settings/${c.id}`}
                            onClick={() => setMenuTarget(null)}
                          >
                            <Users size={13} /> 设置
                          </Link>
                        )}
                        <button
                          className="flex items-center gap-2 h-9 w-full px-3.5 text-[12px] text-rose-600 hover:bg-rose-50"
                          onClick={() => { setMenuTarget(null); deleteConversation(c); }}
                        >
                          <Trash2 size={13} /> 删除
                        </button>
                      </div>
                    </>
                  )}

                  {/* 淡分割线 */}
                  <div className="mx-4 border-b border-black/[0.03]" />
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="flex min-h-32 flex-col items-center justify-center gap-1 px-6 py-10 text-center">
              <p className="text-sm text-ink-muted">{conversations.length === 0 ? "还没有对话，去「人物」页创建你的第一个 AI 朋友和群聊吧。" : "没有找到相关对话"}</p>
            </div>
          )}

          <div className="h-4" />
        </section>

        {/* ═══ 底部导航 ═══ */}
        <nav className="grid shrink-0 grid-cols-3 border-t border-gold-200/20 bg-cream-warm/95 px-2 py-2 text-[10px] font-medium backdrop-blur-2xl">
          <button className="relative flex flex-col items-center gap-1 text-sage-600">
            <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            消息
            {totalUnread > 0 && (
              <span className="absolute -top-1 right-2 min-w-[18px] h-[18px] grid place-items-center rounded-full bg-rose-500 text-white text-[10px] font-bold px-1 shadow-[0_1px_4px_rgba(201,122,108,0.35)]">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </button>
          <Link className="flex flex-col items-center gap-1 text-ink-muted transition hover:text-ink-soft" href="/ai-friends/people">
            <UserRound size={22} strokeWidth={1.8} />
            人物
          </Link>
          <Link className="flex flex-col items-center gap-1 text-ink-muted transition hover:text-ink-soft" href="/ai-friends/setting">
            <Settings size={22} strokeWidth={1.8} />
            设置
          </Link>
        </nav>
      </div>

    </main>
  );
}
