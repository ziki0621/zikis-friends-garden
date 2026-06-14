const PREFIXES = [
  "ziki-ai-chat-history",
  "ziki-ai-friend-settings",
  "ziki-ai-user-profile",
  "ziki-pinned-chats",
  "ziki-unread",
  "ziki-unread-seeded",
  "ziki-group-avatars",
  "ziki-ai-friend-roster",
  "ziki-ai-custom-friends",
  "ziki-ai-hidden-friends",
  "ziki-ai-friend-chat-groups",
  "ziki-ai-custom-chat-groups",
  "ziki-ai-hidden-chat-groups",
  "ziki-friend-relations",
  "ziki-chat-activity",
  "ziki-pending-batch"
  // API Key (ziki-user-api-config) 不在此列，单独在 🔑 中管理
];

export function resetAllData() {
  if (typeof window === "undefined") return;
  for (let i = window.localStorage.length - 1; i >= 0; i--) {
    const key = window.localStorage.key(i);
    if (!key) continue;
    if (PREFIXES.some((p) => key.startsWith(p))) {
      window.localStorage.removeItem(key);
    }
  }
}
