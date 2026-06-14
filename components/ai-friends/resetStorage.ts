const ALL_KEYS = [
  "ziki-user-api-config-v1",
  "ziki-ai-chat-history-v1",
  "ziki-ai-friend-settings-v1",
  "ziki-ai-user-profile-v1",
  "ziki-pinned-chats-v1",
  "ziki-unread-v2",
  "ziki-unread-seeded-v1",
  "ziki-group-avatars-v1",
  "ziki-ai-friend-roster-v1",
  "ziki-ai-friend-chat-groups-v1",
  "ziki-friend-relations-v1",
  "ziki-chat-activity-v1",
  "ziki-pending-batch-v1"
];

export function resetAllData() {
  if (typeof window === "undefined") return;
  ALL_KEYS.forEach((key) => {
    // 前缀匹配清掉所有变体（如 chat-history 带 id 后缀的）
    if (key.endsWith("-v1")) {
      const prefix = key.replace(/-v\d+$/, "");
      for (let i = window.localStorage.length - 1; i >= 0; i--) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(prefix)) {
          window.localStorage.removeItem(k);
        }
      }
    }
  });
  // 再清一遍精确匹配的
  ALL_KEYS.forEach((key) => window.localStorage.removeItem(key));
}
