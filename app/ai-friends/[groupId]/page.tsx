import type { Metadata } from "next";
import { AIFriendsChatRoute } from "@/components/ai-friends/AIFriendsChatRoute";
import { friendChatGroups, getFriendChatGroup } from "@/lib/ai/friendChatGroups";

type GroupPageProps = {
  params: Promise<{
    groupId: string;
  }>;
};

export async function generateStaticParams() {
  return friendChatGroups.map((group) => ({
    groupId: group.id
  }));
}

export const dynamicParams = true;

export async function generateMetadata({ params }: GroupPageProps): Promise<Metadata> {
  const { groupId } = await params;
  const group = getFriendChatGroup(groupId);

  return {
    title: group ? `${group.name} | AI 朋友群聊` : "AI 朋友群聊"
  };
}

export default async function FriendChatGroupPage({ params }: GroupPageProps) {
  const { groupId } = await params;
  const group = getFriendChatGroup(groupId);

  return <AIFriendsChatRoute groupId={groupId} initialGroup={group ?? null} />;
}
