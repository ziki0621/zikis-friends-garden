const KEY = "ziki-chat-activity-v1";

type ActivityMap = Record<string, number>;

function readAll(): ActivityMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as ActivityMap : {};
  } catch { return {}; }
}

export function touchChat(id: string) {
  const map = readAll();
  map[id] = Date.now();
  window.localStorage.setItem(KEY, JSON.stringify(map));
}

export function getLastActivity(id: string): number {
  return readAll()[id] ?? 0;
}

export function removeActivity(id: string) {
  const map = readAll();
  delete map[id];
  window.localStorage.setItem(KEY, JSON.stringify(map));
}
