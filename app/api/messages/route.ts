import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type MessageBody = {
  roomId?: string;
  content?: string;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const body = (await request.json()) as MessageBody;
  const content = body.content?.trim() ?? "";

  if (!body.roomId) {
    return NextResponse.json({ error: "roomId is required." }, { status: 400 });
  }
  if (!content || content.length > 300) {
    return NextResponse.json({ error: "content must be 1-300 characters." }, { status: 400 });
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: room } = await supabase.from("rooms").select("id").eq("id", body.roomId).maybeSingle();
  if (!room) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }

  const { data: profile } = await supabase.from("profiles").select("nickname").eq("id", user.id).maybeSingle();
  const { error } = await supabase.from("messages").insert({
    room_id: body.roomId,
    author_id: user.id,
    author_name: profile?.nickname ?? "匿名朋友",
    content
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
