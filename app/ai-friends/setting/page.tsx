"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Key, RefreshCw, Zap, Users2, Trash2, Eye, EyeOff, Check } from "lucide-react";
import { type UserApiConfig, getUserApiConfig, setUserApiConfig, clearUserApiConfig } from "@/components/ai-friends/apiKeyStorage";
import { getAiMode, setAiMode, type AiMode } from "@/components/ai-friends/modeStorage";
import { resetAllData, backupAllData, hasBackup, restoreFromBackup } from "@/components/ai-friends/resetStorage";

export default function SettingPage() {
  const [apiConfig, setApiConfig] = useState<UserApiConfig | null>(null);
  const [mode, setMode] = useState<AiMode>("realistic");
  const [backupExists, setBackupExists] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [baseUrlInput, setBaseUrlInput] = useState("https://api.deepseek.com");
  const [modelInput, setModelInput] = useState("deepseek-v4-flash");
  const [providerInput, setProviderInput] = useState("DeepSeek");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setMode(getAiMode());
    setBackupExists(hasBackup());
    const cfg = getUserApiConfig();
    if (cfg) {
      setApiConfig(cfg);
      setApiKeyInput(cfg.apiKey);
      setBaseUrlInput(cfg.baseUrl);
      setModelInput(cfg.model);
      setProviderInput(cfg.providerName);
    }
  }, []);

  function saveApiKey() {
    if (!apiKeyInput.trim()) return;
    setUserApiConfig({
      apiKey: apiKeyInput.trim(),
      baseUrl: baseUrlInput.trim() || "https://api.deepseek.com",
      model: modelInput.trim() || "deepseek-v4-flash",
      providerName: providerInput.trim() || "DeepSeek"
    });
    setApiConfig(getUserApiConfig());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function clearApiKey() {
    if (!window.confirm("确定清除已保存的 API Key？")) return;
    clearUserApiConfig();
    setApiConfig(null);
    setApiKeyInput("");
  }

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
                className={`rounded-[14px] border p-3.5 text-left transition-all ${
                  mode === "speed"
                    ? "border-sage-400 bg-sage-50 shadow-[inset_0_0_0_1px_rgba(125,155,118,0.2)]"
                    : "border-manor-200 bg-white hover:border-gold-300"
                }`}
                onClick={() => setAiMode("speed")}
              >
                <div className="flex items-center gap-2">
                  <Zap size={15} className="text-amber-500" />
                  <span className="text-[13px] font-semibold text-ink-deep">极速模式</span>
                  {mode === "speed" && <Check size={14} className="ml-auto text-sage-500" />}
                </div>
                <p className="mt-1.5 text-[11px] leading-4 text-ink-muted">一次 API 调用，所有朋友同时回复。快、省 token。</p>
              </button>
              <button
                className={`rounded-[14px] border p-3.5 text-left transition-all ${
                  mode === "realistic"
                    ? "border-sage-400 bg-sage-50 shadow-[inset_0_0_0_1px_rgba(125,155,118,0.2)]"
                    : "border-manor-200 bg-white hover:border-gold-300"
                }`}
                onClick={() => setAiMode("realistic")}
              >
                <div className="flex items-center gap-2">
                  <Users2 size={15} className="text-purple-500" />
                  <span className="text-[13px] font-semibold text-ink-deep">真实模式</span>
                  {mode === "realistic" && <Check size={14} className="ml-auto text-sage-500" />}
                </div>
                <p className="mt-1.5 text-[11px] leading-4 text-ink-muted">编排式独立调用，每位朋友单独发言。更自然。</p>
              </button>
            </div>
  </div>

          {/* API Key */}
          <div className="border-b border-gold-200/20 px-4 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Key size={16} className="text-gold-500" />
              <h2 className="text-[14px] font-semibold text-ink-deep">API 配置</h2>
              {apiConfig && (
                <span className="text-[10px] font-medium text-sage-600 bg-sage-50 rounded-full px-2 py-0.5">
                  {apiConfig.providerName}
                </span>
              )}
            </div>
            <div className="space-y-2.5">
              <div className="relative">
                <input
                  className="manor-input h-9 w-full px-3.5 pr-10 text-[13px] font-mono"
                  maxLength={200}
                  placeholder="API Key (sk-...)"
                  type={showKey ? "text" : "password"}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                />
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-full text-ink-muted hover:bg-manor-100"
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <input className="manor-input h-9 w-full px-3.5 text-[13px] font-mono" maxLength={200} placeholder="Base URL (https://api.deepseek.com)" value={baseUrlInput} onChange={(e) => setBaseUrlInput(e.target.value)} />
              <div className="flex gap-2">
                <input className="manor-input h-9 flex-1 px-3.5 text-[13px] font-mono" maxLength={80} placeholder="Model" value={modelInput} onChange={(e) => setModelInput(e.target.value)} />
                <input className="manor-input h-9 w-28 px-3.5 text-[13px]" maxLength={30} placeholder="名称" value={providerInput} onChange={(e) => setProviderInput(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <button className="manor-btn-primary flex-1 h-9 text-[13px]" onClick={saveApiKey}>
                  {saved ? "已保存" : "保存"}
                </button>
                {apiConfig && (
                  <button className="flex items-center justify-center gap-1.5 h-9 px-4 text-[13px] font-medium text-rose-600 rounded-[14px] bg-rose-50/60 border border-rose-200/30 hover:bg-rose-100/70" onClick={clearApiKey}>
                    <Trash2 size={14} /> 清除
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 预设快捷填入 */}
          <div className="border-b border-gold-200/20 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted mb-2">快捷预设</p>
            <div className="flex flex-wrap gap-2">
              <button className="rounded-full border border-gold-200/30 bg-white px-3 py-1.5 text-[11px] font-medium text-ink-soft hover:border-gold-400 hover:bg-gold-50" onClick={() => { setBaseUrlInput("https://api.deepseek.com"); setModelInput("deepseek-v4-flash"); setProviderInput("DeepSeek"); }}>DeepSeek</button>
              <button className="rounded-full border border-gold-200/30 bg-white px-3 py-1.5 text-[11px] font-medium text-ink-soft hover:border-gold-400 hover:bg-gold-50" onClick={() => { setBaseUrlInput("https://api.openai.com/v1"); setModelInput("gpt-4o"); setProviderInput("OpenAI"); }}>OpenAI</button>
              <button className="rounded-full border border-gold-200/30 bg-white px-3 py-1.5 text-[11px] font-medium text-ink-soft hover:border-gold-400 hover:bg-gold-50" onClick={() => { setBaseUrlInput("https://api.groq.com/openai/v1"); setModelInput("llama-4-scout-17b-16e-instruct"); setProviderInput("Groq"); }}>Groq</button>
              <button className="rounded-full border border-gold-200/30 bg-white px-3 py-1.5 text-[11px] font-medium text-ink-soft hover:border-gold-400 hover:bg-gold-50" onClick={() => { setBaseUrlInput("https://openrouter.ai/api/v1"); setModelInput("openai/gpt-4o"); setProviderInput("OpenRouter"); }}>OpenRouter</button>
            </div>
          </div>

          {/* 一键重置 */}
          <div className="border-b border-gold-200/20 px-4 py-4">
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
                  "API Key 不会受影响。\n\n" +
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
