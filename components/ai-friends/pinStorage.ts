const KEY = "ziki-pinned-chats-v1";

export function getPinnedChats(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch { return []; }
}

export function pinChat(id: string) {
  const pinned = getPinnedChats();
  if (!pinned.includes(id)) {
    pinned.unshift(id);
    window.localStorage.setItem(KEY, JSON.stringify(pinned));
  }
}

export function unpinChat(id: string) {
  const pinned = getPinnedChats().filter((x) => x !== id);
  window.localStorage.setItem(KEY, JSON.stringify(pinned));
}

export function isChatPinned(id: string): boolean {
  return getPinnedChats().includes(id);
}
