"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ManorMessage } from "@/lib/db/types";

type MessageCardProps = {
  message: ManorMessage;
  canDelete?: boolean;
};

export function MessageCard({ message, canDelete }: MessageCardProps) {
  const router = useRouter();

  async function deleteMessage() {
    const supabase = createClient();
    await supabase.from("messages").delete().eq("id", message.id);
    router.refresh();
  }

  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black">{message.author_name || "匿名朋友"}</p>
          <time className="text-xs text-ink/50">{message.created_at ? new Date(message.created_at).toLocaleString("zh-CN") : "刚刚"}</time>
        </div>
        {canDelete ? (
          <button aria-label="删除留言" className="rounded-full p-2 text-ink/50 hover:bg-cream hover:text-ink" onClick={deleteMessage} type="button">
            <Trash2 size={16} />
          </button>
        ) : null}
      </div>
      <p className="mt-3 whitespace-pre-wrap leading-7 text-ink/80">{message.content}</p>
    </article>
  );
}
