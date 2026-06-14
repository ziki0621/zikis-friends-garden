const KEY_PREFIX = "ziki-friend-memory:";

export type FriendMemoryItem = {
  createdAt: number;
  content: string;
};

export function getFriendMemory(friendId: string): FriendMemoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY_PREFIX + friendId);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(-20) : [];
  } catch { return []; }
}

export function addFriendMemory(friendId: string, content: string) {
  if (typeof window === "undefined") return;
  const memories = getFriendMemory(friendId);
  memories.push({ createdAt: Date.now(), content: content.slice(0, 180) });
  window.localStorage.setItem(KEY_PREFIX + friendId, JSON.stringify(memories.slice(-20)));
}

/** 自动从聊天中提取关键记忆 */
export function autoMemorizeFromChat(friendId: string, context: string) {
  // 简单规则：检测关键信号
  const signals = [
    /用户(喜欢|不想|讨厌|害怕|担心|关注|决定|计划)/,
    /(压力|焦虑|开心|难过|兴奋|失眠|拖延)/,
    /(目标|项目|工作|学习|关系|家庭)/,
  ];
  for (const re of signals) {
    const match = context.match(re);
    if (match) {
      const snippet = context.slice(Math.max(0, context.indexOf(match[0]) - 10), context.indexOf(match[0]) + 50);
      // 防止重复
      const existing = getFriendMemory(friendId).map(m => m.content);
      if (!existing.some(e => e.includes(snippet.slice(0, 20)))) {
        addFriendMemory(friendId, snippet.trim());
      }
    }
  }
}

export function formatFriendMemoryForPrompt(friendId: string, friendName: string): string {
  const memories = getFriendMemory(friendId);
  if (memories.length === 0) return "";
  return [
    `【${friendName} 对用户的记忆】`,
    ...memories.slice(-10).map(m => `- ${m.content}`)
  ].join("\n");
}
