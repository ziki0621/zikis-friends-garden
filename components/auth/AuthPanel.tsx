"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AuthPanel() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    setStatus(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/avatar/create`
        }
      });
      setStatus(error ? error.message : "登录链接已经发送到邮箱。");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Supabase 环境变量还没有配置。");
    } finally {
      setLoading(false);
    }
  }

  async function enterAnonymously() {
    setLoading(true);
    setStatus(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInAnonymously();
      if (error) {
        setStatus(error.message);
        return;
      }
      window.location.href = "/avatar/create";
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Supabase 环境变量还没有配置。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl bg-white p-5 pixel-border">
      <h2 className="text-lg font-black">进入方式</h2>
      <div className="mt-4 flex gap-2">
        <input
          className="min-w-0 flex-1 rounded-2xl border-2 border-ink/20 px-4 py-3 outline-none focus:border-grape"
          placeholder="你的邮箱"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <button
          className="rounded-2xl bg-grape px-4 py-3 font-bold text-white disabled:opacity-50"
          disabled={loading || !email}
          onClick={signInWithEmail}
          type="button"
        >
          登录
        </button>
      </div>
      <button
        className="mt-3 w-full rounded-2xl bg-honey px-4 py-3 font-black text-ink disabled:opacity-50"
        disabled={loading}
        onClick={enterAnonymously}
        type="button"
      >
        游客进入
      </button>
      {status ? <p className="mt-3 text-sm text-ink/70">{status}</p> : null}
    </div>
  );
}
