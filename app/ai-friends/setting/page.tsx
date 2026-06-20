"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Key, RefreshCw, Zap, Users2, Trash2, Eye, EyeOff, Check, Plus, Layers } from "lucide-react";
import {
  type ApiProfile, getAllProfiles, getActiveProfileId, setActiveProfileId,
  addProfile, updateProfile, deleteProfile, getActiveProfile
} from "@/components/ai-friends/apiKeyStorage";
import { getAiMode, setAiMode, type AiMode } from "@/components/ai-friends/modeStorage";
import { resetAllData, backupAllData, hasBackup, restoreFromBackup } from "@/components/ai-friends/resetStorage";

const PRESETS = [
  { label: "DeepSeek", baseUrl: "https://api.deepseek.com", model: "deepseek-v4-flash", provider: "DeepSeek" },
  { label: "OpenAI", baseUrl: "https://api.openai.com/v1", model: "gpt-4o", provider: "OpenAI" },
  { label: "Groq", baseUrl: "https://api.groq.com/openai/v1", model: "llama-4-scout-17b-16e-instruct", provider: "Groq" },
  { label: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1", model: "openai/gpt-4o", provider: "OpenRouter" }
];

export default function SettingPage() {
  const [mode, setMode] = useState<AiMode>("realistic");
  const [backupExists, setBackupExists] = useState(false);
  const [profiles, setProfiles] = useState<ApiProfile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  // edit form fields
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editKey, setEditKey] = useState("");
  const [editBaseUrl, setEditBaseUrl] = useState("https://api.deepseek.com");
  const [editModel, setEditModel] = useState("deepseek-v4-flash");
  const [editProvider, setEditProvider] = useState("DeepSeek");

  useEffect(() => {
    refreshProfiles();
    setMode(getAiMode());
    setBackupExists(hasBackup());
  }, []);

  function refreshProfiles() {
    setProfiles(getAllProfiles());
    setActiveId(getActiveProfileId());
  }

  function startNew() {
    setEditId(null);
    setEditName(""); setEditKey("");
    setEditBaseUrl("https://api.deepseek.com");
    setEditModel("deepseek-v4-flash"); setEditProvider("DeepSeek");
    setEditingProfile(true);
  }

  function startEdit(p: ApiProfile) {
    setEditId(p.id);
    setEditName(p.name); setEditKey(p.apiKey);
    setEditBaseUrl(p.baseUrl); setEditModel(p.model); setEditProvider(p.providerName);
    setEditingProfile(true);
  }

  function cancelEdit() {
    setEditingProfile(false);
    setEditId(null);
  }

  function saveEdit() {
    if (!editKey.trim()) return;
    if (editId) {
      updateProfile(editId, {
        name: editName.trim() || editProvider.trim() || "未命名",
        apiKey: editKey.trim(),
        baseUrl: editBaseUrl.trim() || "https://api.deepseek.com",
        model: editModel.trim() || "deepseek-v4-flash",
        providerName: editProvider.trim() || "Custom"
      });
    } else {
      addProfile(editName.trim() || "新配置", editKey.trim(), editBaseUrl, editModel, editProvider);
    }
    setEditingProfile(false);
    setEditId(null);
    refreshProfiles();
    setSaved(true);
  }

  function handleDelete(id: string) {
    if (!window.confirm("删除这个 API 配置？")) return;
    deleteProfile(id);
    refreshProfiles();
  }

  function handleActivate(id: string) {
    setActiveProfileId(id);
    setActiveId(id);
    setSaved(true);
    refreshProfiles();
  }

  function handlePreset(p: typeof PRESETS[number]) {
    setEditBaseUrl(p.baseUrl);
    setEditModel(p.model);
    setEditProvider(p.provider);
  }

  const activeProfile = activeId ? profiles.find(p => p.id === activeId) : null;

  return (
    <main className="app-backdrop h-dvh overflow-hidden">
      <div className="phone-shell mx-auto flex h-dvh min-h-0 max-w-[440px] flex-col bg-cream-warm">

        <header className="sticky top-0 z-10 border-b border-gold-200/20 bg-cream-warm/95 backdrop-blur-2xl px-4 py-3">
          <div className="flex items-center gap-3">
            <Link className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-manor-100" href="/ai-friends">
              <ArrowLeft size={19} />
            </Link>
            <h1 className="text-[22px] font-semibold leading-[1.2] tracking-[-0.02em] text-ink-deep">设置</h1>
          </div>
        </header>

        <section className="soft-scrollbar min-h-0 flex-1 overflow-y-auto bg-white/60">

          {/* AI 模式 */}
          <div className="border-b border-gold-200/20 px-4 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} className="text-gold-500" />
              <h2 className="text-[14px] font-semibold text-ink-deep">AI 回复模式</h2>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                className={`rounded-[14px] border p-3.5 text-left transition-all ${mode === "speed" ? "border-sage-400 bg-sage-50 shadow-[inset_0_0_0_1px_rgba(125,155,118,0.2)]" : "border-manor-200 bg-white hover:border-gold-300"}`}
                onClick={() => setAiMode("speed")}
              >
                <div className="flex items-center gap-2">
                  <Zap size={15} className="text-amber-500" />
                  <span className="text-[13px] font-semibold text-ink-deep">极速模式</span>
                  {mode === "speed" && <Check size={14} className="ml-auto text-sage-500" />}
                </div>
                <p className="mt-1.5 text-[11px] leading-4 text-ink-muted">一次调用，快速省 token。</p>
              </button>
              <button
                className={`rounded-[14px] border p-3.5 text-left transition-all ${mode === "realistic" ? "border-sage-400 bg-sage-50 shadow-[inset_0_0_0_1px_rgba(125,155,118,0.2)]" : "border-manor-200 bg-white hover:border-gold-300"}`}
                onClick={() => setAiMode("realistic")}
              >
                <div className="flex items-center gap-2">
                  <Users2 size={15} className="text-purple-500" />
                  <span className="text-[13px] font-semibold text-ink-deep">真实模式</span>
                  {mode === "realistic" && <Check size={14} className="ml-auto text-sage-500" />}
                </div>
                <p className="mt-1.5 text-[11px] leading-4 text-ink-muted">独立编排，自然发言。</p>
              </button>
            </div>
          </div>

          {/* API 配置列表 */}
          <div className="border-b border-gold-200/20 px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Key size={16} className="text-gold-500" />
                <h2 className="text-[14px] font-semibold text-ink-deep">API 配置</h2>
                {activeProfile && (
                  <span className="text-[10px] font-medium text-sage-600 bg-sage-50 rounded-full px-2 py-0.5">
                    {activeProfile.providerName}
                  </span>
                )}
              </div>
              <button className="grid h-7 w-7 place-items-center rounded-full bg-sage-500 text-white shadow-manor-sage hover:bg-sage-600" onClick={startNew} title="新增配置">
                <Plus size={14} />
              </button>
            </div>

            {/* 编辑表单 */}
            {editingProfile && (
              <div className="animate-fade-up rounded-[14px] bg-cream-warm px-3.5 py-3 ring-1 ring-gold-200/30 mb-3">
                <input className="manor-input h-9 w-full px-3.5 text-[13px] font-semibold mb-2" maxLength={24} placeholder="配置名称" value={editName} onChange={e => setEditName(e.target.value)} />
                <div className="relative mb-2">
                  <input className="manor-input h-9 w-full px-3.5 pr-10 text-[13px] font-mono" maxLength={200} placeholder="API Key (sk-...)" type={showKey ? "text" : "password"} value={editKey} onChange={e => setEditKey(e.target.value)} />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-full text-ink-muted hover:bg-manor-100" type="button" onClick={() => setShowKey(!showKey)}>
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <input className="manor-input h-9 w-full px-3.5 text-[13px] font-mono mb-2" maxLength={200} placeholder="Base URL" value={editBaseUrl} onChange={e => setEditBaseUrl(e.target.value)} />
                <div className="flex gap-2 mb-2">
                  <input className="manor-input h-9 flex-1 px-3.5 text-[13px] font-mono" maxLength={80} placeholder="Model" value={editModel} onChange={e => setEditModel(e.target.value)} />
                  <input className="manor-input h-9 w-28 px-3.5 text-[13px]" maxLength={30} placeholder="名称" value={editProvider} onChange={e => setEditProvider(e.target.value)} />
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted mb-2">快捷填入</div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {PRESETS.map(p => (
                    <button key={p.label} className="rounded-full border border-gold-200/30 bg-white px-2.5 py-1 text-[10px] font-medium text-ink-soft hover:border-gold-400 hover:bg-gold-50" onClick={() => handlePreset(p)}>{p.label}</button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button className="manor-btn-primary flex-1 h-9 text-[13px]" onClick={saveEdit}>保存</button>
                  <button className="flex-1 h-9 text-[13px] font-medium text-ink-muted rounded-[14px] bg-manor-100 hover:bg-manor-200" onClick={cancelEdit}>取消</button>
                </div>
              </div>
            )}

            {/* 配置列表 */}
            <div className="space-y-2">
              {profiles.length === 0 && (
                <p className="text-[12px] text-ink-muted py-2">还没有 API 配置，点右侧 + 新增一个。</p>
              )}
              {profiles.map(p => (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 rounded-[14px] px-3.5 py-3 transition-all cursor-pointer ${
                    activeId === p.id
                      ? "bg-sage-50 ring-1 ring-sage-200/50 shadow-sm"
                      : "bg-white ring-1 ring-manor-200/50 hover:ring-gold-200/50"
                  }`}
                  onClick={() => handleActivate(p.id)}
                >
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold-100 text-gold-600">
                    <Layers size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[13px] font-semibold text-ink-deep">{p.name}</p>
                      {activeId === p.id && (
                        <span className="shrink-0 text-[9px] font-medium text-sage-600 bg-sage-100 rounded-full px-1.5 py-px">使用中</span>
                      )}
                    </div>
                    <p className="truncate text-[11px] text-ink-muted mt-0.5">{p.providerName} · {p.model} · {maskKey(p.apiKey)}</p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                    <button className="grid h-7 w-7 place-items-center rounded-full text-ink-faint/50 hover:bg-manor-100 hover:text-ink-soft" onClick={() => startEdit(p)} title="编辑">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                    </button>
                    <button className="grid h-7 w-7 place-items-center rounded-full text-ink-faint/50 hover:text-rose-500 hover:bg-rose-50" onClick={() => handleDelete(p.id)} title="删除">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 一键重置 */}
          <div className="px-4 py-4">
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw size={16} className="text-rose-400" />
              <h2 className="text-[14px] font-semibold text-ink-deep">数据管理</h2>
            </div>
            <button
              className="flex w-full items-center gap-3 rounded-[14px] bg-rose-50/60 px-3.5 py-3 ring-1 ring-rose-200/30 hover:bg-rose-100/70"
              onClick={() => {
                if (!window.confirm(
                  "确定要清除所有数据并重启吗？\n\n" +
                  "所有群聊、AI 朋友、聊天记录和设定都会被删除。\n" +
                  "API 配置不会受影响。\n\n" +
                  "重置后可以在这里「撤销还原」。"
                )) return;
                backupAllData();
                resetAllData();
                setBackupExists(true);
                window.location.href = "/ai-friends";
              }}
            >
              <RefreshCw size={16} className="text-rose-500 shrink-0" />
              <span className="text-[13px] font-medium text-rose-600">一键重置</span>
              <span className="ml-auto text-[11px] text-rose-400/70">清除所有数据</span>
              <ArrowLeft size={12} className="rotate-180 text-rose-300 shrink-0" />
            </button>

            {backupExists && (
              <button
                className="mt-2 flex w-full items-center gap-3 rounded-[14px] bg-sage-50/60 px-3.5 py-3 ring-1 ring-sage-200/30 hover:bg-sage-100/70"
                onClick={() => {
                  if (!window.confirm("确定恢复到重置前的状态吗？")) return;
                  restoreFromBackup();
                  window.location.href = "/ai-friends";
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sage-600 shrink-0"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>
                <span className="text-[13px] font-medium text-sage-700">撤销还原</span>
                <span className="ml-auto text-[11px] text-sage-500/70">恢复重置前数据</span>
                <ArrowLeft size={12} className="rotate-180 text-sage-300 shrink-0" />
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function maskKey(key: string): string {
  if (key.length <= 8) return "****";
  return key.slice(0, 6) + "****" + key.slice(-4);
}
