"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, GitBranch, Plus, RotateCcw, Trash2, UserRound } from "lucide-react";
import { type AIFriend, defaultFriends } from "@/lib/ai/friendGroup";
import { type FriendRelation, defaultFriendRelations } from "@/lib/ai/friendRelations";
import { AvatarCircle } from "@/components/ai-friends/AvatarCircle";
import { readVisibleAIFriends } from "@/components/ai-friends/aiFriendRosterStorage";
import {
  readStoredFriendRelations, resetStoredFriendRelations, writeStoredFriendRelations
} from "@/components/ai-friends/friendRelationStorage";
import {
  defaultUserProfile, type UserProfile, readUserProfile
} from "@/components/ai-friends/friendSettings";

const USER_ID = "user";

function userAsFriend(profile: UserProfile): AIFriend {
  return {
    id: USER_ID,
    name: profile.name || "我",
    title: "庄园的主人",
    relationship: "你自己",
    personality: "就是你自己",
    style: "你的方式",
    job: "在庄园里散步、聊天",
    careFocus: "你在意的一切",
    quirks: "你的习惯",
    boundaries: "你的边界",
    color: profile.color || "#8B7C5E",
    avatar: profile.avatar,
    emoji: profile.emoji || "🏠"
  };
}

export function AIFriendRelationsPage() {
  const [friends, setFriends] = useState<AIFriend[]>([]);
  const [relations, setRelations] = useState<FriendRelation[]>(defaultFriendRelations);
  const [selectedId, setSelectedId] = useState(defaultFriendRelations[0]?.id ?? "");
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(defaultUserProfile);
  const [editingName, setEditingName] = useState("");
  const [editingDesc, setEditingDesc] = useState("");

  useEffect(() => {
    const vf = readVisibleAIFriends();
    const sr = readStoredFriendRelations();
    const p = readUserProfile();
    setFriends(vf.length > 0 ? vf : defaultFriends);
    setRelations(sr);
    setProfile(p);
    setSelectedId(sr[0]?.id ?? "");
    // 初始化编辑值
    const initial = sr[0];
    if (initial) {
      setEditingName(initial.label);
      setEditingDesc(initial.sharedHistory + "\n" + initial.opinion + "\n" + initial.boundary);
    }
  }, []);

  const allPeople = useMemo(() => {
    const u = userAsFriend(profile);
    const exists = friends.some((f) => f.id === USER_ID);
    return exists ? friends : [u, ...friends];
  }, [friends, profile]);

  const pById = useMemo(() => new Map(allPeople.map((f) => [f.id, f])), [allPeople]);
  const visible = useMemo(
    () => relations.filter((r) => pById.has(r.fromId) && pById.has(r.toId) && r.fromId !== r.toId),
    [pById, relations]
  );
  const selected = visible.find((r) => r.id === selectedId) ?? visible[0] ?? null;
  const nodes = useMemo(() => buildNodes(allPeople), [allPeople]);

  function getPN(id: string) { return pById.get(id)?.name ?? id; }

  // 选中关系时同步编辑值
  useEffect(() => {
    if (selected) {
      setEditingName(selected.label);
      setEditingDesc([selected.sharedHistory, selected.opinion, selected.boundary].filter(Boolean).join("\n"));
    }
  }, [selectedId, selected]);

  function saveCurrent() {
    if (!selected) return;
    const updated = {
      ...selected,
      label: editingName.trim().slice(0, 10) || "关系",
      sharedHistory: editingDesc.split("\n")[0]?.trim() || "",
      opinion: editingDesc.split("\n")[1]?.trim() || "",
      boundary: editingDesc.split("\n")[2]?.trim() || ""
    };
    setRelations((c) => c.map((r) => (r.id === selected.id ? updated : r)));
    setSaved(false);
  }

  function addRelation() {
    if (allPeople.length < 2) return;
    const from = allPeople[0];
    const to = allPeople.find((f) => f.id !== from.id) ?? allPeople[0];
    const id = `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const nr: FriendRelation = {
      id, fromId: from.id, toId: to.id, label: "新关系", familiarity: "normal",
      metrics: { closeness: 48, trust: 56, tension: 20, teasing: 22, protectiveness: 30, influence: 38 },
      emotionalTone: [], nickname: "",
      sharedHistory: "",
      opinion: "",
      boundary: ""
    };
    const next = [nr, ...relations];
    setRelations(next);
    setSelectedId(id);
    setEditingName("新关系");
    setEditingDesc("");
    setSaved(false);
  }

  function deleteRelation() {
    if (!selected) return;
    if (!window.confirm(`删除「${getPN(selected.fromId)} → ${getPN(selected.toId)}」？`)) return;
    setRelations((c) => { const n = c.filter((r) => r.id !== selected.id); setSelectedId(n[0]?.id ?? ""); return n; });
    setSaved(false);
  }

  function persistAll() {
    writeStoredFriendRelations(relations);
    setSaved(true);
  }

  return (
    <main className="app-backdrop h-dvh overflow-hidden">
      <div className="phone-shell mx-auto flex h-dvh min-h-0 max-w-[440px] flex-col bg-cream-warm">

        <header className="sticky top-0 z-10 border-b border-gold-200/20 bg-cream-warm/95 backdrop-blur-2xl px-3 py-2.5">
          <div className="flex items-center gap-3">
            <Link className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-manor-100" href="/ai-friends/people">
              <ArrowLeft size={19} />
            </Link>
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sage-500 text-white shadow-manor-sage">
              <GitBranch size={17} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[15px] font-semibold leading-5 text-ink-deep">人物关系</h1>
              <p className="truncate text-[11px] text-ink-muted">你与朋友们彼此怎么看待对方</p>
            </div>
            <button className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sage-500 text-white shadow-manor-sage hover:bg-sage-600" onClick={addRelation}>
              <Plus size={17} />
            </button>
          </div>
        </header>

        <section className="soft-scrollbar min-h-0 flex-1 overflow-y-auto bg-white/60">

          {/* 关系图 */}
          <div className="border-b border-gold-200/20 bg-cream-warm px-4 py-4">
            <div className="relative h-[290px] overflow-hidden rounded-[20px] bg-manor-50 shadow-inner">
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 360 290">
                <defs>
                  <marker id="ra" markerHeight="7" markerWidth="7" orient="auto" refX="6" refY="3.5">
                    <path d="M0,0 L7,3.5 L0,7 Z" fill="#b8a87e" />
                  </marker>
                </defs>
                {visible.map((r) => {
                  const from = nodes.get(r.fromId); const to = nodes.get(r.toId);
                  if (!from || !to) return null;
                  const active = selected?.id === r.id;
                  const e = edge(from, to);
                  return (
                    <line
                      key={r.id}
                      markerEnd="url(#ra)"
                      stroke={active ? "#6a5e40" : "#d0c49e"}
                      strokeDasharray={active ? "0" : "3 4"}
                      strokeLinecap="round"
                      strokeWidth={active ? 2 : 1.2}
                      x1={e.x1} x2={e.x2} y1={e.y1} y2={e.y2}
                    />
                  );
                })}
              </svg>
              {allPeople.map((p) => {
                const n = nodes.get(p.id); if (!n) return null;
                const isUser = p.id === USER_ID;
                return (
                  <div key={p.id} className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1" style={{ left: n.x, top: n.y }}>
                    {isUser ? (
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-[3px] border-gold-400 bg-cream text-gold-600 shadow-md">
                        <UserRound size={18} />
                      </span>
                    ) : (
                      <AvatarCircle avatar={p.avatar} emoji={p.emoji} className="h-11 w-11 text-sm shadow-md ring-[3px] ring-white" color={p.color} label={p.name} />
                    )}
                    <span className={`max-w-[70px] truncate rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm ${isUser ? "bg-gold-100 text-gold-700" : "bg-white/90 text-ink-soft"}`}>
                      {p.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 关系边选择器 */}
          <div className="border-b border-gold-200/20 px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-ink-deep">关系边</h2>
              <span className="rounded-full bg-manor-100 px-2 py-0.5 text-[10px] font-semibold text-ink-muted">{visible.length} 条</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {visible.map((r) => (
                <button
                  key={r.id}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${selected?.id === r.id ? "bg-sage-500 text-white shadow-manor-sage" : "bg-manor-100 text-ink-soft hover:bg-manor-200"}`}
                  onClick={() => setSelectedId(r.id)}
                >
                  {getPN(r.fromId)} → {getPN(r.toId)}
                </button>
              ))}
            </div>
          </div>

          {/* 编辑区：极简版 */}
          {selected && (
            <div className="px-4 py-4 space-y-3">
              {/* 两端选择 */}
              <div className="flex items-center gap-2">
                <select className="manor-input h-9 min-w-0 flex-1 px-3 text-[13px] font-semibold" value={selected.fromId} onChange={(e) => {
                  setRelations((c) => c.map((r) => r.id === selected.id ? { ...r, fromId: e.target.value } : r));
                  setSaved(false);
                }}>
                  {allPeople.map((f) => (<option key={f.id} value={f.id}>{f.id === USER_ID ? "我" : f.name}</option>))}
                </select>
                <span className="text-[13px] text-ink-muted">→</span>
                <select className="manor-input h-9 min-w-0 flex-1 px-3 text-[13px] font-semibold" value={selected.toId} onChange={(e) => {
                  setRelations((c) => c.map((r) => r.id === selected.id ? { ...r, toId: e.target.value } : r));
                  setSaved(false);
                }}>
                  {allPeople.filter((f) => f.id !== selected.fromId).map((f) => (<option key={f.id} value={f.id}>{f.id === USER_ID ? "我" : f.name}</option>))}
                </select>
              </div>

              {/* 关系名称（最多10字） */}
              <label className="block text-[11px] font-semibold text-ink-muted">
                关系名称
                <span className="ml-1 text-ink-faint font-normal">({editingName.length}/10)</span>
                <input
                  className="manor-input mt-1 h-9 w-full px-3 text-[13px]"
                  maxLength={10}
                  placeholder="例如：信任的姐姐"
                  value={editingName}
                  onChange={(e) => { setEditingName(e.target.value); setSaved(false); saveCurrent(); }}
                />
              </label>

              {/* 关系说明（不限字数） */}
              <label className="block text-[11px] font-semibold text-ink-muted">
                关系说明
                <textarea
                  className="manor-input mt-1 min-h-28 w-full resize-none px-3 py-2 text-[13px] leading-5"
                  placeholder="描述这段关系...&#10;例如：娜娜总能第一时间听出我的委屈，但也知道什么时候该轻轻打断我的自责。"
                  value={editingDesc}
                  onChange={(e) => { setEditingDesc(e.target.value); setSaved(false); saveCurrent(); }}
                />
              </label>

              <button className="inline-flex h-9 items-center gap-2 rounded-full bg-rose-50 px-4 text-[12px] font-semibold text-rose-600 hover:bg-rose-100" onClick={deleteRelation}>
                <Trash2 size={14} /> 删除这条关系
              </button>
            </div>
          )}
        </section>

        <footer className="flex shrink-0 items-center justify-between border-t border-gold-200/20 bg-cream-warm/95 px-4 py-3 backdrop-blur-2xl">
          <button className="inline-flex h-9 items-center gap-2 rounded-full px-3 text-[12px] font-medium text-ink-muted hover:bg-manor-100" onClick={() => {
            const reset = resetStoredFriendRelations();
            setRelations(reset);
            setSelectedId(reset[0]?.id ?? "");
            setSaved(true);
          }}>
            <RotateCcw size={14} /> 恢复默认
          </button>
          <div className="flex items-center gap-2">
            {saved && <span className="text-[11px] font-semibold text-sage-600">已保存</span>}
            <button className="manor-btn-primary inline-flex h-9 items-center gap-2 px-4 text-[12px]" onClick={persistAll}>
              <Check size={14} /> 保存
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
}

function buildNodes(people: AIFriend[]) {
  const cx = 180, cy = 145;
  const result = new Map<string, { x: number; y: number }>();

  people.forEach((p) => {
    if (p.id === USER_ID) {
      result.set(p.id, { x: cx, y: cy });
      return;
    }
    const friendCount = people.length - 1;
    const friendIndex = people.filter((x) => x.id !== USER_ID).indexOf(p);
    const r = friendCount <= 4 ? 100 : 115;
    const angle = -Math.PI / 2 + (friendIndex / Math.max(1, friendCount)) * Math.PI * 2;
    result.set(p.id, {
      x: Math.round(cx + Math.cos(angle) * r),
      y: Math.round(cy + Math.sin(angle) * r)
    });
  });

  return result;
}

function edge(from: { x: number; y: number }, to: { x: number; y: number }) {
  const dx = to.x - from.x, dy = to.y - from.y;
  const d = Math.max(1, Math.sqrt(dx * dx + dy * dy));
  const nr = 30;
  return {
    x1: from.x + (dx / d) * nr,
    y1: from.y + (dy / d) * nr,
    x2: to.x - (dx / d) * nr,
    y2: to.y - (dy / d) * nr
  };
}
