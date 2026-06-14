import { AIFriendSettingsRoute } from "@/components/ai-friends/AIFriendSettingsRoute";
import { friendChatGroups, getFriendChatGroup } from "@/lib/ai/friendChatGroups";

type PageProps = {
  params: Promise<{
    groupId: string;
  }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { groupId } = await params;
  const group = getFriendChatGroup(groupId);

  return {
    title: group ? `${group.name}设置 | AI 朋友群聊` : "AI 朋友设定"
  };
}

export async function generateStaticParams() {
  return friendChatGroups.map((group) => ({
    groupId: group.id
  }));
}

export const dynamicParams = true;

export default async function AIFriendSettingsPageRoute({ params }: PageProps) {
  const { groupId } = await params;
  const group = getFriendChatGroup(groupId);

  return <AIFriendSettingsRoute groupId={groupId} initialGroup={group ?? null} />;
}
