"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Camera, Check, MessageCircle, Minus, Plus, RotateCcw, Trash2 } from "lucide-react";
import { type AIFriend, getDefaultFriendTemplate } from "@/lib/ai/friendGroup";
import { AvatarCircle } from "@/components/ai-friends/AvatarCircle";
import { readStoredAIFriend, updateStoredAIFriend } from "@/components/ai-friends/aiFriendRosterStorage";

const DEFAULT_METRIC_TEMPLATES = [
  { key: "m1", value: 50, label: "外向度", hint: "越高越主动开口、话多、爱热闹" },
  { key: "m2", value: 50, label: "共情度", hint: "越高越能感受到情绪、喜欢先安慰" },
  { key: "m3", value: 50, label: "分析度", hint: "越高越喜欢拆问题、讲逻辑、列结构" },
  { key: "m4", value: 50, label: "驱动力", hint: "越高越催人行动、给压力、推进展" },
  { key: "m5", value: 50, label: "玩心度", hint: "越高越爱开玩笑、调侃、接梗" }
];

const DEFAULT_FIELD_TEMPLATES = [
  { key: "personality", label: "性格底色", hint: "她/他是什么样的性格...", value: "" },
  { key: "style", label: "说话风格", hint: "她/他怎么说话...", value: "" },
  { key: "job", label: "群内分工", hint: "在群聊里负责什么...", value: "" },
  { key: "careFocus", label: "关心的事", hint: "最关心什么...", value: "" },
  { key: "quirks", label: "小习惯", hint: "有什么口头禅或小动作...", value: "" },
  { key: "boundaries", label: "边界", hint: "不能做什么...", value: "" }
];

type MetricRow = { key: string; value: number; label: string; hint: string };
type FieldRow = { key: string; label: string; hint: string; value: string };

let idCounter = 0;
function uid() { return `custom-${++idCounter}-${Math.random().toString(36).slice(2, 6)}`; }

export function FriendSettingsPage({ friendId }: { friendId: string }) {
  const [friend, setFriend] = useState<AIFriend | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [avatar, setAvatar] = useState<string | undefined>(undefined);

  const [metricRows, setMetricRows] = useState<MetricRow[]>(() =>
    DEFAULT_METRIC_TEMPLATES.map((m) => ({ ...m }))
  );
  const [fieldRows, setFieldRows] = useState<FieldRow[]>(() =>
    DEFAULT_FIELD_TEMPLATES.map((f) => ({ ...f }))
  );

  useEffect(() => {
    const f = readStoredAIFriend(friendId);
    if (f) {
      setFriend(f);
      setName(f.name);
      setTitle(f.title);
      setAvatar(f.avatar);

      const savedMetrics = loadCustomMetrics(friendId);
      const savedFields = loadCustomFields(friendId);

      if (savedMetrics) {
        setMetricRows(savedMetrics);
      } else {
        setMetricRows(DEFAULT_METRIC_TEMPLATES.map((m) => ({
          ...m,
          value: getMetricFallback(f, m.label)
        })));
      }

      if (savedFields) {
        setFieldRows(savedFields);
      } else {
        setFieldRows(DEFAULT_FIELD_TEMPLATES.map((ft) => ({
          ...ft,
          value: getFieldFallback(f, ft.key)
        })));
      }
    }
    setLoaded(true);
  }, [friendId]);

  function getMetricFallback(f: AIFriend, label: string): number {
    const m = getDefaultMetrics(f);
    const idx = DEFAULT_METRIC_TEMPLATES.findIndex((t) => t.label === label);
    if (idx >= 0) {
      const keys = ["m1", "m2", "m3", "m4", "m5"] as const;
      return m[keys[idx]] ?? 50;
    }
    return 50;
  }
  function getFieldFallback(f: AIFriend, key: string): string {
    const map: Record<string, string | undefined> = {
      personality: f.personality, style: f.style, job: f.job,
      careFocus: f.careFocus, quirks: f.quirks, boundaries: f.boundaries
    };
    return map[key]?.trim() || "";
  }

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

  /* ── Metric CRUD ── */
  function updateMetricValue(key: string, value: number) {
    setMetricRows((c) => c.map((r) => (r.key === key ? { ...r, value: Math.max(0, Math.min(100, value)) } : r)));
    setSaved(false);
  }
  function updateMetricLabel(key: string, label: string) {
    setMetricRows((c) => c.map((r) => (r.key === key ? { ...r, label: label.slice(0, 12) } : r)));
    setSaved(false);
  }
  function updateMetricHint(key: string, hint: string) {
    setMetricRows((c) => c.map((r) => (r.key === key ? { ...r, hint: hint.slice(0, 60) } : r)));
    setSaved(false);
  }
  function addMetricRow() {
    setMetricRows((c) => [...c, { key: uid(), value: 50, label: "新指标", hint: "" }]);
    setSaved(false);
  }
  function deleteMetricRow(key: string) {
    if (metricRows.length <= 1) return;
    setMetricRows((c) => c.filter((r) => r.key !== key));
    setSaved(false);
  }

  /* ── Field CRUD ── */
  function updateFieldLabel(key: string, label: string) {
    setFieldRows((c) => c.map((r) => (r.key === key ? { ...r, label: label.slice(0, 16) } : r)));
    setSaved(false);
  }
  function updateFieldHint(key: string, hint: string) {
    setFieldRows((c) => c.map((r) => (r.key === key ? { ...r, hint: hint.slice(0, 60) } : r)));
    setSaved(false);
  }
  function updateFieldValue(key: string, value: string) {
    setFieldRows((c) => c.map((r) => (r.key === key ? { ...r, value } : r)));
    setSaved(false);
  }
  function addFieldRow() {
    setFieldRows((c) => [...c, { key: uid(), label: "新字段", hint: "", value: "" }]);
    setSaved(false);
  }
  function deleteFieldRow(key: string) {
    if (fieldRows.length <= 1) return;
    setFieldRows((c) => c.filter((r) => r.key !== key));
    setSaved(false);
  }

  function saveAll() {
    saveCustomMetrics(friendId, metricRows);
    saveCustomFields(friendId, fieldRows);

    const fieldMap: Record<string, string> = {};
    fieldRows.forEach((r) => { fieldMap[r.key] = r.value.trim(); });

    updateStoredAIFriend(friendId, {
      name: name.trim() || friend!.name,
      title: title.trim() || friend!.title,
      avatar: avatar ?? friend!.avatar,
      ...fieldMap
    });
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("friend-updated"));
    setSaved(true);
  }

  function clearAll() {
    if (!window.confirm("确定清空所有自定义设定？\n\n所有量化指标和文字字段将被清空（至少保留一行）。")) return;
    setMetricRows([{ key: uid(), value: 0, label: "", hint: "" }]);
    setFieldRows([{ key: uid(), value: "", label: "", hint: "" }]);
    setSaved(false);
  }

  function resetToDefault() {
    if (!window.confirm("确定恢复为默认模板？\n\n你当前的编辑将被覆盖。")) return;
    const f = friend!;
    saveCustomMetrics(friendId, null);
    saveCustomFields(friendId, null);
    setMetricRows(DEFAULT_METRIC_TEMPLATES.map((m) => ({ ...m, value: getMetricFallback(f, m.label) })));
    setFieldRows(DEFAULT_FIELD_TEMPLATES.map((ft) => ({ ...ft, value: getFieldFallback(f, ft.key) })));
    setSaved(false);
  }

  function pickAvatar() { pickAvatarFn(setAvatar, setSaved); }

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
                <AvatarCircle avatar={displayAvatar} emoji={displayEmoji} className="h-16 w-16 text-xl ring-[3px] ring-white shadow-md" color={friend.color} label={name || friend.name} />
                <span className="absolute -bottom-0.5 -right-0.5 grid h-6 w-6 place-items-center rounded-full bg-sage-500 text-white shadow-sm ring-2 ring-white"><Camera size={12} /></span>
              </button>
              <div>
                <p className="font-semibold text-ink-deep">点击更换头像</p>
                <p className="mt-0.5 text-xs text-ink-muted">支持 PNG / JPEG / WebP</p>
                {displayAvatar && <button className="mt-1 text-[11px] text-rose-500 hover:text-rose-600" onClick={() => { setAvatar(undefined); setSaved(false); }}>移除头像</button>}
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
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[13px] font-semibold text-ink-deep">量化指标 (0-100)</h2>
              <button className="grid h-7 w-7 place-items-center rounded-full bg-sage-500 text-white shadow-manor-sage hover:bg-sage-600" onClick={addMetricRow} title="新增指标">
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-3">
              {metricRows.map((m) => (
                <div key={m.key} className="group relative rounded-[12px] bg-cream-warm/60 px-3 py-2.5 ring-1 ring-gold-200/10">
                  <div className="flex items-center gap-1.5 mb-1">
                    <input
                      className="bg-transparent text-[12px] font-semibold text-ink-soft w-[72px] outline-none border-b border-transparent focus:border-sage-300 px-0.5"
                      maxLength={12} placeholder="指标名" value={m.label}
                      onChange={(e) => updateMetricLabel(m.key, e.target.value)}
                    />
                    <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-ink-soft ml-auto">{m.value}</span>
                    {metricRows.length > 1 && (
                      <button className="grid h-5 w-5 place-items-center rounded-full text-ink-faint/40 hover:text-rose-500 hover:bg-rose-50 ml-1 sm:opacity-0 sm:group-hover:opacity-100" onClick={() => deleteMetricRow(m.key)} title="删除指标">
                        <Minus size={11} />
                      </button>
                    )}
                  </div>
                  <input className="h-1.5 w-full accent-sage-500" type="range" min={0} max={100} value={m.value} onChange={(e) => updateMetricValue(m.key, Number(e.target.value))} />
                  <input
                    className="mt-1.5 w-full bg-transparent text-[11px] text-ink-soft outline-none border-b border-transparent focus:border-sage-200/50 px-0.5"
                    maxLength={60} placeholder="指标说明..."
                    value={m.hint}
                    onChange={(e) => updateMetricHint(m.key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 文字说明 */}
          <div className="px-4 py-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-[13px] font-semibold text-ink-deep">人物说明</h2>
              <button className="grid h-7 w-7 place-items-center rounded-full bg-sage-500 text-white shadow-manor-sage hover:bg-sage-600" onClick={addFieldRow} title="新增字段">
                <Plus size={14} />
              </button>
            </div>
            {fieldRows.map((f) => (
              <div key={f.key} className="group relative rounded-[12px] bg-cream-warm/60 px-3 py-2.5 ring-1 ring-gold-200/10">
                <div className="flex items-center justify-between mb-1.5">
                  <input
                    className="bg-transparent text-[11px] font-semibold text-ink-soft w-[80px] outline-none border-b border-transparent focus:border-sage-300 px-0.5"
                    maxLength={16} placeholder="字段名" value={f.label}
                    onChange={(e) => updateFieldLabel(f.key, e.target.value)}
                  />
                  <input
                    className="flex-1 ml-2 bg-transparent text-[10px] text-ink-muted outline-none border-b border-transparent focus:border-sage-200/50 px-0.5"
                    maxLength={60} placeholder="占位提示..."
                    value={f.hint}
                    onChange={(e) => updateFieldHint(f.key, e.target.value)}
                  />
                  {fieldRows.length > 1 && (
                    <button className="grid h-5 w-5 place-items-center rounded-full text-ink-faint/40 hover:text-rose-500 hover:bg-rose-50 ml-1 shrink-0 sm:opacity-0 sm:group-hover:opacity-100" onClick={() => deleteFieldRow(f.key)} title="删除字段">
                      <Minus size={11} />
                    </button>
                  )}
                </div>
                <textarea
                  className="manor-input min-h-16 w-full resize-none px-3 py-2 text-[13px] leading-5"
                  maxLength={220}
                  placeholder={f.hint || "描述..."}
                  value={f.value}
                  onChange={(e) => updateFieldValue(f.key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </section>

        <footer className="flex shrink-0 items-center gap-2 border-t border-gold-200/20 bg-cream-warm/95 px-4 py-3 backdrop-blur-2xl">
          <button className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium text-ink-muted hover:bg-manor-100" onClick={resetToDefault}>
            <RotateCcw size={14} /> 默认模板
          </button>
          <button className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium text-rose-600 hover:bg-rose-50" onClick={clearAll}>
            <Trash2 size={14} /> 一键清空
          </button>
          <div className="flex-1" />
          {saved && <span className="text-xs font-semibold text-sage-600">已保存</span>}
          <button className="manor-btn-primary inline-flex h-10 items-center gap-2 px-5 text-[13px]" onClick={saveAll}>
            <Check size={16} /> 保存
          </button>
        </footer>
      </div>
    </main>
  );
}

/* ─── helpers ─── */

function getDefaultMetrics(f: AIFriend): Record<string, number> {
  const text = (f.name + f.title + f.personality + f.job + f.careFocus + f.quirks + f.id).toLowerCase();
  let m1 = 50, m2 = 50, m3 = 50, m4 = 50, m5 = 50;
  if (text.includes("nana") || text.includes("娜娜")) { m2 = 80; m1 = 55; m5 = 45; }
  if (text.includes("温柔") || text.includes("接住")) m2 = Math.max(m2, 78);
  if (text.includes("kai") || text.includes("凯凯")) { m5 = 85; m1 = 75; m4 = 65; }
  if (text.includes("嘴欠") || text.includes("吐槽")) m5 = Math.max(m5, 80);
  if (text.includes("lin") || text.includes("博士")) { m3 = 90; m1 = 35; m4 = 55; }
  if (text.includes("分析") || text.includes("结构")) m3 = Math.max(m3, 80);
  if (text.includes("momo") || text.includes("末末")) { m4 = 88; m1 = 60; }
  if (text.includes("行动") || text.includes("催")) m4 = Math.max(m4, 82);
  if (text.includes("yan") || text.includes("阿言")) { m3 = 75; m2 = 30; m1 = 30; }
  if (text.includes("风险") || text.includes("谨慎")) m3 = Math.max(m3, 70);
  return { m1, m2, m3, m4, m5 };
}

/* ─── localStorage ─── */

const METRICS_STORAGE_PREFIX = "ziki-custom-metrics:";
const FIELDS_STORAGE_PREFIX = "ziki-custom-fields:";

function loadCustomMetrics(friendId: string): MetricRow[] | null {
  try {
    const raw = localStorage.getItem(METRICS_STORAGE_PREFIX + friendId);
    if (!raw) return null;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return arr.map((m: any) => ({
      key: typeof m.key === "string" ? m.key : uid(),
      value: typeof m.value === "number" ? m.value : 50,
      label: typeof m.label === "string" ? m.label.slice(0, 12) : "",
      hint: typeof m.hint === "string" ? m.hint.slice(0, 60) : ""
    }));
  } catch { return null; }
}
function saveCustomMetrics(friendId: string, rows: MetricRow[] | null) {
  if (!rows) { localStorage.removeItem(METRICS_STORAGE_PREFIX + friendId); return; }
  localStorage.setItem(METRICS_STORAGE_PREFIX + friendId, JSON.stringify(rows));
}

function loadCustomFields(friendId: string): FieldRow[] | null {
  try {
    const raw = localStorage.getItem(FIELDS_STORAGE_PREFIX + friendId);
    if (!raw) return null;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return arr.map((f: any) => ({
      key: typeof f.key === "string" ? f.key : uid(),
      label: typeof f.label === "string" ? f.label.slice(0, 16) : "",
      hint: typeof f.hint === "string" ? f.hint.slice(0, 60) : DEFAULT_FIELD_TEMPLATES.find((d) => d.key === f.key)?.hint || "",
      value: typeof f.value === "string" ? f.value : ""
    }));
  } catch { return null; }
}
function saveCustomFields(friendId: string, rows: FieldRow[] | null) {
  if (!rows) { localStorage.removeItem(FIELDS_STORAGE_PREFIX + friendId); return; }
  localStorage.setItem(FIELDS_STORAGE_PREFIX + friendId, JSON.stringify(rows.map((r) => ({ key: r.key, label: r.label, hint: r.hint, value: r.value }))));
}

/* ─── 头像上传 ─── */

function pickAvatarFn(setAvatar: (url: string) => void, setSaved: (v: boolean) => void) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/png,image/jpeg,image/webp";
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const url = await compressAndReadImage2(file);
      setAvatar(url); setSaved(false);
    } catch (e) { window.alert(e instanceof Error ? e.message : "处理失败"); }
  };
  input.click();
}

async function compressAndReadImage2(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("请选择图片文件");
  if (file.size > 4 * 1024 * 1024) throw new Error("图片太大，4MB 以内");
  const src = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => { if (typeof r.result === "string") resolve(r.result); else reject(new Error("失败")); };
    r.onerror = () => reject(new Error("失败"));
    r.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image(); i.onload = () => resolve(i); i.onerror = () => reject(new Error("解析失败")); i.src = src;
  });
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 200;
  const ctx = canvas.getContext("2d")!;
  const side = Math.min(img.width, img.height);
  ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 200, 200);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.8));
  if (!blob) return canvas.toDataURL("image/jpeg", 0.8);
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => { if (typeof r.result === "string") resolve(r.result); else reject(new Error("失败")); };
    r.onerror = () => reject(new Error("失败"));
    r.readAsDataURL(blob);
  });
}
