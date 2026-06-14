"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Camera, Check, MessageCircle, RotateCcw } from "lucide-react";
import { type AIFriend } from "@/lib/ai/friendGroup";
import { type FriendChatGroup } from "@/lib/ai/friendChatGroups";
import { AvatarCircle } from "@/components/ai-friends/AvatarCircle";
import { GroupAvatarStack } from "@/components/ai-friends/GroupAvatarStack";
import { readVisibleAIFriends } from "@/components/ai-friends/aiFriendRosterStorage";
import {
  type FriendSettingsMap,
  getConfiguredFriends,
  readFriendSettings,
  writeFriendSettings
} from "@/components/ai-friends/friendSettings";
import {
  getGroupAvatar, setGroupAvatar, removeGroupAvatar
} from "@/components/ai-friends/groupAvatarStorage";
import { wallpapers, getWallpaper, setWallpaper, type WallpaperId } from "@/components/ai-friends/wallpaperStorage";

export function AIFriendSettingsPage({ group }: { group: FriendChatGroup }) {
  const [settings, setSettings] = useState<FriendSettingsMap>({});
  const [draftFriends, setDraftFriends] = useState<AIFriend[]>(group.friends);
  const [availableFriends, setAvailableFriends] = useState<AIFriend[]>(group.friends);
  const [saved, setSaved] = useState(false);
  const [groupAvatarUrl, setGroupAvatarUrl] = useState<string | undefined>();
  const [activeWallpaper, setActiveWallpaper] = useState<WallpaperId>("garden");

  useEffect(() => {
    const stored = readFriendSettings();
    const roster = readVisibleAIFriends();
    setSettings(stored);
    setDraftFriends(getConfiguredFriends(group.id, group.friends, stored).map((f) => ({ ...f })));
    setAvailableFriends(roster.length > 0 ? roster : group.friends);
    setGroupAvatarUrl(getGroupAvatar(group.id));
    setActiveWallpaper(getWallpaper());
  }, [group]);

  const previewLine = useMemo(() => draftFriends.map((f) => f.name).join("、"), [draftFriends]);

  function saveSettings() {
    if (draftFriends.length === 0) { window.alert("至少保留一个朋友。"); return; }
    const next = { ...settings, [group.id]: draftFriends };
    setSettings(next);
    writeFriendSettings(next);
    setSaved(true);
  }

  function resetSettings() {
    const next = { ...settings }; delete next[group.id];
    setSettings(next); writeFriendSettings(next);
    setDraftFriends(group.friends.map((f) => ({ ...f }))); setSaved(true);
  }

  function toggleFriend(friend: AIFriend) {
    setSaved(false);
    setDraftFriends((c) => {
      const exists = c.some((x) => x.id === friend.id);
      if (exists) return c.length <= 1 ? c : c.filter((x) => x.id !== friend.id);
      return [...c, friend].slice(0, 8);
    });
  }

  function pickAvatar(onDone: (dataUrl: string) => void) {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/png,image/jpeg,image/webp";
    input.onchange = async () => {
      const file = input.files?.[0]; if (!file) return;
      try { onDone(await createAvatar(file)); }
      catch (e) { window.alert(e instanceof Error ? e.message : "头像处理失败。"); }
    };
    input.click();
  }

  async function createAvatar(file: File) {
    if (!file.type.startsWith("image/")) throw new Error("请选择图片。");
    if (file.size > 4 * 1024 * 1024) throw new Error("图片太大了，4MB 以内。");
    const src = await readFile(file);
    const img = await loadImg(src);
    const c = document.createElement("canvas"); c.width = c.height = 200;
    const ctx = c.getContext("2d")!;
    const side = Math.min(img.width, img.height);
    ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 200, 200);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/webp", 0.8));
    return blob ? readFile(blob) : c.toDataURL("image/jpeg", 0.8);
  }
  function readFile(f: Blob) { return new Promise<string>((resolve, reject) => { const r = new FileReader(); r.onload = () => { if (typeof r.result === "string") resolve(r.result); else reject(new Error("失败")); }; r.onerror = () => reject(new Error("失败")); r.readAsDataURL(f); }); }
  function loadImg(s: string) { return new Promise<HTMLImageElement>((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = () => reject(new Error("解析失败")); i.src = s; }); }

  function handleGroupAvatar(url: string) {
    setGroupAvatar(group.id, url);
    setGroupAvatarUrl(url);
    setSaved(false);
    window.dispatchEvent(new Event("group-avatar-changed"));
  }
  function handleRemoveGroupAvatar() {
    removeGroupAvatar(group.id);
    setGroupAvatarUrl(undefined);
    setSaved(false);
    window.dispatchEvent(new Event("group-avatar-changed"));
  }

  return (
    <main className="app-backdrop h-dvh overflow-hidden">
      <div className="phone-shell mx-auto flex h-dvh min-h-0 max-w-[440px] flex-col bg-cream-warm">

        <header className="sticky top-0 z-10 border-b border-gold-200/20 bg-cream-warm/95 backdrop-blur-2xl px-3 py-2.5">
          <div className="flex items-center gap-3">
            <Link className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-manor-100" href="/ai-friends">
              <ArrowLeft size={19} />
            </Link>
            <GroupAvatarStack accent={group.accent} friends={draftFriends} size="sm" groupId={group.id} />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[15px] font-semibold leading-5 text-ink-deep">{group.name}</h1>
              <p className="truncate text-[11px] text-ink-muted">{previewLine}</p>
            </div>
            <Link className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-ink-soft shadow-sm hover:bg-manor-100" href={`/ai-friends/${group.id}`}>
              <MessageCircle size={18} />
            </Link>
          </div>
        </header>

        <section className="soft-scrollbar min-h-0 flex-1 overflow-y-auto bg-white/60">

          {/* 群头像 */}
          <div className="border-b border-gold-200/20 px-4 py-5">
            <div className="flex items-center gap-4">
              <button className="relative shrink-0" onClick={() => pickAvatar(handleGroupAvatar)} title="更换群头像">
                <GroupAvatarStack accent={group.accent} friends={draftFriends} size="lg" groupId={group.id} />
                <span className="absolute -bottom-0.5 -right-0.5 grid h-6 w-6 place-items-center rounded-full bg-sage-500 text-white shadow-sm ring-2 ring-white">
                  <Camera size={12} />
                </span>
              </button>
              <div>
                <p className="font-semibold text-ink-deep">群聊头像</p>
                <p className="mt-0.5 text-xs text-ink-muted">点击更换</p>
                {groupAvatarUrl && (
                  <button className="mt-1 text-[11px] text-rose-500 hover:text-rose-600" onClick={handleRemoveGroupAvatar}>移除头像</button>
                )}
              </div>
            </div>
          </div>

          {/* 群成员 */}
          <div className="border-b border-gold-200/20 px-4 py-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-ink-deep">群成员</h2>
              <span className="rounded-full bg-manor-100 px-2 py-0.5 text-[10px] font-semibold text-ink-muted">{draftFriends.length} 人</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableFriends.map((f) => {
                const selected = draftFriends.some((x) => x.id === f.id);
                return (
                  <button
                    key={f.id}
                    className={`flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-[13px] font-medium ring-1 transition ${selected ? "bg-sage-500 text-white ring-sage-500 shadow-manor-sage" : "bg-white text-ink-soft ring-manor-200 hover:ring-sage-300"}`}
                    onClick={() => toggleFriend(f)}
                  >
                    <AvatarCircle avatar={f.avatar} emoji={f.emoji} className="h-6 w-6 text-[10px]" color={f.color} label={f.name} />
                    {f.name}
                  </button>
                );
              })}
            </div>
            {draftFriends.length <= 1 && <p className="mt-2 text-[11px] text-ink-faint">至少保留一个朋友。</p>}
          </div>

          {/* 聊天背景 */}
          <div className="border-b border-gold-200/20 px-4 py-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-ink-deep">聊天背景</h2>
              <span className="rounded-full bg-manor-100 px-2 py-0.5 text-[10px] font-semibold text-ink-muted">4 种</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {wallpapers.map((wp) => {
                const active = activeWallpaper === wp.id;
                return (
                  <button
                    key={wp.id}
                    className={`rounded-[14px] border p-3 text-left transition-all ${active ? "border-sage-400 bg-sage-50 shadow-[inset_0_0_0_1px_rgba(125,155,118,0.2)]" : "border-manor-200 bg-white hover:border-gold-300"}`}
                    onClick={() => {
                      setWallpaper(wp.id);
                      setActiveWallpaper(wp.id);
                      window.dispatchEvent(new Event("wallpaper-changed"));
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{wp.emoji}</span>
                      <span className="text-[13px] font-semibold text-ink-deep">{wp.label}</span>
                      {active && <span className="ml-auto text-[10px] text-sage-500 font-semibold">使用中</span>}
                    </div>
                    <div
                      className={`mt-2 h-10 rounded-[8px] border border-black/[0.03] ${wp.id === "garden" ? "bg-[#f8f4ec]" : wp.id === "linen" ? "bg-[#f6f2e9]" : wp.id === "stars" ? "bg-[#efe8d8]" : "bg-[#f7f3ec]"}`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <footer className="flex shrink-0 items-center justify-between border-t border-gold-200/20 bg-cream-warm/95 px-4 py-3 backdrop-blur-2xl">
          <button className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-[13px] font-medium text-ink-muted hover:bg-manor-100" onClick={resetSettings}>
            <RotateCcw size={15} /> 恢复默认
          </button>
          <div className="flex items-center gap-3">
            {saved && <span className="text-xs font-semibold text-sage-600">已保存</span>}
            <button className="manor-btn-primary inline-flex h-10 items-center gap-2 px-5 text-[13px]" onClick={saveSettings}>
              <Check size={16} /> 保存
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
}
