"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, GitBranch, RefreshCw, Users } from "lucide-react";
import { AvatarCircle } from "@/components/ai-friends/AvatarCircle";
import { defaultUserProfile, type UserProfile, readUserProfile } from "@/components/ai-friends/friendSettings";
import { readVisibleAIFriends } from "@/components/ai-friends/aiFriendRosterStorage";
import { friendChatGroups } from "@/lib/ai/friendChatGroups";
import { type AIFriend } from "@/lib/ai/friendGroup";
import { resetAllData } from "@/components/ai-friends/resetStorage";

export default function PeoplePage() {
  const [profile, setProfile] = useState<UserProfile>(defaultUserProfile);
  const [friends, setFriends] = useState<AIFriend[]>([]);

  useEffect(() => {
    setProfile(readUserProfile());
    setFriends(readVisibleAIFriends());
    function refresh() { setProfile(readUserProfile()); setFriends(readVisibleAIFriends()); }
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  const firstGroupId = friendChatGroups[0]?.id ?? "inner-noise";

  return (
    <main className="app-backdrop h-dvh overflow-hidden">
      <div className="phone-shell mx-auto flex h-dvh min-h-0 max-w-[440px] flex-col bg-cream-warm">

        {/* 顶栏 */}
        <header className="sticky top-0 z-10 border-b border-gold-200/20 bg-cream-warm/95 backdrop-blur-2xl px-4 py-3">
          <div className="flex items-center gap-3">
            <Link className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-manor-100" href="/ai-friends">
              <ArrowLeft size={19} />
            </Link>
            <h1 className="text-[22px] font-semibold leading-[1.2] tracking-[-0.02em] text-ink-deep">人物</h1>
          </div>
        </header>

        <section className="soft-scrollbar min-h-0 flex-1 overflow-y-auto bg-white/60">
          {/* 我 */}
          <div className="border-b border-gold-200/20 px-4 py-5">
            <div className="flex items-center gap-4">
              <AvatarCircle
                avatar={profile.avatar}
                emoji={profile.emoji}
                className="h-14 w-14 text-base shadow-md ring-[3px] ring-white"
                color={profile.color}
                label={profile.name}
              />
              <div>
                <p className="text-[17px] font-semibold text-ink-deep">{profile.name || "我"}</p>
                <p className="mt-0.5 text-[13px] text-ink-muted">{profile.title || "在庄园里散步的人"}</p>
                {profile.about && (
                  <p className="mt-1 text-[12px] text-ink-faint">{profile.about.slice(0, 48)}</p>
                )}
              </div>
            </div>
          </div>

          {/* AI 朋友列表 */}
          <div className="border-b border-gold-200/20 px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted">AI 朋友 · {friends.length} 位</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {friends.map((f) => (
                <Link
                  key={f.id}
                  className="flex flex-col items-center gap-1.5 min-w-[64px]"
                  href={`/ai-friends/dm/${f.id}`}
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
            </div>
          </div>

          {/* 菜单入口 */}
          <div className="px-4 py-4 space-y-2.5">
            <Link
              className="flex items-center gap-4 rounded-[18px] bg-white px-4 py-4 shadow-sm ring-1 ring-black/[0.03] transition hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
              href="/ai-friends/relations"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-gold-100 text-gold-600">
                <GitBranch size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-ink-deep">人物关系</p>
                <p className="mt-0.5 text-[12px] text-ink-muted">设定你与 AI 朋友、以及朋友之间彼此的关系</p>
              </div>
              <ArrowLeft size={15} className="rotate-180 text-ink-faint" />
            </Link>

            <Link
              className="flex items-center gap-4 rounded-[18px] bg-white px-4 py-4 shadow-sm ring-1 ring-black/[0.03] transition hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
              href={`/ai-friends/settings/${firstGroupId}`}
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-sage-100 text-sage-600">
                <Users size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-ink-deep">人物设定</p>
                <p className="mt-0.5 text-[12px] text-ink-muted">编辑我的资料、AI 朋友的人设和群成员</p>
              </div>
              <ArrowLeft size={15} className="rotate-180 text-ink-faint" />
            </Link>

            {/* 一键重置 */}
            <div className="manor-divider-gold my-3" />
            <button
              className="flex w-full items-center gap-4 rounded-[18px] bg-rose-50/60 px-4 py-4 shadow-sm ring-1 ring-rose-200/30 transition hover:bg-rose-100/70 hover:-translate-y-0.5 active:translate-y-0"
              onClick={() => {
                if (!window.confirm("确定要清除所有数据并重启吗？\n\n所有群聊、AI 朋友、聊天记录和设定都会被删除。\n你的 API Key 不会受影响，可在主页 🔑 中单独管理。")) return;
                resetAllData();
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
          </div>
        </section>
      </div>
    </main>
  );
}
