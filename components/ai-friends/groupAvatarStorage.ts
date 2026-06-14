const STORAGE_KEY = "ziki-group-avatars-v1";

type GroupAvatarMap = Record<string, string>;

function readAll(): GroupAvatarMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as GroupAvatarMap;
  } catch {
    return {};
  }
}

export function getGroupAvatar(groupId: string): string | undefined {
  return readAll()[groupId];
}

export function setGroupAvatar(groupId: string, dataUrl: string) {
  const map = readAll();
  map[groupId] = dataUrl;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function removeGroupAvatar(groupId: string) {
  const map = readAll();
  delete map[groupId];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}
