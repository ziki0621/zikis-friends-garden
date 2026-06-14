"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, GitBranch, RefreshCw, UserPlus, Users } from "lucide-react";
import { AvatarCircle } from "@/components/ai-friends/AvatarCircle";
import {
  defaultUserProfile, type UserProfile, readUserProfile, writeUserProfile
} from "@/components/ai-friends/friendSettings";
import { readVisibleAIFriends, createStoredAIFriend } from "@/components/ai-friends/aiFriendRosterStorage";
import { createStoredFriendChatGroup } from "@/components/ai-friends/friendChatGroupStorage";
import { readVisibleFriendChatGroups } from "@/components/ai-friends/friendChatGroupStorage";
import { type AIFriend } from "@/lib/ai/friendGroup";
import { resetAllData, backupAllData, hasBackup, restoreFromBackup, discardBackup } from "@/components/ai-friends/resetStorage";

export default function PeoplePage() {
  const [profile, setProfile] = useState<UserProfile>(defaultUserProfile);
  const [draftProfile, setDraftProfile] = useState<UserProfile>(defaultUserProfile);
  const [friends, setFriends] = useState<AIFriend[]>([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [creating, setCreating] = useState<"group" | "friend" | null>(null);
  const [newName, setNewName] = useState("");
  const [backupExists, setBackupExists] = useState(false);

  useEffect(() => {
    refreshData();
    setBackupExists(hasBackup());
    window.addEventListener("storage", refreshData);
    return () => window.removeEventListener("storage", refreshData);
  }, []);

  function refreshData() {
    setProfile(readUserProfile());
    setFriends(readVisibleAIFriends());
  }

  function saveProfile() {
    writeUserProfile(draftProfile);
    setProfile(draftProfile);
    setEditingProfile(false);
    refreshData();
  }

  function doCreate(type: "group" | "friend") {
    const name = newName.trim();
    if (!name) return;
    if (type === "friend") {
      const friend = createStoredAIFriend(name);
      setNewName(""); setCreating(null);
      window.location.href = `/ai-friends/dm/${friend.id}`;
    } else {
      const group = createStoredFriendChatGroup(name);
      setNewName(""); setCreating(null);
      window.location.href = `/ai-friends/settings/${group.id}`;
    }
  }

  return (
    <main className="app-backdrop h-dvh overflow-hidden">
      <div className="phone-shell mx-auto flex h-dvh min-h-0 max-w-[440px] flex-col bg-cream-warm">

        <header className="sticky top-0 z-10 border-b border-gold-200/20 bg-cream-warm/95 backdrop-blur-2xl px-4 py-3">
          <div className="flex items-center gap-3">
            <Link className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-manor-100" href="/ai-friends">
              <ArrowLeft size={19} />
            </Link>
            <h1 className="text-[22px] font-semibold leading-[1.2] tracking-[-0.02em] text-ink-deep">人物</h1>
            <div className="flex-1" />
            <button
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sage-500 text-white shadow-manor-sage transition hover:bg-sage-600"
              onClick={() => { setCreating(creating ? null : "group"); setNewName(""); }}
            >
              <Users size={17} />
            </button>
          </div>
        </header>

        <section className="soft-scrollbar min-h-0 flex-1 overflow-y-auto bg-white/60">

          {/* 新建表单 */}
          {creating && (
            <div className="border-b border-gold-200/20 bg-cream-warm px-4 py-3 animate-fade-up">
              <div className="flex items-center gap-2 mb-3">
                <button
                  className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition ${creating === "group" ? "bg-sage-500 text-white" : "bg-manor-100 text-ink-muted"}`}
                  onClick={() => setCreating("group")}
                >
                  <Users size={13} className="inline mr-1" />
                  新建群聊
                </button>
                <button
                  className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition ${creating === "friend" ? "bg-sage-500 text-white" : "bg-manor-100 text-ink-muted"}`}
                  onClick={() => setCreating("friend")}
                >
                  <UserPlus size={13} className="inline mr-1" />
                  新建朋友
                </button>
              </div>
              <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); doCreate(creating); }}>
                <input
                  className="manor-input h-9 min-w-0 flex-1 px-3.5 text-sm"
                  maxLength={18}
                  placeholder={creating === "friend" ? "朋友名字..." : "群聊名称..."}
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <button className="manor-btn-primary h-9 px-4 text-sm disabled:opacity-40" disabled={newName.trim().length === 0} type="submit">
                  创建
                </button>
              </form>
            </div>
          )}

          {/* 我 */}
          <div className="border-b border-gold-200/20 px-4 py-4">
            {editingProfile ? (
              <div className="animate-fade-up space-y-3">
                <div className="flex items-center gap-3">
                  <AvatarCircle
                    avatar={draftProfile.avatar}
                    emoji={draftProfile.emoji}
                    className="h-14 w-14 text-base shadow-md ring-[3px] ring-white"
                    color={draftProfile.color}
                    label={draftProfile.name}
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <input className="manor-input w-full px-3 py-2 text-[14px] font-semibold" maxLength={18} placeholder="昵称" value={draftProfile.name} onChange={(e) => setDraftProfile({ ...draftProfile, name: e.target.value })} />
                    <input className="manor-input w-full px-3 py-2 text-[13px]" maxLength={28} placeholder="一句话介绍" value={draftProfile.title} onChange={(e) => setDraftProfile({ ...draftProfile, title: e.target.value })} />
                  </div>
                </div>
                <input
                  className="manor-input w-full px-3 py-2 text-[13px] text-center"
                  maxLength={4}
                  placeholder="emoji"
                  value={draftProfile.emoji || ""}
                  onChange={(e) => setDraftProfile({ ...draftProfile, emoji: e.target.value })}
                />
                <textarea className="manor-input w-full min-h-16 resize-none px-3 py-2 text-[13px] leading-5" maxLength={160} placeholder="我的状态..." value={draftProfile.about} onChange={(e) => setDraftProfile({ ...draftProfile, about: e.target.value })} />
                <div className="flex gap-2">
                  <button className="manor-btn-primary flex-1 h-9 text-[13px]" onClick={saveProfile}>保存</button>
                  <button className="flex-1 h-9 text-[13px] font-medium text-ink-muted rounded-[14px] bg-manor-100 hover:bg-manor-200" onClick={() => { setEditingProfile(false); setDraftProfile(profile); }}>取消</button>
                </div>
              </div>
            ) : (
              <button
                className="flex w-full items-center gap-4 text-left"
                onClick={() => { setDraftProfile({ ...profile }); setEditingProfile(true); }}
              >
                <AvatarCircle
                  avatar={profile.avatar}
                  emoji={profile.emoji}
                  className="h-14 w-14 text-base shadow-md ring-[3px] ring-white"
                  color={profile.color}
                  label={profile.name}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[17px] font-semibold text-ink-deep">{profile.name || "我"}</p>
                    <span className="text-[10px] font-medium text-sage-600 bg-sage-50 rounded-full px-2 py-0.5">编辑</span>
                  </div>
                  <p className="mt-0.5 text-[13px] text-ink-muted">{profile.title || "在庄园里散步的人"}</p>
                  {profile.about && (
                    <p className="mt-1 text-[12px] text-ink-faint">{profile.about.slice(0, 48)}</p>
                  )}
                </div>
                <ArrowLeft size={15} className="rotate-180 text-ink-faint shrink-0" />
              </button>
            )}
          </div>

          {/* AI 朋友列表 */}
          <div className="border-b border-gold-200/20 px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted">AI 朋友 · {friends.length} 位</span>
              <button
                className="text-[11px] font-medium text-sage-600 hover:text-sage-700"
                onClick={() => { setCreating("friend"); setNewName(""); }}
              >
                新建
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {friends.map((f) => (
                <Link
                  key={f.id}
                  className="flex flex-col items-center gap-1.5 min-w-[64px]"
                  href={`/ai-friends/friend/${f.id}`}
                >
                  <AvatarCircle
                    avatar={f.avatar}
                    emoji={f.emoji}
                    className="h-12 w-12 text-sm shadow-sm ring-2 ring-white"
                    color={f.color}
                    label={f.name}
                  />
                  <span className="text-[12px] font-medium text-ink-soft text-center truncate w-[72px]">{f.name}</span>
                </Link>
              ))}
              {friends.length === 0 && (
                <p className="text-[12px] text-ink-faint py-3">还没有 AI 朋友，点右边「新建」</p>
              )}
            </div>
          </div>

          {/* 菜单 */}
          <div className="px-4 py-4 space-y-2.5">
            {/* 群聊管理 */}
            {(() => {
              const visibleGroups = readVisibleFriendChatGroups();
              if (visibleGroups.length > 0) {
                return (
                  <div className="mb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-muted mb-2 px-1">群聊管理 · {visibleGroups.length} 个</p>
                    <div className="space-y-1.5">
                      {visibleGroups.map((g) => (
                        <Link
                          key={g.id}
                          className="flex items-center gap-3 rounded-[14px] bg-white px-3 py-2.5 shadow-sm ring-1 ring-black/[0.02] transition hover:shadow-md"
                          href={`/ai-friends/settings/${g.id}`}
                        >
                          <Users size={15} className="text-ink-muted shrink-0" />
                          <span className="text-[13px] font-medium text-ink-deep">{g.name}</span>
                          <ArrowLeft size={12} className="rotate-180 text-ink-faint ml-auto" />
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* 人物关系 */}
            <Link
              className="flex items-center gap-4 rounded-[18px] bg-white px-4 py-4 shadow-sm ring-1 ring-black/[0.03] transition hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
              href="/ai-friends/relations"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-gold-100 text-gold-600">
                <GitBranch size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-ink-deep">人物关系</p>
                <p className="mt-0.5 text-[12px] text-ink-muted">设定你与 AI 朋友彼此之间的关系</p>
              </div>
              <ArrowLeft size={15} className="rotate-180 text-ink-faint" />
            </Link>

            {/* 一键重置 */}
            <div className="manor-divider-gold my-3" />
            <button
              className="flex w-full items-center gap-4 rounded-[18px] bg-rose-50/60 px-4 py-4 shadow-sm ring-1 ring-rose-200/30 transition hover:bg-rose-100/70 hover:-translate-y-0.5 active:translate-y-0"
              onClick={() => {
                if (!window.confirm(
                  "确定要清除所有数据并重启吗？\n\n" +
                  "所有群聊、AI 朋友、聊天记录和设定都会被删除。\n" +
                  "你的 API Key 不会受影响。\n\n" +
                  "重置后可以在这里「撤销还原」，恢复重置前的状态。"
                )) return;
                backupAllData();
                resetAllData();
                setBackupExists(true);
                window.location.href = "/ai-friends";
              }}
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-rose-100 text-rose-500">
                <RefreshCw size={19} />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-[15px] font-semibold text-rose-600">一键重置</p>
                <p className="mt-0.5 text-[12px] text-rose-400/80">清除所有本地数据，像第一次打开一样</p>
              </div>
              <ArrowLeft size={15} className="rotate-180 text-rose-300" />
            </button>

            {/* 撤销还原 */}
            {backupExists && (
              <button
                className="mt-2.5 flex w-full items-center gap-4 rounded-[18px] bg-sage-50/60 px-4 py-4 shadow-sm ring-1 ring-sage-200/30 transition hover:bg-sage-100/70 hover:-translate-y-0.5 active:translate-y-0"
                onClick={() => {
                  if (!window.confirm("确定恢复到重置前的状态吗？\n\n所有聊天记录、朋友设定和群聊都会还原。")) return;
                  restoreFromBackup();
                  window.location.href = "/ai-friends";
                }}
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-sage-100 text-sage-600">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-undo-2"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-[15px] font-semibold text-sage-700">撤销还原</p>
                  <p className="mt-0.5 text-[12px] text-sage-500/80">恢复到重置前的所有数据</p>
                </div>
                <ArrowLeft size={15} className="rotate-180 text-sage-300" />
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
