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
];

const BACKUP_KEY = "ziki-backup-before-reset-v1";

const PRESET_GROUP_IDS = ["inner-noise", "deadline-squad", "late-night", "crossroads", "daily-chaos"];
const PRESET_FRIEND_IDS = ["nana", "kai", "lin", "momo", "yan"];

/** 重置前备份全部数据 */
export function backupAllData() {
  if (typeof window === "undefined") return;
  const snapshot: Record<string, string> = {};
  for (let i = window.localStorage.length - 1; i >= 0; i--) {
    const key = window.localStorage.key(i);
    if (!key) continue;
    if (PREFIXES.some((p) => key.startsWith(p)) || key.startsWith("ziki-user-api-config")) {
      const value = window.localStorage.getItem(key);
      if (value !== null) snapshot[key] = value;
    }
  }
  if (Object.keys(snapshot).length > 0) {
    window.localStorage.setItem(BACKUP_KEY, JSON.stringify(snapshot));
  }
}

/** 检查是否有备份 */
export function hasBackup(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(BACKUP_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && Object.keys(parsed).length > 0;
  } catch { return false; }
}

/** 恢复备份 */
export function restoreFromBackup() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(BACKUP_KEY);
    if (!raw) return;
    const snapshot = JSON.parse(raw);
    if (!snapshot || typeof snapshot !== "object") return;
    Object.entries(snapshot).forEach(([key, value]) => {
      if (typeof value === "string") {
        window.localStorage.setItem(key, value);
      }
    });
    // 恢复后删掉备份
    window.localStorage.removeItem(BACKUP_KEY);
  } catch {}
}

/** 清除备份（确认不恢复后调用） */
export function discardBackup() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(BACKUP_KEY);
}

export function resetAllData() {
  if (typeof window === "undefined") return;

  for (let i = window.localStorage.length - 1; i >= 0; i--) {
    const key = window.localStorage.key(i);
    if (!key) continue;
    if (PREFIXES.some((p) => key.startsWith(p))) {
      window.localStorage.removeItem(key);
    }
  }

  window.localStorage.setItem("ziki-ai-hidden-chat-groups-v1", JSON.stringify(PRESET_GROUP_IDS));
  window.localStorage.setItem("ziki-ai-hidden-friends-v1", JSON.stringify(PRESET_FRIEND_IDS));
  window.localStorage.removeItem("ziki-unread-seeded-v1");
}
