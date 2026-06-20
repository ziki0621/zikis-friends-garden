"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { type MouseEvent } from "react";
import { ArrowLeft, AtSign, MoreHorizontal, Quote, Send, Settings, Smile, Trash2, X } from "lucide-react";
import {
  type AIFriend,
  type ChatHistoryMessage,
  type FriendGroupResponse,
  type FriendReply
} from "@/lib/ai/friendGroup";
import { type FriendChatGroup } from "@/lib/ai/friendChatGroups";
import { GroupAvatarStack } from "@/components/ai-friends/GroupAvatarStack";
import { AvatarCircle } from "@/components/ai-friends/AvatarCircle";
import {
  defaultUserProfile,
  type UserProfile,
  getStoredConfiguredFriends,
  readUserProfile
} from "@/components/ai-friends/friendSettings";
import {
  readFriendMemory,
  toMemoryContext,
  updateFriendMemoryFromResponse
} from "@/components/ai-friends/friendMemory";
import { readFriendRelationsForFriends } from "@/components/ai-friends/friendRelationStorage";
import { deleteStoredFriendChatGroup } from "@/components/ai-friends/friendChatGroupStorage";
import { deleteStoredAIFriend } from "@/components/ai-friends/aiFriendRosterStorage";
import { unpinChat } from "@/components/ai-friends/pinStorage";
import { touchChat } from "@/components/ai-friends/activityStorage";
import { formatRelativeTime } from "@/components/ai-friends/timeUtils";
import { clearUnread, seedInitialUnreads, incrementUnread } from "@/components/ai-friends/unreadStorage";
import {
  writePendingBatch, readPendingBatch, clearPendingBatch
} from "@/components/ai-friends/pendingStorage";
import { getUserApiConfig } from "@/components/ai-friends/apiKeyStorage";
import { getAiMode } from "@/components/ai-friends/modeStorage";
import { getWallpaperClass } from "@/components/ai-friends/wallpaperStorage";
import { useRouter } from "next/navigation";

/* ── types ── */
type TimelineItem =
  | { id: string; type: "friend"; friendId: string; name: string; color: string; content: string; replyTo?: string; tone?: FriendReply["tone"]; isNew?: boolean; timestamp?: number }
  | { id: string; type: "user"; content: string; quote?: QuoteTarget; isNew?: boolean; timestamp?: number }
  | { id: string; type: "time"; content: string };

type ApiResponse = FriendGroupResponse & { provider: string; model: string; usingMock: boolean; warning?: string };
type ApiErrorResponse = { error?: string; provider?: string; model?: string };
type TypingFriend = { name: string; color: string; avatar?: string };
type QuoteTarget = { id: string; speaker: string; content: string };
type MessageContextMenu = { x: number; y: number; target: QuoteTarget; canMention: boolean };
type SimulationPhase = "initial" | "ambient";
type MessageTiming = { beforeTypingMs: number; typingMs: number; afterSendMs: number };

export function AIFriendsChatRoom({ group, fullWidth }: { group: FriendChatGroup; fullWidth?: boolean }) {
  const [input, setInput] = useState("");
  const [friends, setFriends] = useState<AIFriend[]>(group.friends);
  const [userProfile, setUserProfile] = useState<UserProfile>(defaultUserProfile);
  const [timeline, setTimeline] = useState<TimelineItem[]>(() => buildInitialTimeline(group, group.friends));
  const [timelineLoaded, setTimelineLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingFriend, setTypingFriend] = useState<TypingFriend | null>(null);
  const [waitingForApi, setWaitingForApi] = useState(false);
  const [quoteTarget, setQuoteTarget] = useState<QuoteTarget | null>(null);
  const [contextMenu, setContextMenu] = useState<MessageContextMenu | null>(null);
  const [scrolledUp, setScrolledUp] = useState(false);
  const [headerMenu, setHeaderMenu] = useState(false);
  const [apiStatus, setApiStatus] = useState<"idle" | "connected" | "mock">("idle");
  const [wallpaper, setWallpaper] = useState("chat-wallpaper");
  const router = useRouter();
  const isDM = group.id.startsWith("dm-");

  /** 构建 API 请求体，注入用户自己的 API 配置 */
  function apiBody(extra: Record<string, unknown>) {
    const uc = getUserApiConfig();
    return {
      aiMode: getAiMode(),
      groupId: group.id,
      groupName: group.name,
      ...extra,
      ...(uc ? { apiKey: uc.apiKey, baseUrl: uc.baseUrl, model: uc.model, providerName: uc.providerName } : {})
    };
  }

  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const runRef = useRef(0);
  const chatFocusedRef = useRef(true);
  /** deliver() 闭包里的 group.id 不会随React更新——用ref同步最新值 */
  const groupIdRef = useRef(group.id);
  groupIdRef.current = group.id;

  // 追踪焦点状态
  useEffect(() => {
    chatFocusedRef.current = document.hasFocus();
    const onFocus = () => { chatFocusedRef.current = true; };
    const onBlur = () => { chatFocusedRef.current = false; };
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
    };
  });

  const chatHistory = useMemo<ChatHistoryMessage[]>(
    () => timeline.flatMap((item): ChatHistoryMessage[] => {
      if (item.type === "user") return [{ role: "user", content: fmtHistory(item.content, item.quote) }];
      if (item.type === "friend") return [{ role: "assistant", content: item.content, speaker: item.name }];
      return [];
    }),
    [timeline]
  );

  useEffect(() => {
    const next = getStoredConfiguredFriends(group.id, group.friends);
    const profile = readUserProfile();
    const stored = readStoredTimeline(group.id);
    setFriends(next);
    setUserProfile(profile);

    // 恢复未投递的消息：用户切出时 API 已返回但动画没播完
    const pending = readPendingBatch();
    let baseTimeline = stored ?? buildInitialTimeline(group, next);
    if (pending && pending.groupId === group.id && !pending.claimed) {
      const pendingItems: TimelineItem[] = pending.messages.map((m) => ({
        id: crypto.randomUUID(),
        type: "friend" as const,
        friendId: m.friendId,
        name: m.name,
        color: m.color,
        content: m.content,
        tone: m.tone as FriendReply["tone"] | undefined,
        replyTo: m.replyTo,
        isNew: false
      }));
      baseTimeline = [...baseTimeline, ...pendingItems];
      clearPendingBatch();
    }
    setTimeline(baseTimeline);
    setTimelineLoaded(true);

    function h() { setFriends(getStoredConfiguredFriends(group.id, group.friends)); setUserProfile(readUserProfile()); }
    window.addEventListener("storage", h);
    window.addEventListener("user-profile-changed", h);
    window.addEventListener("friend-updated", h);
    return () => {
      window.removeEventListener("storage", h);
      window.removeEventListener("user-profile-changed", h);
      window.removeEventListener("friend-updated", h);
    };
  }, [group]);

  useEffect(() => {
    if (!timelineLoaded) return;
    writeStoredTimeline(group.id, timeline);
  }, [group.id, timeline, timelineLoaded]);

  // 打开对话时记录活动时间 + 清零未读 + 清除旧 pending + 通知 inbox 刷新
  useEffect(() => {
    touchChat(group.id);
    clearUnread(group.id);
    seedInitialUnreads();
    // 强制 inbox 重读未读数（桌面端 inbox 始终挂载，不会自动刷新）
    window.dispatchEvent(new Event("unread-cleared"));
    setWallpaper(getWallpaperClass());
    const onWallpaper = () => setWallpaper(getWallpaperClass());
    window.addEventListener("wallpaper-changed", onWallpaper);
    return () => window.removeEventListener("wallpaper-changed", onWallpaper);
  }, [group.id]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom || !scrolledUp) {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [timeline, waitingForApi, typingFriend]);

  useEffect(() => {
    if (!timeline.some((t) => "isNew" in t && t.isNew)) return;
    const timer = setTimeout(() => {
      setTimeline((prev) => prev.map((t) => ("isNew" in t && t.isNew ? { ...t, isNew: false } : t)));
    }, 500);
    return () => clearTimeout(timer);
  }, [timeline]);

  useEffect(() => {
    if (!contextMenu) return;
    function close() { setContextMenu(null); }
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("keydown", (e: KeyboardEvent) => { if (e.key === "Escape") close(); });
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [contextMenu]);

  /* ── send ── */
  async function sendMessage() {
    const msg = input.trim();
    if (!msg) return;
    const runId = runRef.current + 1;
    runRef.current = runId;
    setInput("");
    const qt = quoteTarget;
    setQuoteTarget(null);
    setError(null);
    setLoading(true);
    setWaitingForApi(true);
    setTypingFriend(null);
    setTimeline((c) => [...c, { id: crypto.randomUUID(), type: "user", content: msg, quote: qt ?? undefined, isNew: true, timestamp: Date.now() }]);

    try {
      const mem = readFriendMemory(group.id);
      const rels = readFriendRelationsForFriends(friends);
      const hist = [...chatHistory, { role: "user" as const, content: fmtHistory(msg, qt) }].slice(-40);
      const res = await fetch("/api/ai-friends/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiBody({ message: fmtHistory(msg, qt), history: hist, memory: toMemoryContext(mem), friends, mode: group.mode, groupStyle: group.style, relations: rels, userState: userStateStr(group.userState, userProfile) }))
      });
      const data = await readRes(res);
      if (isErr(data)) throw new Error(data.error || "发送失败");
      if (!res.ok || !isOk(data)) throw new Error("发送失败");

      setWaitingForApi(false);
      setLoading(false);
      updateFriendMemoryFromResponse(group.id, friends, data);
      touchChat(group.id);
      setApiStatus(data.usingMock ? "mock" : "connected");

      // ★ 立即写入 pending batch：即使切出也能在回来时回放
      const pendingMessages = data.messages.map((m) => {
        const f = friends.find((x) => x.id === m.friendId) ?? friends[0];
        return { friendId: f.id, name: m.name || f.name, color: f.color, content: m.content, tone: m.tone, replyTo: m.replyTo };
      });
      writePendingBatch({ groupId: group.id, runId, messages: pendingMessages, claimed: false });

      const delivered = await deliver(data, runId, "initial");
      if (runRef.current === runId) {
        void ambient({ runId, userMsg: msg, baseHistory: hist, delivered });
      }
    } catch (e) {
      setError(friendlyErr(e));
    } finally {
      if (runRef.current === runId) {
        setTypingFriend(null);
        setWaitingForApi(false);
        setLoading(false);
      }
    }
  }

  function ctxMenu(e: MouseEvent, t: QuoteTarget, canMention: boolean) {
    e.preventDefault();
    setContextMenu({ x: Math.min(e.clientX, window.innerWidth - 170), y: Math.min(e.clientY, window.innerHeight - 100), target: t, canMention });
  }

  function mention(t: QuoteTarget) {
    const m = `@${t.speaker} `;
    setInput((c) => (c.includes(m.trim()) ? c : c ? `${c} ${m}` : m));
    setContextMenu(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function quote(t: QuoteTarget) { setQuoteTarget(t); setContextMenu(null); requestAnimationFrame(() => inputRef.current?.focus()); }

  function handleDeleteChat() {
    if (!window.confirm(isDM ? `删除与「${group.name}」的私聊？` : `删除「${group.name}」？聊天记录也会移除。`)) return;
    if (isDM) {
      const friendId = group.id.replace("dm-", "");
      deleteStoredAIFriend(friendId);
      window.localStorage.removeItem(`ziki-ai-chat-history-v1:dm-${friendId}`);
    } else {
      deleteStoredFriendChatGroup(group.id);
      window.localStorage.removeItem(`ziki-ai-chat-history-v1:${group.id}`);
    }
    unpinChat(group.id);
    router.push("/ai-friends");
  }

  async function deliver(data: ApiResponse, runId: number, phase: SimulationPhase) {
    const items: TimelineItem[] = data.messages.map((m) => {
      const f = friends.find((x) => x.id === m.friendId) ?? friends[0];
      return { id: crypto.randomUUID(), type: "friend", friendId: f.id, name: m.name || f.name, color: f.color, content: m.content, tone: m.tone, replyTo: m.replyTo, isNew: true, timestamp: Date.now() };
    });
    const out: Extract<TimelineItem, { type: "friend" }>[] = [];
    const sched = schedule(items, phase, group.id);
    const myGroupId = group.id;
    await sleep(phase === "ambient" ? rnd(800, 1800) : rnd(380, 900));

    for (const [i, item] of items.entries()) {
      if (item.type !== "friend") continue;

      // 桌面端切换对话时 React 更新了 props，闭包内的 group.id 不变，
      // 但 groupIdRef.current 始终同步到最新值
      if (groupIdRef.current !== myGroupId || runRef.current !== runId) return out;

      const t = sched[i] ?? fallbackTiming();
      await sleep(t.beforeTypingMs);
      if (runRef.current !== runId) return out;

      setTypingFriend({ name: item.name, color: item.color, avatar: friends.find((f) => f.id === item.friendId)?.avatar });
      await sleep(t.typingMs);
      if (runRef.current !== runId || groupIdRef.current !== myGroupId) return out;

      // 只在仍属于当前对话时才投放到时间线
      setTimeline((c) => [...c, item]);
      out.push(item);
      // 用户不在看这个聊天 → 递增未读
      if (!chatFocusedRef.current) incrementUnread(group.id);
      setTypingFriend(null);

      await sleep(t.afterSendMs);
    }

    // ★ 全部投递完成 → 清掉 pending
    clearPendingBatch();
    return out;
  }

  async function ambient({ runId, userMsg, baseHistory, delivered }: { runId: number; userMsg: string; baseHistory: ChatHistoryMessage[]; delivered: Extract<TimelineItem, { type: "friend" }>[] }) {
    // 只有 1 个或更少朋友时不续聊
    if (friends.length <= 1 || delivered.length === 0) return;
    if (!shouldAmbient(group, userMsg, delivered)) return;
    await sleep(ambientSilence(group.id, delivered.length));
    if (runRef.current !== runId) return;

    const last = delivered.at(-1);
    const hist = [...baseHistory, ...delivered.map((x) => ({ role: "assistant" as const, content: x.content, speaker: x.name }))].slice(-12);
    const mem = readFriendMemory(group.id);
    const rels = readFriendRelationsForFriends(friends);

    try {
      setWaitingForApi(true);
      const res = await fetch("/api/ai-friends/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiBody({ message: ambientTrigger(userMsg, last, delivered), history: hist, memory: toMemoryContext(mem), friends, mode: group.mode, groupStyle: group.style, relations: rels, userState: userStateStr(group.userState, userProfile), interactionType: "ambient" }))
      });
      const data = await readRes(res);
      if (runRef.current !== runId) return;
      setWaitingForApi(false);
      if (isErr(data) || !res.ok || !isOk(data)) return;
      updateFriendMemoryFromResponse(group.id, friends, data);

      // ★ 同样立即写入 pending，防止切出丢失续聊消息
      const pendingMsgs = data.messages.map((m) => {
        const f = friends.find((x) => x.id === m.friendId) ?? friends[0];
        return { friendId: f.id, name: m.name || f.name, color: f.color, content: m.content, tone: m.tone, replyTo: m.replyTo };
      });
      writePendingBatch({ groupId: group.id, runId, messages: pendingMsgs, claimed: false });

      await deliver(data, runId, "ambient");
    } catch {
      if (runRef.current === runId) { setWaitingForApi(false); setTypingFriend(null); }
    }
  }

  return (
    <main className={`${fullWidth ? "flex flex-col h-dvh overflow-hidden" : "app-backdrop h-dvh overflow-hidden"}`}>
      <div className={`${fullWidth ? "flex flex-col h-dvh overflow-hidden" : "phone-shell mx-auto flex h-dvh min-h-0 max-w-[440px] flex-col"} bg-cream-warm`}>

        {/* ═══ 顶栏 ═══ */}
        <header className="sticky top-0 z-10 border-b border-gold-200/20 bg-cream-warm/95 backdrop-blur-2xl px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <Link className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-manor-100" href="/ai-friends">
              <ArrowLeft size={19} />
            </Link>
            {isDM ? (
              <AvatarCircle avatar={friends[0]?.avatar} emoji={friends[0]?.emoji} className="h-9 w-9 text-sm" color={friends[0]?.color ?? group.accent} label={group.name} />
            ) : (
              <GroupAvatarStack accent={group.accent} friends={friends} size="sm" groupId={group.id} />
            )}
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[15px] font-semibold leading-5 text-ink-deep">{group.name}</h1>
              <div className="flex items-center gap-2">
                <p className="truncate text-[11px] leading-4 text-ink-muted">{friends.length} 位朋友</p>
                {apiStatus !== "idle" && (
                  <span className={`inline-flex items-center gap-1 shrink-0 rounded-full px-1.5 py-px text-[9px] font-medium ${
                    apiStatus === "connected"
                      ? "bg-sage-50 text-sage-600"
                      : "bg-honey-50 text-honey-600"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      apiStatus === "connected" ? "bg-sage-400" : "bg-honey-400"
                    }`} />
                    {apiStatus === "connected" ? "DeepSeek" : "Mock"}
                  </span>
                )}
              </div>
            </div>
            <div className="relative">
              <button
                className="grid h-8 w-8 place-items-center rounded-full text-ink-muted transition hover:bg-manor-100 hover:text-ink-soft"
                onClick={() => setHeaderMenu(!headerMenu)}
              >
                <MoreHorizontal size={18} />
              </button>
              {headerMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setHeaderMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 w-36 overflow-hidden rounded-[14px] bg-cream/97 shadow-manor-lg border border-gold-200/20 backdrop-blur-2xl animate-fade-up py-1">
                    {!isDM && (
                      <Link
                        className="flex items-center gap-2.5 h-9 px-3.5 text-[13px] text-ink transition hover:bg-manor-100"
                        href={`/ai-friends/settings/${group.id}`}
                        onClick={() => setHeaderMenu(false)}
                      >
                        <Settings size={14} /> 群聊设置
                      </Link>
                    )}
                    <button
                      className="flex items-center gap-2.5 h-9 w-full px-3.5 text-[13px] text-rose-600 transition hover:bg-rose-50"
                      onClick={() => { setHeaderMenu(false); handleDeleteChat(); }}
                    >
                      <Trash2 size={14} /> {isDM ? "删除私聊" : "删除群聊"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ═══ 消息区 ═══ */}
        <section
          ref={scrollRef}
          className={`${wallpaper} soft-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto px-3.5 py-4`}
          onScroll={() => {
            const el = scrollRef.current;
            if (!el) return;
            setScrolledUp(el.scrollHeight - el.scrollTop - el.clientHeight > 120);
          }}
        >
          {timeline.map((item) => {
            if (item.type === "time") {
              return (
                <div key={item.id} className="text-center">
                  <span className="manor-time-tag">{item.content}</span>
                </div>
              );
            }

            if (item.type === "user") {
              return (
                <div
                  key={item.id}
                  className={`flex justify-end gap-2 ${item.isNew ? "animate-message-in" : ""}`}
                  onContextMenu={(e) => ctxMenu(e, { id: item.id, speaker: userProfile.name, content: item.content }, false)}
                >
                  <div className="manor-bubble-user max-w-[74%] px-4 py-2.5 text-[15px] whitespace-pre-wrap">
                    {item.quote && <Q quote={item.quote} variant="user" />}
                    {item.content}
                  </div>
                  <AvatarCircle avatar={userProfile.avatar} emoji={userProfile.emoji} className="mt-4 h-8 w-8 text-[13px]" color={userProfile.color} label={userProfile.name} />
                </div>
              );
            }

            const df = friends.find((f) => f.id === item.friendId);
            const dn = df?.name ?? item.name;
            const dc = df?.color ?? item.color;

            return (
              <div
                key={item.id}
                className={`flex items-start gap-2 ${item.isNew ? "animate-message-in" : ""}`}
                onContextMenu={(e) => ctxMenu(e, { id: item.id, speaker: dn, content: item.content }, true)}
              >
                <AvatarCircle avatar={df?.avatar} emoji={df?.emoji} className="mt-4 h-8 w-8 text-[13px]" color={dc} label={dn} />
                <div className="min-w-0 max-w-[74%]">
                  <div className="mb-1 flex flex-wrap items-center gap-2 px-1">
                    <span className="text-[11px] font-semibold text-ink-soft">{dn}</span>
                    {item.tone === "tease" && <span className="text-[10px] text-rose-400">吐槽</span>}
                    {item.tone === "support" && <span className="text-[10px] text-sage-500">共情</span>}
                    {item.replyTo && <span className="text-[10px] text-ink-faint">→ {item.replyTo}</span>}
                  </div>
                  <div className="manor-bubble-friend px-4 py-2.5 text-[15px] whitespace-pre-wrap">{item.content}</div>
                </div>
              </div>
            );
          })}

          {waitingForApi || typingFriend ? <TypingBubble tf={typingFriend} wf={waitingForApi} friends={friends} /> : null}
          <div ref={endRef} />
        </section>

        {/* ═══ 输入栏 ═══ */}
        <footer className="shrink-0 border-t border-gold-200/20 bg-cream-warm/95 px-3 pb-3 pt-2.5 backdrop-blur-2xl">
          {error && (
            <div className="mb-2 flex animate-fade-up items-start gap-2 rounded-[14px] bg-rose-50 px-3 py-2.5 text-sm text-rose-700 border border-rose-100">
              <span className="mt-0.5 shrink-0 text-rose-400">!</span>
              <p className="flex-1">{error}</p>
              <button className="shrink-0 text-rose-400 hover:text-rose-600" onClick={() => setError(null)}><X size={14} /></button>
            </div>
          )}
          {quoteTarget && (
            <div className="mb-2 flex animate-fade-up items-start gap-2.5 rounded-[16px] bg-manor-100 px-3.5 py-2.5">
              <Quote className="mt-0.5 shrink-0 text-gold-500" size={15} />
              <button className="min-w-0 flex-1 text-left" onClick={() => inputRef.current?.focus()}>
                <span className="block text-[11px] font-semibold text-ink-soft">{quoteTarget.speaker}</span>
                <span className="block truncate text-[12px] text-ink-muted">{quoteTarget.content}</span>
              </button>
              <button className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-manor-200" onClick={() => setQuoteTarget(null)}><X size={13} /></button>
            </div>
          )}
          <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); void sendMessage(); }}>
            <div className="flex min-h-9 flex-1 items-end gap-2 rounded-[20px] bg-white px-4 py-2 shadow-sm ring-1 ring-black/[0.03] focus-within:ring-gold-200/50 transition-all">
              <textarea
                ref={inputRef}
                className="max-h-28 min-h-6 flex-1 resize-none bg-transparent text-[15px] leading-6 text-ink outline-none placeholder:text-ink-faint"
                maxLength={1200}
                placeholder="说点什么..."
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }}
              />
              <button className="grid h-7 w-7 shrink-0 place-items-center text-ink-muted hover:text-ink-soft" type="button">
                <Smile size={18} />
              </button>
            </div>
            <button
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-[16px] bg-sage-500 px-4 text-sm font-semibold text-white shadow-manor-sage transition hover:bg-sage-600 hover:shadow-md hover:-translate-y-px active:translate-y-0 disabled:opacity-30 disabled:shadow-none disabled:translate-y-0"
              disabled={input.trim().length === 0}
              type="submit"
            >
              <Send size={15} />
            </button>
          </form>
        </footer>

        {/* ═══ 右键菜单 ═══ */}
        {contextMenu && (
          <div className="fixed z-50 w-36 overflow-hidden rounded-[16px] bg-cream/97 p-1 shadow-manor-lg border border-gold-200/20 backdrop-blur-2xl animate-fade-up" style={{ left: contextMenu.x, top: contextMenu.y }} onClick={(e) => e.stopPropagation()}>
            {contextMenu.canMention && (
              <button className="flex h-9 w-full items-center gap-2 rounded-[12px] px-3 text-left text-[14px] text-ink hover:bg-manor-100" onClick={() => mention(contextMenu.target)}>
                <AtSign size={14} /> @{contextMenu.target.speaker}
              </button>
            )}
            <button className="flex h-9 w-full items-center gap-2 rounded-[12px] px-3 text-left text-[14px] text-ink hover:bg-manor-100" onClick={() => quote(contextMenu.target)}>
              <Quote size={14} /> 引用
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

/* ═══════════════════════════════════════════
   sub-components
   ═══════════════════════════════════════════ */

function Q({ quote, variant }: { quote: QuoteTarget; variant: "user" | "friend" }) {
  return (
    <div className={`mb-1.5 rounded-xl border-l-[3px] px-2.5 py-1.5 text-left ${variant === "user" ? "border-white/40 bg-white/[0.14] text-white/85" : "border-gold-300 bg-gold-50/60 text-ink-soft"}`}>
      <span className="block text-[10px] font-semibold leading-4">{quote.speaker}</span>
      <span className="block truncate text-[11px] leading-4 opacity-70">{quote.content}</span>
    </div>
  );
}

function TypingBubble({ tf, wf, friends }: { tf: TypingFriend | null; wf: boolean; friends: AIFriend[] }) {
  if (!tf) {
    if (!wf) return null;
    return (
      <div className="flex items-center gap-2 pl-11 animate-fade-up">
        <div className="manor-bubble-friend px-4 py-2.5 text-[13px] text-ink-muted">
          群友正在看消息
          <span className="ml-2 inline-flex translate-y-0.5 gap-1">
            <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
          </span>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2 animate-fade-up">
      <AvatarCircle avatar={tf.avatar} className="mt-4 h-8 w-8 text-[13px]" color={tf.color} label={tf.name} />
      <div className="min-w-0 max-w-[74%]">
        <div className="mb-1 px-1"><span className="text-[11px] font-semibold text-ink-soft">{tf.name}</span></div>
        <div className="manor-bubble-friend px-4 py-2.5 text-[13px] text-ink-muted">
          正在输入
          <span className="ml-2 inline-flex translate-y-0.5 gap-1">
            <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
          </span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   utils
   ═══════════════════════════════════════════ */

async function readRes(r: Response) { const t = await r.text(); if (!t) return { error: `HTTP ${r.status}` }; try { return JSON.parse(t); } catch { return { error: `非 JSON: ${t.slice(0, 180)}` }; } }
function isErr(v: any): v is ApiErrorResponse { return "error" in v && typeof v.error === "string"; }
function isOk(v: any): v is ApiResponse { return Array.isArray(v?.messages) && Boolean(v?.summary); }
function friendlyErr(e: unknown) { const m = e instanceof Error ? e.message : ""; if (m.includes("parsed") || m.includes("JSON")) return "朋友话说乱了，重发一下。"; if (m.includes("empty") || m.includes("Model")) return "AI 没接上话，稍等一下。"; return m || "发送失败，稍后再试。"; }

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
function rnd(min: number, max: number) { return Math.floor(min + Math.random() * (max - min + 1)); }
function clamp(v: number, min: number, max: number) { return Math.min(max, Math.max(min, v)); }

function schedule(items: TimelineItem[], phase: SimulationPhase, gid: string): MessageTiming[] {
  const fi = items.filter((x): x is Extract<TimelineItem, { type: "friend" }> => x.type === "friend");
  const isDaily = gid === "daily-chaos";
  return fi.map((item, i) => {
    const prev = fi[i - 1]; const same = prev?.friendId === item.friendId; const reply = Boolean(item.replyTo);
    const first = i === 0; const pause = i > 0 && i % 3 === 0 ? rnd(900, isDaily ? 2600 : 3400) : 0;
    const before = first ? (phase === "ambient" ? rnd(900, 2200) : rnd(isDaily ? 650 : 900, isDaily ? 1800 : 2600))
      : same ? rnd(220, 850) : reply ? rnd(620, isDaily ? 1900 : 2600) + pause
      : rnd(isDaily ? 1300 : 1800, isDaily ? 4300 : 6200) + pause;
    const typing = clamp(rnd(520, 980) + item.content.length * rnd(26, 54) + (item.content.includes("，") ? 240 : 0), 760, same ? 2600 : 4200);
    const after = same ? rnd(120, 420) : i === fi.length - 1 ? rnd(phase === "ambient" ? 700 : 1200, phase === "ambient" ? 1800 : 3600) : rnd(isDaily ? 280 : 520, isDaily ? 1400 : 2200);
    return { beforeTypingMs: before, typingMs: typing, afterSendMs: after };
  });
}
function fallbackTiming(): MessageTiming { return { beforeTypingMs: rnd(700, 1800), typingMs: rnd(900, 2200), afterSendMs: rnd(500, 1400) }; }

function shouldAmbient(g: FriendChatGroup, msg: string, items: Extract<TimelineItem, { type: "friend" }>[]) {
  if (g.friends.length <= 1 || items.length === 0) return false;
  if (msg.replace(/\s+/g, "").length <= 3) return false;
  if (g.id === "daily-chaos") return items.length <= 4 ? Math.random() < 0.9 : Math.random() < 0.55;
  if (g.mode === "normal") return Math.random() < 0.5;
  if (items.length >= 4) return Math.random() < 0.38;
  return Math.random() < 0.22;
}
function ambientSilence(gid: string, count: number) { return (gid === "daily-chaos" ? rnd(2600, 6200) : rnd(4200, 9200)) + Math.max(0, count - 3) * rnd(500, 1400); }
function ambientTrigger(userMsg: string, last: Extract<TimelineItem, { type: "friend" }> | undefined, items: Extract<TimelineItem, { type: "friend" }>[]) {
  const recent = items.slice(-4).map((i) => `${i.name}: ${i.content}`).join("\n");
  return [`用户: ${userMsg}`, last ? `最后群友: ${last.name}: ${last.content}` : "", recent ? `最近:\n${recent}` : "", "自然续聊 1-3 条，可收住。"].filter(Boolean).join("\n\n");
}

function fmtHistory(content: string, quote?: QuoteTarget | null) { return quote ? `引用 ${quote.speaker}："${quote.content}"\n回复：${content}` : content; }
function userStateStr(gs: string, p: UserProfile) { return [gs, `昵称: ${p.name}`, `身份: ${p.title}`, `状态: ${p.about}`, `偏好: ${p.chatStyle}`].filter(Boolean).join("\n"); }

function buildInitialTimeline(g: FriendChatGroup, friends: AIFriend[]): TimelineItem[] {
  return [
    { id: "time-start", type: "time", content: "今天" },
    ...g.initialMessages.map((m, i) => {
      const f = friends.find((x) => x.id === m.friendId) ?? friends[0] ?? g.friends[0];
      const item: TimelineItem = { id: `init-${i}`, type: "friend", friendId: f.id, name: f.name, color: f.color, content: m.content };
      if (m.replyTo) item.replyTo = m.replyTo;
      return item;
    })
  ];
}

function key(gid: string) { return `ziki-ai-chat-history-v1:${gid}`; }
function readStoredTimeline(gid: string): TimelineItem[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key(gid)); if (!raw) return null;
    const parsed = JSON.parse(raw); if (!Array.isArray(parsed)) return null;
    const items = parsed.map((item: any): TimelineItem | null => {
      if (!item || typeof item !== "object" || typeof item.id !== "string") return null;
      if (item.type === "time" && typeof item.content === "string") return { id: item.id, type: "time", content: item.content.slice(0, 20) };
      if (item.type === "user" && typeof item.content === "string") {
        const u: Extract<TimelineItem, { type: "user" }> = { id: item.id, type: "user", content: item.content.slice(0, 1200) };
        const q = item.quote; if (q && typeof q === "object" && typeof q.id === "string" && typeof q.speaker === "string" && typeof q.content === "string") u.quote = { id: q.id.slice(0, 80), speaker: q.speaker.slice(0, 24), content: q.content.slice(0, 160) };
        return u;
      }
      if (item.type === "friend" && typeof item.friendId === "string" && typeof item.name === "string" && typeof item.color === "string" && typeof item.content === "string") {
        const f: Extract<TimelineItem, { type: "friend" }> = { id: item.id, type: "friend", friendId: item.friendId.slice(0, 40), name: item.name.slice(0, 24), color: item.color.slice(0, 20), content: item.content.slice(0, 1200) };
        if (typeof item.replyTo === "string") f.replyTo = item.replyTo.slice(0, 24);
        return f;
      }
      return null;
    }).filter((item): item is TimelineItem => item !== null).slice(-160);
    return items.length > 0 ? items : null;
  } catch { return null; }
}
function writeStoredTimeline(gid: string, tl: TimelineItem[]) { if (typeof window !== "undefined") window.localStorage.setItem(key(gid), JSON.stringify(tl.slice(-160))); }
