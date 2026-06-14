"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Camera, Check, MessageCircle, RotateCcw, X } from "lucide-react";
import { type AIFriend, getDefaultFriendTemplate } from "@/lib/ai/friendGroup";
import { AvatarCircle } from "@/components/ai-friends/AvatarCircle";
import { readStoredAIFriend, updateStoredAIFriend } from "@/components/ai-friends/aiFriendRosterStorage";

const METRICS = [
  { key: "warmth", label: "温暖", hint: "越高越柔和贴心" },
  { key: "sharpness", label: "锐度", hint: "越高越敢吐槽直说" },
  { key: "analysis", label: "分析力", hint: "越高越喜欢拆解问题" },
  { key: "action", label: "行动力", hint: "越高越催人做事" },
  { key: "caution", label: "谨慎度", hint: "越高越会提醒风险" }
] as const;

export function FriendSettingsPage({ friendId }: { friendId: string }) {
  const [friend, setFriend] = useState<AIFriend | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [personality, setPersonality] = useState("");
  const [style, setStyle] = useState("");
  const [job, setJob] = useState("");
  const [careFocus, setCareFocus] = useState("");
  const [quirks, setQuirks] = useState("");
  const [boundaries, setBoundaries] = useState("");

  useEffect(() => {
    const f = readStoredAIFriend(friendId);
    if (f) {
      setFriend(f);
      setName(f.name);
      setTitle(f.title);
      setAvatar(f.avatar);
      setPersonality(f.personality);
      setStyle(f.style);
      setJob(f.job);
      setCareFocus(f.careFocus);
      setQuirks(f.quirks);
      setBoundaries(f.boundaries);
      setMetrics(getFriendMetrics(f));
    }
    setLoaded(true);
  }, [friendId]);

  if (!friend && loaded) {
    return (
      <main className="app-backdrop grid min-h-dvh place-items-center px-4">
        <div className="w-full max-w-[340px] rounded-[20px] bg-cream px-5 py-6 text-center shadow-manor-lg border border-gold-200/20">
          <p className="text-sm font-semibold text-ink-deep">找不到这个朋友</p>
          <p className="mt-1.5 text-xs text-ink-muted">可能已被删除。</p>
          <Link className="manor-btn-primary mt-4 inline-flex h-9 items-center px-4 text-sm" href="/ai-friends">回到消息</Link>
        </div>
      </main>
    );
  }

  if (!friend) return null;

  function updateMetric(key: string, value: number) {
    setMetrics((c) => ({ ...c, [key]: Math.max(0, Math.min(100, value)) }));
    setSaved(false);
  }

  function pickAvatar() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const url = await compressAndReadImage(file);
        setAvatar(url);
        setSaved(false);
      } catch (e) {
        window.alert(e instanceof Error ? e.message : "处理失败");
      }
    };
    input.click();
  }

  async function compressAndReadImage(file: File): Promise<string> {
    if (!file.type.startsWith("image/")) throw new Error("请选择图片文件");
    if (file.size > 4 * 1024 * 1024) throw new Error("图片太大，4MB 以内");

    const src = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => { if (typeof r.result === "string") resolve(r.result); else reject(new Error("失败")); };
      r.onerror = () => reject(new Error("失败"));
      r.readAsDataURL(file);
    });

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("解析失败"));
      i.src = src;
    });

    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 200;
    const ctx = canvas.getContext("2d")!;
    const side = Math.min(img.width, img.height);
    ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 200, 200);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.8));
    if (!blob) return canvas.toDataURL("image/jpeg", 0.8);

    return new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => { if (typeof r.result === "string") resolve(r.result); else reject(new Error("失败")); };
      r.onerror = () => reject(new Error("失败"));
      r.readAsDataURL(blob);
    });
  }

  function removeAvatar() {
    setAvatar(undefined);
    setSaved(false);
  }

  function saveAll() {
    updateStoredAIFriend(friendId, {
      name: name.trim() || friend!.name,
      title: title.trim() || friend!.title,
      avatar: avatar ?? friend!.avatar,
      personality: personality.trim() || friend!.personality,
      style: style.trim() || friend!.style,
      job: job.trim() || friend!.job,
      careFocus: careFocus.trim() || friend!.careFocus,
      quirks: quirks.trim() || friend!.quirks,
      boundaries: boundaries.trim() || friend!.boundaries
    });
    window.dispatchEvent(new Event("storage"));
    setSaved(true);
  }

  function resetAll() {
    const fallback = getDefaultFriendTemplate(friendId);
    setName(fallback.name); setTitle(fallback.title); setAvatar(fallback.avatar);
    setPersonality(fallback.personality); setStyle(fallback.style); setJob(fallback.job);
    setCareFocus(fallback.careFocus); setQuirks(fallback.quirks); setBoundaries(fallback.boundaries);
    setMetrics(getFriendMetrics(fallback));
    setSaved(false);
  }

  const displayAvatar = avatar !== undefined ? avatar : friend.avatar;
  const displayEmoji = displayAvatar ? undefined : friend.emoji;

  return (
    <main className="app-backdrop h-dvh overflow-hidden">
      <div className="phone-shell mx-auto flex h-dvh min-h-0 max-w-[440px] flex-col bg-cream-warm">

        <header className="sticky top-0 z-10 border-b border-gold-200/20 bg-cream-warm/95 backdrop-blur-2xl px-3 py-2.5">
          <div className="flex items-center gap-3">
            <Link className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-manor-100" href="/ai-friends/people">
              <ArrowLeft size={19} />
            </Link>
            <AvatarCircle avatar={displayAvatar} emoji={displayEmoji} className="h-9 w-9 text-sm" color={friend.color} label={name || friend.name} />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[15px] font-semibold leading-5 text-ink-deep">{name || friend.name}</h1>
              <p className="truncate text-[11px] text-ink-muted">朋友设定</p>
            </div>
            <Link className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-ink-soft shadow-sm hover:bg-manor-100" href={`/ai-friends/dm/${friend.id}`}>
              <MessageCircle size={17} />
            </Link>
          </div>
        </header>

        <section className="soft-scrollbar min-h-0 flex-1 overflow-y-auto bg-white/60">

          {/* 头像 */}
          <div className="border-b border-gold-200/20 px-4 py-4">
            <div className="flex items-center gap-4">
              <button className="relative shrink-0" onClick={pickAvatar} title="更换头像">
                <AvatarCircle
                  avatar={displayAvatar}
                  emoji={displayEmoji}
                  className="h-16 w-16 text-xl ring-[3px] ring-white shadow-md"
                  color={friend.color}
                  label={name || friend.name}
                />
                <span className="absolute -bottom-0.5 -right-0.5 grid h-6 w-6 place-items-center rounded-full bg-sage-500 text-white shadow-sm ring-2 ring-white">
                  <Camera size={12} />
                </span>
              </button>
              <div>
                <p className="font-semibold text-ink-deep">点击更换头像</p>
                <p className="mt-0.5 text-xs text-ink-muted">支持 PNG / JPEG / WebP</p>
                {displayAvatar && (
                  <button className="mt-1 text-[11px] text-rose-500 hover:text-rose-600" onClick={removeAvatar}>移除头像</button>
                )}
              </div>
            </div>
          </div>

          {/* 基本信息 */}
          <div className="border-b border-gold-200/20 px-4 py-4">
            <div className="space-y-2.5">
              <input className="manor-input w-full px-3 py-2 text-[14px] font-semibold" maxLength={18} placeholder="名字" value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} />
              <input className="manor-input w-full px-3 py-2 text-[13px]" maxLength={40} placeholder="一句话标题" value={title} onChange={(e) => { setTitle(e.target.value); setSaved(false); }} />
            </div>
          </div>

          {/* 量化指标 */}
          <div className="border-b border-gold-200/20 px-4 py-4">
            <h2 className="text-[13px] font-semibold text-ink-deep mb-3">量化指标 (0-100)</h2>
            <div className="space-y-3">
              {METRICS.map((m) => (
                <label key={m.key} className="block">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-ink-soft">{m.label}</span>
                    <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-ink-soft">{metrics[m.key] ?? 50}</span>
                  </div>
                  <input className="h-1.5 w-full accent-sage-500" type="range" min={0} max={100} value={metrics[m.key] ?? 50} onChange={(e) => updateMetric(m.key, Number(e.target.value))} />
                  <p className="mt-0.5 text-[10px] text-ink-faint">{m.hint}</p>
                </label>
              ))}
            </div>
          </div>

          {/* 人物说明 */}
          <div className="px-4 py-4 space-y-3">
            <label className="block text-[11px] font-semibold text-ink-muted">性格底色
              <textarea className="manor-input mt-1 min-h-16 w-full resize-none px-3 py-2 text-[13px] leading-5" maxLength={220} value={personality} onChange={(e) => { setPersonality(e.target.value); setSaved(false); }} placeholder="她/他是什么样的性格..." />
            </label>
            <label className="block text-[11px] font-semibold text-ink-muted">说话风格
              <textarea className="manor-input mt-1 min-h-16 w-full resize-none px-3 py-2 text-[13px] leading-5" maxLength={220} value={style} onChange={(e) => { setStyle(e.target.value); setSaved(false); }} placeholder="她/他怎么说话..." />
            </label>
            <label className="block text-[11px] font-semibold text-ink-muted">群内分工
              <textarea className="manor-input mt-1 min-h-16 w-full resize-none px-3 py-2 text-[13px] leading-5" maxLength={220} value={job} onChange={(e) => { setJob(e.target.value); setSaved(false); }} placeholder="在群聊里负责什么..." />
            </label>
            <label className="block text-[11px] font-semibold text-ink-muted">关心的事
              <textarea className="manor-input mt-1 min-h-16 w-full resize-none px-3 py-2 text-[13px] leading-5" maxLength={220} value={careFocus} onChange={(e) => { setCareFocus(e.target.value); setSaved(false); }} placeholder="最关心什么..." />
            </label>
            <label className="block text-[11px] font-semibold text-ink-muted">小习惯
              <textarea className="manor-input mt-1 min-h-16 w-full resize-none px-3 py-2 text-[13px] leading-5" maxLength={220} value={quirks} onChange={(e) => { setQuirks(e.target.value); setSaved(false); }} placeholder="有什么口头禅或小动作..." />
            </label>
            <label className="block text-[11px] font-semibold text-ink-muted">边界
              <textarea className="manor-input mt-1 min-h-16 w-full resize-none px-3 py-2 text-[13px] leading-5" maxLength={220} value={boundaries} onChange={(e) => { setBoundaries(e.target.value); setSaved(false); }} placeholder="不能做什么..." />
            </label>
          </div>
        </section>

        <footer className="flex shrink-0 items-center justify-between border-t border-gold-200/20 bg-cream-warm/95 px-4 py-3 backdrop-blur-2xl">
          <button className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-[13px] font-medium text-ink-muted hover:bg-manor-100" onClick={resetAll}>
            <RotateCcw size={15} /> 恢复默认
          </button>
          <div className="flex items-center gap-3">
            {saved && <span className="text-xs font-semibold text-sage-600">已保存</span>}
            <button className="manor-btn-primary inline-flex h-10 items-center gap-2 px-5 text-[13px]" onClick={saveAll}>
              <Check size={16} /> 保存
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
}

function getFriendMetrics(f: AIFriend): Record<string, number> {
  const text = (f.name + f.title + f.personality + f.job + f.careFocus + f.quirks + f.id).toLowerCase();

  let warmth = 50, sharpness = 50, analysis = 50, action = 50, caution = 50;

  if (text.includes("nana") || text.includes("娜娜") || text.includes("温柔") || text.includes("接住")) warmth = 85;
  if (text.includes("软") || text.includes("安慰")) warmth = Math.max(warmth, 75);
  if (text.includes("kai") || text.includes("凯凯") || text.includes("嘴欠") || text.includes("吐槽")) sharpness = 85;
  if (text.includes("lin") || text.includes("博士") || text.includes("分析") || text.includes("拆")) analysis = 85;
  if (text.includes("结构") || text.includes("判断")) analysis = Math.max(analysis, 75);
  if (text.includes("momo") || text.includes("末末") || text.includes("行动") || text.includes("做")) action = 85;
  if (text.includes("催") || text.includes("进度") || text.includes("清单")) action = Math.max(action, 75);
  if (text.includes("yan") || text.includes("阿言") || text.includes("风险") || text.includes("边界")) caution = 85;
  if (text.includes("谨慎") || text.includes("冷却")) caution = Math.max(caution, 75);

  return { warmth, sharpness, analysis, action, caution };
}
