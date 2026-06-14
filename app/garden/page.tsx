import { GardenMap } from "@/components/garden/GardenMap";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/db/types";

export default async function GardenPage() {
  const supabase = await createClient();
  let friends: Profile[] = [];
  let currentUserId: string | undefined;

  if (supabase) {
    const [{ data: profiles }, { data: auth }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.auth.getUser()
    ]);
    friends = (profiles ?? []) as Profile[];
    currentUserId = auth.user?.id;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-4xl font-black">庄园地图</h1>
        <p className="mt-2 text-ink/70">点击建筑或朋友头像就可以开始探索。</p>
      </div>
      <GardenMap friends={friends} currentUserId={currentUserId} />
    </main>
  );
}
