const KEY = "ziki-unread-v2";

type UnreadMap = Record<string, number>;

function readAll(): UnreadMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as UnreadMap : {};
  } catch { return {}; }
}

function writeAll(map: UnreadMap) {
  if (typeof window === "undefined") return;
  // 清理零值
  const cleaned: UnreadMap = {};
  for (const [id, count] of Object.entries(map)) {
    if (count > 0) cleaned[id] = count;
  }
  window.localStorage.setItem(KEY, JSON.stringify(cleaned));
}

/** 获取某个对话的未读数 */
export function getUnread(id: string): number {
  return readAll()[id] ?? 0;
}

/** 设置未读数 */
export function setUnread(id: string, count: number) {
  const map = readAll();
  map[id] = Math.max(0, count);
  writeAll(map);
}

/** 对话框被打开时清零 */
export function clearUnread(id: string) {
  setUnread(id, 0);
}

/** 消息到达时递增（可用于未来的 push 场景） */
export function incrementUnread(id: string) {
  const current = getUnread(id);
  setUnread(id, current + 1);
}

/** 给预设群聊写入初始未读数（仅首次） */
export function seedInitialUnreads() {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem("ziki-unread-seeded-v1")) return;
  window.localStorage.setItem(KEY, JSON.stringify({
    "inner-noise": 3,
    "deadline-squad": 1
  }));
  window.localStorage.setItem("ziki-unread-seeded-v1", "1");
}

/** 获取所有未读总数（用于 Tab 角标） */
export function getTotalUnread(): number {
  return Object.values(readAll()).reduce((sum, c) => sum + c, 0);
}
