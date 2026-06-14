"use client";

import { useMemo, useRef, useState } from "react";
import {
  Bell, Bot, Check, CloudRain, Clock3, MessageCircle,
  Pencil, RefreshCcw, Send, Settings2, ThumbsDown, ThumbsUp, Users
} from "lucide-react";
import {
  type AIFriend, type ChatHistoryMessage, type ChatMode,
  type FriendGroupResponse, type FriendReply,
  defaultFriends, modeLabels
} from "@/lib/ai/friendGroup";
import { cn } from "@/lib/utils";

type TimelineItem =
  | { id: string; type: "user"; content: string }
  | { id: string; type: "friend"; message: FriendReply }
  | { id: string; type: "summary"; summary: FriendGroupResponse["summary"]; memoryCandidates: string[] }
  | { id: string; type: "system"; content: string };

type ApiResponse = FriendGroupResponse & { provider: string; model: string; usingMock: boolean; warning?: string };
type ApiErrorResponse = { error?: string; provider?: string; model?: string };

const groupStyles = ["温柔治愈", "毒舌搞笑", "高效决策", "学术理性", "热闹整活", "安静陪伴"];
const modeOrder = Object.keys(modeLabels) as ChatMode[];

const starterPrompts = [
  "我最近在纠结要不要换方向，怕选错又怕继续耗着。",
  "我今天很低落，什么都不想做，但又很焦虑。",
  "我拖了好几天没开始准备面试，你们能不能把我拎起来？"
];

export function AIFriendGroupDemo() {
  const [created, setCreated] = useState(false);
  const [groupName, setGroupName] = useState("赛博朋友群");
  const [groupStyle, setGroupStyle] = useState(groupStyles[0]);
  const [userState, setUserState] = useState("最近有点内耗，想有人一起分析和催进度。");
  const [friends, setFriends] = useState<AIFriend[]>(defaultFriends);
  const [selectedFriendId, setSelectedFriendId] = useState(friends[0].id);
  const [mode, setMode] = useState<ChatMode>("analysis");
  const [input, setInput] = useState("");
  const [timeline, setTimeline] = useState<TimelineItem[]>([
    { id: "welcome", type: "system", content: "群聊已准备好。先丢一个真实问题进来，看看朋友们怎么接。" }
  ]);
  const [memory, setMemory] = useState<string[]>(["长期目标：做出 AI 朋友群聊 Demo。"]);
  const [feedback, setFeedback] = useState<Record<string, "like" | "dislike">>({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [provider, setProvider] = useState("Local mock");
  const [model, setModel] = useState("mock");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const selectedFriend = useMemo(
    () => friends.find(f => f.id === selectedFriendId) ?? friends[0],
    [friends, selectedFriendId]
  );

  const chatHistory = useMemo<ChatHistoryMessage[]>(
    () => timeline.flatMap((item): ChatHistoryMessage[] => {
      if (item.type === "user") return [{ role: "user", content: item.content }] as ChatHistoryMessage[];
      if (item.type === "friend") return [{ role: "assistant", content: item.message.content, speaker: item.message.name }] as ChatHistoryMessage[];
      return [];
    }),
    [timeline]
  );

  function createGroup() {
    setCreated(true);
    setTimeline([{ id: crypto.randomUUID(), type: "system", content: `${groupName || "AI 朋友群"}已创建。${friends.map(f => f.name).join("、")}正在群里。` }]);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function updateSelectedFriend(field: keyof AIFriend, value: string) {
    setFriends(current => current.map(f => f.id === selectedFriendId ? { ...f, [field]: value } : f));
  }

  async function sendMessage(prompt?: string) {
    const message = (prompt ?? input).trim();
    if (!message || loading) return;
    setInput(""); setLoading(true); setStatus(null);
    setTimeline(current => [...current, { id: crypto.randomUUID(), type: "user", content: message }]);

    try {
      const response = await fetch("/api/ai-friends/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history: chatHistory, friends, mode, groupStyle, userState })
      });
      const data = await response.json() as ApiResponse | ApiErrorResponse;
      if (isApiErrorResponse(data)) throw new Error(data.error || "AI 朋友接口暂时没有响应。");
      if (!response.ok) throw new Error("AI 朋友接口暂时没有响应。");
      if (!isApiResponse(data)) throw new Error("AI 朋友接口返回格式不完整。");

      appendGroupResponse(data);
      setProvider(data.provider); setModel(data.model);
      if (data.warning) setStatus(data.warning);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "发送失败，请稍后再试。");
    } finally { setLoading(false); }
  }

  async function triggerProactive(eventType: "weather" | "target") {
    if (loading) return;
    setLoading(true); setStatus(null);
    try {
      const response = await fetch("/api/ai-friends/proactive", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType, eventText: eventType === "weather" ? "当前城市降温并可能下雨，用户可能准备出门。" : "用户设置的 Demo 目标已经两天没有更新。", friends, groupStyle, userState })
      });
      const data = await response.json() as ApiResponse | ApiErrorResponse;
      if (isApiErrorResponse(data)) throw new Error(data.error || "主动消息接口暂时没有响应。");
      if (!response.ok) throw new Error("主动消息接口暂时没有响应。");
      if (!isApiResponse(data)) throw new Error("主动消息接口返回格式不完整。");

      setTimeline(current => [...current, { id: crypto.randomUUID(), type: "system", content: eventType === "weather" ? "模拟事件：天气触发。" : "模拟事件：目标未更新。" }]);
      appendGroupResponse(data);
      setProvider(data.provider); setModel(data.model);
      if (data.warning) setStatus(data.warning);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "主动消息生成失败。");
    } finally { setLoading(false); }
  }

  function appendGroupResponse(data: ApiResponse) {
    const nextItems: TimelineItem[] = data.messages.map(message => ({ id: crypto.randomUUID(), type: "friend", message }));
    nextItems.push({ id: crypto.randomUUID(), type: "summary", summary: data.summary, memoryCandidates: data.memoryCandidates });
    setTimeline(current => [...current, ...nextItems]);
    if (data.memoryCandidates.length > 0) {
      setMemory(current => Array.from(new Set([...data.memoryCandidates, ...current])).slice(0, 6));
    }
  }

  /* ── 创建前 ── */
  if (!created) {
    return (
      <main className="min-h-screen bg-manor-50 px-4 py-8 sm:py-12">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">

          {/* 左侧：创建 */}
          <section className="manor-card--elevated p-6 sm:p-8">
            <div className="mb-7 flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-[16px] bg-sage-500 text-white shadow-manor-sage">
                <Users size={20} />
              </div>
              <div>
                <h1 className="font-display text-2xl text-ink-deep">创建 AI 朋友群</h1>
                <div className="manor-accent-line mt-1.5" />
              </div>
            </div>

            <label className="block text-sm font-semibold text-ink-soft" htmlFor="group-name">群名称</label>
            <input id="group-name" className="manor-input mt-2 w-full px-4 py-3" maxLength={24} value={groupName} onChange={e => setGroupName(e.target.value)} />

            <div className="mt-5">
              <p className="text-sm font-semibold text-ink-soft">群聊风格</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {groupStyles.map(style => (
                  <button
                    key={style}
                    className={cn(
                      "rounded-[14px] border px-3.5 py-2.5 text-sm font-semibold transition-all duration-300",
                      groupStyle === style
                        ? "border-gold-400 bg-gold-50 text-gold-800 shadow-[inset_0_0_0_1px_rgba(184,150,62,0.2)]"
                        : "border-manor-200 bg-cream text-ink-soft hover:border-gold-300 hover:bg-gold-50/40"
                    )}
                    onClick={() => setGroupStyle(style)}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <label className="mt-5 block text-sm font-semibold text-ink-soft" htmlFor="user-state">用户近期状态</label>
            <textarea id="user-state" className="manor-input mt-2 min-h-24 w-full resize-none px-4 py-3 leading-6" maxLength={160} value={userState} onChange={e => setUserState(e.target.value)} />

            <button className="manor-btn-gold mt-5 inline-flex w-full items-center justify-center gap-2 px-5 py-3.5 text-base" onClick={createGroup}>
              <Check size={18} /> 创建群聊
            </button>
          </section>

          {/* 右侧：朋友 */}
          <section className="manor-card--elevated p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl text-ink-deep">默认朋友</h2>
                <div className="manor-accent-line mt-1.5" />
              </div>
              <Bot className="text-gold-500" size={24} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {friends.map(friend => (
                <div key={friend.id} className="rounded-[16px] border border-manor-200 bg-cream-warm p-4 transition hover:shadow-manor-md">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] text-sm font-bold text-white shadow-sm" style={{ backgroundColor: friend.color }}>
                      {friend.name.slice(0, 1)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink-deep">{friend.name}</p>
                      <p className="truncate text-xs text-ink-muted">{friend.title}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-[13px] leading-6 text-ink-soft">{friend.job}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    );
  }

  /* ── 群聊现场 ── */
  return (
    <main className="min-h-screen bg-manor-50 px-3 py-4 sm:px-4">
      <div className="mx-auto grid max-w-[1440px] gap-3 xl:grid-cols-[280px_minmax(0,1fr)_320px]">

        {/* 左栏 */}
        <aside className="manor-card--elevated p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">Friend Group</p>
              <h1 className="mt-1 truncate font-display text-lg text-ink-deep">{groupName}</h1>
            </div>
            <button className="grid h-10 w-10 place-items-center rounded-[14px] border border-manor-200 bg-cream text-ink-soft transition hover:bg-manor-100" onClick={() => setCreated(false)}>
              <RefreshCcw size={16} />
            </button>
          </div>

          <div className="manor-accent-line mt-3 mb-4" />

          <div className="space-y-2">
            {friends.map(friend => (
              <button
                key={friend.id}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[14px] border p-3 text-left transition-all duration-200",
                  selectedFriendId === friend.id
                    ? "border-gold-400 bg-gold-50 shadow-[inset_0_0_0_1px_rgba(184,150,62,0.15)]"
                    : "border-manor-200 bg-cream hover:border-gold-300"
                )}
                onClick={() => setSelectedFriendId(friend.id)}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] text-sm font-bold text-white shadow-sm" style={{ backgroundColor: friend.color }}>
                  {friend.name.slice(0, 1)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-ink-deep">{friend.name}</span>
                  <span className="block truncate text-[11px] text-ink-muted">{friend.title}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-[16px] border border-manor-200 bg-cream-warm p-3">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-deep">
              <Pencil size={15} /> 编辑人设
            </div>
            <label className="block text-[11px] font-semibold text-ink-muted">名字</label>
            <input className="manor-input mt-1 w-full px-3 py-2 text-sm" maxLength={24} value={selectedFriend.name} onChange={e => updateSelectedFriend("name", e.target.value)} />
            <label className="mt-3 block text-[11px] font-semibold text-ink-muted">说话风格</label>
            <textarea className="manor-input mt-1 min-h-24 w-full resize-none px-3 py-2 text-sm leading-5" maxLength={160} value={selectedFriend.style} onChange={e => updateSelectedFriend("style", e.target.value)} />
          </div>
        </aside>

        {/* 中栏 — 聊天 */}
        <section className="flex min-h-[760px] flex-col rounded-[20px] border border-manor-200 bg-cream shadow-manor-md">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gold-200/30 px-4 py-3.5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-sage-500 text-white shadow-manor-sage">
                <MessageCircle size={18} />
              </span>
              <div>
                <h2 className="font-display text-base text-ink-deep">群聊现场</h2>
                <p className="text-[11px] text-ink-muted">{provider} · {model}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {starterPrompts.map((p, i) => (
                <button key={p} className="rounded-[12px] border border-manor-200 bg-cream px-3 py-2 text-xs font-semibold text-ink-soft transition hover:border-gold-300 hover:bg-gold-50/30" onClick={() => setInput(p)}>
                  示例 {i + 1}
                </button>
              ))}
            </div>
          </header>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-manor-50 px-4 py-4 soft-scrollbar">
            {timeline.map(item => {
              if (item.type === "user") return (
                <div key={item.id} className="flex justify-end animate-fade-up">
                  <div className="manor-bubble-user max-w-[82%] px-4 py-3 leading-7">{item.content}</div>
                </div>
              );
              if (item.type === "system") return (
                <div key={item.id} className="mx-auto max-w-xl rounded-[14px] border border-manor-200 bg-cream px-3 py-2.5 text-center text-sm text-ink-muted shadow-sm">{item.content}</div>
              );
              if (item.type === "summary") return (
                <div key={item.id} className="manor-card p-4 animate-fade-up">
                  <div className="mb-3 flex items-center gap-2 font-semibold text-ink-deep">
                    <Settings2 size={15} /> 群聊总结
                  </div>
                  <div className="grid gap-3 text-sm leading-6 md:grid-cols-2">
                    <SL label="主要观点" value={item.summary.mainPoints.join("；") || "暂无"} />
                    <SL label="当前分歧" value={item.summary.disagreement} />
                    <SL label="稳妥建议" value={item.summary.safestAdvice} />
                    <SL label="下一步" value={item.summary.nextAction} />
                  </div>
                  {item.memoryCandidates.length > 0 && (
                    <div className="mt-3 rounded-[12px] bg-gold-50 px-3 py-2 text-sm text-gold-800 border border-gold-100">
                      记忆候选：{item.memoryCandidates.join("；")}
                    </div>
                  )}
                </div>
              );

              const friend = friends.find(c => c.id === item.message.friendId);
              return (
                <div key={item.id} className="flex items-start gap-3 animate-fade-up">
                  <span className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-[12px] text-sm font-bold text-white shadow-sm" style={{ backgroundColor: friend?.color ?? "#5A4F3C" }}>
                    {item.message.name.slice(0, 1)}
                  </span>
                  <div className="manor-card min-w-0 flex-1 p-3">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-ink-deep">{item.message.name}</span>
                        <span className="rounded-[8px] bg-manor-100 px-2 py-0.5 text-[10px] font-semibold text-ink-soft">{toneLabel(item.message.tone)}</span>
                        {item.message.replyTo && <span className="text-[11px] text-ink-muted">→ {item.message.replyTo}</span>}
                      </div>
                      <div className="flex gap-1">
                        <button className={cn("grid h-7 w-7 place-items-center rounded-[10px] border transition", feedback[item.id] === "like" ? "border-sage-400 bg-sage-50 text-sage-600" : "border-manor-200 text-ink-muted hover:bg-manor-100")} onClick={() => setFeedback(c => ({ ...c, [item.id]: "like" }))}>
                          <ThumbsUp size={13} />
                        </button>
                        <button className={cn("grid h-7 w-7 place-items-center rounded-[10px] border transition", feedback[item.id] === "dislike" ? "border-rose-300 bg-rose-50 text-rose-600" : "border-manor-200 text-ink-muted hover:bg-manor-100")} onClick={() => setFeedback(c => ({ ...c, [item.id]: "dislike" }))}>
                          <ThumbsDown size={13} />
                        </button>
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap leading-7 text-ink-soft">{item.message.content}</p>
                  </div>
                </div>
              );
            })}
            {loading && <div className="rounded-[14px] border border-manor-200 bg-cream px-3 py-2.5 text-sm font-semibold text-ink-muted shadow-sm animate-fade-up">朋友们正在接话...</div>}
          </div>

          <footer className="border-t border-gold-200/30 bg-cream p-3">
            {status && <p className="mb-2 rounded-[12px] bg-honey-50 px-3 py-2 text-sm text-honey-800 border border-honey-100">{status}</p>}
            <div className="flex gap-2">
              <textarea ref={inputRef} className="manor-input max-h-32 min-h-12 flex-1 resize-none px-4 py-3 leading-6" maxLength={1200} placeholder="把一个真实问题丢进群里..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void sendMessage(); } }} />
              <button className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] bg-sage-500 text-white shadow-manor-sage transition hover:bg-sage-600 disabled:opacity-30" disabled={loading || input.trim().length === 0} onClick={() => void sendMessage()}>
                <Send size={18} />
              </button>
            </div>
          </footer>
        </section>

        {/* 右栏 */}
        <aside className="space-y-3">
          <section className="manor-card--elevated p-4">
            <div className="mb-3 flex items-center gap-2 font-semibold text-ink-deep"><Settings2 size={15} /> 群聊模式</div>
            <div className="grid grid-cols-2 gap-2">
              {modeOrder.map(item => (
                <button key={item} className={cn("rounded-[12px] border px-3 py-2 text-[13px] font-semibold transition-all", mode === item ? "border-gold-400 bg-gold-50 text-gold-800" : "border-manor-200 bg-cream text-ink-soft hover:border-gold-300")} onClick={() => setMode(item)}>
                  {modeLabels[item]}
                </button>
              ))}
            </div>
          </section>

          <section className="manor-card--elevated p-4">
            <div className="mb-3 flex items-center gap-2 font-semibold text-ink-deep"><Bell size={15} /> 主动消息</div>
            <div className="grid grid-cols-2 gap-2">
              <button className="flex items-center justify-center gap-2 rounded-[12px] border border-manor-200 bg-cream px-3 py-3 text-[13px] font-semibold text-ink-soft transition hover:border-gold-300" disabled={loading} onClick={() => void triggerProactive("weather")}>
                <CloudRain size={15} /> 天气
              </button>
              <button className="flex items-center justify-center gap-2 rounded-[12px] border border-manor-200 bg-cream px-3 py-3 text-[13px] font-semibold text-ink-soft transition hover:border-gold-300" disabled={loading} onClick={() => void triggerProactive("target")}>
                <Clock3 size={15} /> 目标
              </button>
            </div>
          </section>

          <section className="manor-card--elevated p-4">
            <div className="mb-3 flex items-center gap-2 font-semibold text-ink-deep"><Bot size={15} /> API 接口</div>
            <div className="space-y-2 text-sm leading-6 text-ink-soft">
              <p><span className="font-semibold text-ink-deep">POST</span> /api/ai-friends/chat</p>
              <p><span className="font-semibold text-ink-deep">POST</span> /api/ai-friends/proactive</p>
              <p className="rounded-[10px] bg-gold-50 px-3 py-2 text-xs text-gold-800 border border-gold-100">配置 `DEEPSEEK_API_KEY` 后会调用真实模型；未配置时使用本地 mock。</p>
            </div>
          </section>

          <section className="manor-card--elevated p-4">
            <div className="mb-3 flex items-center gap-2 font-semibold text-ink-deep"><Pencil size={15} /> 记忆</div>
            <div className="space-y-2">
              {memory.map(item => (
                <div key={item} className="rounded-[10px] border border-manor-200 bg-cream-warm px-3 py-2 text-sm leading-6 text-ink-soft">{item}</div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

function SL({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] bg-cream-warm px-3 py-2 border border-manor-200/50">
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">{label}</p>
      <p className="mt-1 text-ink-soft">{value}</p>
    </div>
  );
}

function isApiErrorResponse(v: ApiResponse | ApiErrorResponse): v is ApiErrorResponse { return "error" in v && typeof v.error === "string"; }
function isApiResponse(v: ApiResponse | ApiErrorResponse): v is ApiResponse { return Array.isArray((v as Partial<ApiResponse>).messages) && Boolean((v as Partial<ApiResponse>).summary); }

function toneLabel(tone: FriendReply["tone"]) {
  return { support: "共情", tease: "吐槽", analysis: "分析", challenge: "质疑", action: "行动", summary: "总结" }[tone];
}
