"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AvatarRenderer } from "@/components/avatar/AvatarRenderer";
import { createClient } from "@/lib/supabase/client";
import { type AvatarConfig, defaultAvatarConfig } from "@/lib/db/types";

const options = {
  skinColor: ["#F2C9A5", "#D99B73", "#8D5524", "#F6D7B0"],
  hairColor: ["#3A2A1F", "#111827", "#B45309", "#F59E0B", "#7C3AED"],
  hairStyle: ["short", "bob", "curly", "long"] as const,
  outfit: ["hoodie", "shirt", "dress", "jacket"] as const,
  expression: ["smile", "calm", "excited", "sleepy"] as const,
  accessory: ["none", "glasses", "hat"] as const
};

export function AvatarCreator() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [favoriteColor, setFavoriteColor] = useState("#8B5CF6");
  const [personalityTag, setPersonalityTag] = useState("温柔访客");
  const [config, setConfig] = useState<AvatarConfig>(defaultAvatarConfig);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => nickname.trim().length >= 1, [nickname]);

  async function saveProfile() {
    setSaving(true);
    setStatus(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setStatus("请先在首页登录，或使用游客身份进入。");
        return;
      }

      const profile = {
        id: user.id,
        nickname: nickname.trim(),
        bio: bio.trim() || null,
        favorite_color: favoriteColor,
        personality_tag: personalityTag.trim() || null,
        avatar_config: {
          ...config,
          avatarSeed: user.id
        }
      };

      const { error: profileError } = await supabase.from("profiles").upsert(profile);
      if (profileError) {
        setStatus(profileError.message);
        return;
      }

      const { data: existingRoom } = await supabase.from("rooms").select("id").eq("owner_id", user.id).maybeSingle();
      if (!existingRoom) {
        const { error: roomError } = await supabase.from("rooms").insert({
          owner_id: user.id,
          name: `${nickname.trim()}的小房间`,
          description: "刚刚布置好的小房间，欢迎来留言。",
          theme: "cozy",
          layout: {}
        });
        if (roomError) {
          setStatus(roomError.message);
          return;
        }
      }

      router.push("/garden");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "保存失败，请稍后再试。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <section className="rounded-[24px] bg-white p-6 pixel-border">
        <h2 className="text-2xl font-black">预览</h2>
        <div className="mt-6 flex min-h-80 items-center justify-center rounded-[20px] bg-cream manor-tile">
          <AvatarRenderer config={config} size="large" />
        </div>
      </section>
      <section className="rounded-[24px] bg-white p-6 pixel-border">
        <h1 className="text-3xl font-black">创建我的虚拟形象</h1>
        <div className="mt-6 grid gap-4">
          <input className="rounded-2xl border-2 border-ink/20 px-4 py-3" placeholder="昵称" value={nickname} onChange={(event) => setNickname(event.target.value)} />
          <textarea className="min-h-24 rounded-2xl border-2 border-ink/20 px-4 py-3" maxLength={120} placeholder="一句简介" value={bio} onChange={(event) => setBio(event.target.value)} />
          <input className="rounded-2xl border-2 border-ink/20 px-4 py-3" placeholder="人格标签，比如：夜猫子、点子王" value={personalityTag} onChange={(event) => setPersonalityTag(event.target.value)} />
          <label className="grid gap-2 text-sm font-bold">
            最喜欢的颜色
            <input className="h-12 rounded-2xl border-2 border-ink/20 px-2" type="color" value={favoriteColor} onChange={(event) => setFavoriteColor(event.target.value)} />
          </label>
        </div>
        <AvatarOption label="肤色">
          {options.skinColor.map((value) => (
            <ColorButton key={value} value={value} active={config.skinColor === value} onClick={() => setConfig({ ...config, skinColor: value })} />
          ))}
        </AvatarOption>
        <AvatarOption label="发色">
          {options.hairColor.map((value) => (
            <ColorButton key={value} value={value} active={config.hairColor === value} onClick={() => setConfig({ ...config, hairColor: value })} />
          ))}
        </AvatarOption>
        <AvatarOption label="发型">
          {options.hairStyle.map((value) => (
            <TextButton key={value} value={value} active={config.hairStyle === value} onClick={() => setConfig({ ...config, hairStyle: value })} />
          ))}
        </AvatarOption>
        <AvatarOption label="衣服">
          {options.outfit.map((value) => (
            <TextButton key={value} value={value} active={config.outfit === value} onClick={() => setConfig({ ...config, outfit: value })} />
          ))}
        </AvatarOption>
        <AvatarOption label="表情">
          {options.expression.map((value) => (
            <TextButton key={value} value={value} active={config.expression === value} onClick={() => setConfig({ ...config, expression: value })} />
          ))}
        </AvatarOption>
        <AvatarOption label="配饰">
          {options.accessory.map((value) => (
            <TextButton key={value} value={value} active={config.accessory === value} onClick={() => setConfig({ ...config, accessory: value })} />
          ))}
        </AvatarOption>
        <button className="mt-6 w-full rounded-2xl bg-ink px-5 py-4 font-black text-white disabled:opacity-50" disabled={!canSave || saving} onClick={saveProfile} type="button">
          保存并进入庄园
        </button>
        {status ? <p className="mt-3 text-sm text-ink/70">{status}</p> : null}
      </section>
    </div>
  );
}

function AvatarOption({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <p className="mb-2 text-sm font-black">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function ColorButton({ value, active, onClick }: { value: string; active: boolean; onClick: () => void }) {
  return <button aria-label={value} className={`h-10 w-10 rounded-full border-4 ${active ? "border-ink" : "border-white"}`} onClick={onClick} style={{ background: value }} type="button" />;
}

function TextButton({ value, active, onClick }: { value: string; active: boolean; onClick: () => void }) {
  return (
    <button className={`rounded-full px-4 py-2 text-sm font-bold ${active ? "bg-ink text-white" : "bg-cream text-ink"}`} onClick={onClick} type="button">
      {value}
    </button>
  );
}
