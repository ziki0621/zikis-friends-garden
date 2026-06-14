"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type MessageComposerProps = {
  roomId: string;
};

const blockedWords = ["诈骗", "博彩", "约炮"];

export function MessageComposer({ roomId }: MessageComposerProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submitMessage() {
    const trimmed = content.trim();
    setStatus(null);
    if (!trimmed) {
      setStatus("留言不能为空。");
      return;
    }
    if (trimmed.length > 300) {
      setStatus("留言最多 300 字。");
      return;
    }
    if (blockedWords.some((word) => trimmed.includes(word))) {
      setStatus("这条留言看起来不太适合放在庄园里。");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) {
        setStatus("请先登录或游客进入，再留下纸条。");
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("nickname").eq("id", user.id).maybeSingle();
      const { error } = await supabase.from("messages").insert({
        room_id: roomId,
        author_id: user.id,
        author_name: profile?.nickname ?? "匿名朋友",
        content: trimmed
      });
      if (error) {
        setStatus(error.message);
        return;
      }
      setContent("");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "留言失败。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-3xl bg-cream p-4">
      <textarea
        className="min-h-28 w-full resize-none rounded-2xl border-2 border-ink/20 bg-white px-4 py-3 outline-none focus:border-grape"
        maxLength={300}
        placeholder="写一张给房主的小纸条..."
        value={content}
        onChange={(event) => setContent(event.target.value)}
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-sm text-ink/60">{content.length}/300</span>
        <button className="rounded-2xl bg-ink px-5 py-3 font-black text-white disabled:opacity-50" disabled={submitting} onClick={submitMessage} type="button">
          留言
        </button>
      </div>
      {status ? <p className="mt-2 text-sm text-ink/70">{status}</p> : null}
    </div>
  );
}
