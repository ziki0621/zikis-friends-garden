const KEY_PREFIX = "ziki-group-summary:";

export function getGroupSummary(groupId: string): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(KEY_PREFIX + groupId) || "";
}

export function setGroupSummary(groupId: string, summary: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY_PREFIX + groupId, summary.slice(0, 600));
}

export function formatGroupSummaryForPrompt(groupId: string, groupName: string): string {
  const s = getGroupSummary(groupId);
  if (!s) return `【群聊：${groupName}】暂无摘要。`;
  return `【群聊「${groupName}」摘要】${s}`;
}
