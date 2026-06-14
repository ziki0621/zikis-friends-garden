import { FriendSettingsPage } from "@/components/ai-friends/FriendSettingsPage";

type PageProps = { params: Promise<{ friendId: string }> };

export default async function FriendSettingsRoute({ params }: PageProps) {
  const { friendId } = await params;
  return <FriendSettingsPage friendId={friendId} />;
}
