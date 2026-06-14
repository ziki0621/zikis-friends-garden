"use client";

import { useEffect, useState } from "react";
import { Check, Eye, EyeOff, Key, Trash2, X } from "lucide-react";
import {
  type UserApiConfig,
  clearUserApiConfig,
  getUserApiConfig,
  setUserApiConfig
} from "@/components/ai-friends/apiKeyStorage";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ApiKeyModal({ open, onClose }: Props) {
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://api.deepseek.com");
  const [model, setModel] = useState("deepseek-v4-flash");
  const [providerName, setProviderName] = useState("DeepSeek");
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    const existing = getUserApiConfig();
    if (existing) {
      setApiKey(existing.apiKey);
      setBaseUrl(existing.baseUrl);
      setModel(existing.model);
      setProviderName(existing.providerName);
    }
    setSaved(false);
  }, [open]);

  if (!open) return null;

  function save() {
    if (!apiKey.trim()) return;
    setUserApiConfig({
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim() || "https://api.deepseek.com",
      model: model.trim() || "deepseek-v4-flash",
      providerName: providerName.trim() || "Custom"
    });
    setSaved(true);
    setTimeout(() => {
      onClose();
      // 刷新页面让新配置生效
      window.location.reload();
    }, 600);
  }

  function remove() {
    clearUserApiConfig();
    setApiKey("");
    setBaseUrl("https://api.deepseek.com");
    setModel("deepseek-v4-flash");
    setProviderName("DeepSeek");
    setSaved(true);
    setTimeout(() => {
      onClose();
      window.location.reload();
    }, 600);
  }

  const hasExisting = Boolean(getUserApiConfig());

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {/* sheet */}
      <div className="relative w-full max-w-[440px] animate-fade-up rounded-t-[24px] sm:rounded-[24px] bg-cream-warm shadow-manor-xl border border-gold-200/20 px-5 pb-6 pt-5 max-h-[85vh] overflow-y-auto soft-scrollbar">
        {/* handle */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-manor-300 sm:hidden" />

        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gold-100 text-gold-600">
              <Key size={17} />
            </div>
            <h2 className="text-[17px] font-semibold text-ink-deep">API 设置</h2>
          </div>
          <button className="grid h-8 w-8 place-items-center rounded-full text-ink-muted hover:bg-manor-100" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <p className="mb-5 text-[12px] text-ink-muted leading-5">
          填入你自己的 API Key 即可使用。
          支持所有 OpenAI 兼容接口（DeepSeek、OpenAI、Groq 等）。
          <br />
          你的 Key 只保存在浏览器本地，不会上传到服务器。
        </p>

        {/* API Key */}
        <label className="block text-[11px] font-semibold text-ink-soft mb-1">API Key</label>
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <input
              className="manor-input h-10 w-full px-3.5 pr-10 text-[13px] font-mono"
              maxLength={200}
              placeholder="sk-..."
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); setSaved(false); }}
            />
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-full text-ink-muted hover:bg-manor-100"
              type="button"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {hasExisting && (
            <button
              className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-rose-50 text-rose-500 hover:bg-rose-100"
              title="清除"
              onClick={remove}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        {/* Base URL */}
        <label className="block text-[11px] font-semibold text-ink-soft mb-1">Base URL</label>
        <input
          className="manor-input h-10 w-full px-3.5 text-[13px] font-mono mb-3"
          maxLength={200}
          placeholder="https://api.deepseek.com"
          value={baseUrl}
          onChange={(e) => { setBaseUrl(e.target.value); setSaved(false); }}
        />

        {/* Model */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            <label className="block text-[11px] font-semibold text-ink-soft mb-1">Model</label>
            <input
              className="manor-input h-10 w-full px-3.5 text-[13px] font-mono"
              maxLength={80}
              placeholder="deepseek-v4-flash"
              value={model}
              onChange={(e) => { setModel(e.target.value); setSaved(false); }}
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-ink-soft mb-1">显示名称</label>
            <input
              className="manor-input h-10 w-full px-3.5 text-[13px]"
              maxLength={30}
              placeholder="DeepSeek"
              value={providerName}
              onChange={(e) => { setProviderName(e.target.value); setSaved(false); }}
            />
          </div>
        </div>

        {/* 预设快捷填入 */}
        <div className="mb-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted mb-2">快捷填入</p>
          <div className="flex flex-wrap gap-2">
            <PresetBtn
              label="DeepSeek"
              onClick={() => {
                setBaseUrl("https://api.deepseek.com");
                setModel("deepseek-v4-flash");
                setProviderName("DeepSeek");
              }}
            />
            <PresetBtn
              label="OpenAI"
              onClick={() => {
                setBaseUrl("https://api.openai.com/v1");
                setModel("gpt-4o");
                setProviderName("OpenAI");
              }}
            />
            <PresetBtn
              label="Groq"
              onClick={() => {
                setBaseUrl("https://api.groq.com/openai/v1");
                setModel("llama-4-scout-17b-16e-instruct");
                setProviderName("Groq");
              }}
            />
            <PresetBtn
              label="OpenRouter"
              onClick={() => {
                setBaseUrl("https://openrouter.ai/api/v1");
                setModel("openai/gpt-4o");
                setProviderName("OpenRouter");
              }}
            />
          </div>
        </div>

        {/* 保存按钮 */}
        <button
          className="manor-btn-primary inline-flex w-full items-center justify-center gap-2 h-11 text-[14px] disabled:opacity-40"
          disabled={!apiKey.trim()}
          onClick={save}
        >
          <Check size={17} />
          {saved ? "已保存" : "保存并刷新"}
        </button>

        {hasExisting && (
          <p className="mt-2 text-center text-[11px] text-sage-600 font-medium">
            已配置 {getUserApiConfig()?.providerName ?? "Custom"} · {getUserApiConfig()?.model ?? ""}
          </p>
        )}
      </div>
    </div>
  );
}

function PresetBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      className="rounded-full border border-gold-200/30 bg-white px-3 py-1.5 text-[11px] font-medium text-ink-soft transition hover:border-gold-400 hover:bg-gold-50"
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}
