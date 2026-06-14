import { AIFriendDirectRoute } from "@/components/ai-friends/AIFriendDirectRoute";

type PageProps = {
  params: Promise<{
    friendId: string;
  }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { friendId } = await params;

  return {
    title: `${friendId} | AI 朋友私聊`
  };
}

export default async function AIFriendDirectPage({ params }: PageProps) {
  const { friendId } = await params;

  return <AIFriendDirectRoute friendId={friendId} />;
}
