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

/** 预设群聊和 AI 朋友的 ID，重置后全部隐藏 */
const PRESET_GROUP_IDS = ["inner-noise", "deadline-squad", "late-night", "crossroads", "daily-chaos"];
const PRESET_FRIEND_IDS = ["nana", "kai", "lin", "momo", "yan"];

export function resetAllData() {
  if (typeof window === "undefined") return;

  // 先清除所有本地数据
  for (let i = window.localStorage.length - 1; i >= 0; i--) {
    const key = window.localStorage.key(i);
    if (!key) continue;
    if (PREFIXES.some((p) => key.startsWith(p))) {
      window.localStorage.removeItem(key);
    }
  }

  // 标记所有预设群聊和朋友为隐藏，让它们不出现
  window.localStorage.setItem("ziki-ai-hidden-chat-groups-v1", JSON.stringify(PRESET_GROUP_IDS));
  window.localStorage.setItem("ziki-ai-hidden-friends-v1", JSON.stringify(PRESET_FRIEND_IDS));
  // 清除种子标记，避免预设未读复活
  window.localStorage.removeItem("ziki-unread-seeded-v1");
}
