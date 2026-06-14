"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Room } from "@/lib/db/types";

export function RoomEditor({ room }: { room: Room }) {
  const router = useRouter();
  const [name, setName] = useState(room.name);
  const [description, setDescription] = useState(room.description ?? "");
  const [theme, setTheme] = useState(room.theme);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function saveRoom() {
    setSaving(true);
    setStatus(null);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("rooms")
        .update({
          name: name.trim() || "我的小房间",
          description: description.trim() || null,
          theme
        })
        .eq("id", room.id);

      if (error) {
        setStatus(error.message);
        return;
      }
      setStatus("房间已经更新。");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "保存失败。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <details className="mt-5 w-full rounded-2xl bg-cream p-4 text-left">
      <summary className="cursor-pointer font-black">编辑房间</summary>
      <div className="mt-4 grid gap-3">
        <input className="rounded-2xl border-2 border-ink/20 px-4 py-3" value={name} onChange={(event) => setName(event.target.value)} />
        <textarea className="min-h-20 rounded-2xl border-2 border-ink/20 px-4 py-3" value={description} onChange={(event) => setDescription(event.target.value)} />
        <select className="rounded-2xl border-2 border-ink/20 px-4 py-3" value={theme} onChange={(event) => setTheme(event.target.value)}>
          <option value="cozy">cozy</option>
          <option value="forest">forest</option>
          <option value="night">night</option>
          <option value="candy">candy</option>
        </select>
        <button className="rounded-2xl bg-ink px-5 py-3 font-black text-white disabled:opacity-50" disabled={saving} onClick={saveRoom} type="button">
          保存房间
        </button>
        {status ? <p className="text-sm text-ink/70">{status}</p> : null}
      </div>
    </details>
  );
}
