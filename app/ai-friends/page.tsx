import type { Metadata } from "next";
import { AIFriendsInbox } from "@/components/ai-friends/AIFriendsInbox";

export const metadata: Metadata = {
  title: "消息 | AI 朋友群聊",
  description: "AI 朋友群聊 Demo。"
};

export default function AIFriendsPage() {
  return <AIFriendsInbox />;
}
