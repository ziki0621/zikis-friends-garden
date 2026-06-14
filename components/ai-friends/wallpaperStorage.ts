const KEY = "ziki-wallpaper-v1";

export const wallpapers = [
  { id: "garden", label: "庄园花园", emoji: "🌸" },
  { id: "linen", label: "亚麻纹理", emoji: "🧶" },
  { id: "stars", label: "星点夜幕", emoji: "✨" },
  { id: "plain", label: "素净暖色", emoji: "🍂" }
] as const;

export type WallpaperId = (typeof wallpapers)[number]["id"];

export function getWallpaper(): WallpaperId {
  if (typeof window === "undefined") return "garden";
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw && wallpapers.some((w) => w.id === raw)) return raw as WallpaperId;
  } catch {}
  return "garden";
}

export function setWallpaper(id: WallpaperId) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, id);
}

export function getWallpaperClass(): string {
  const id = getWallpaper();
  if (id === "garden") return "chat-wallpaper";
  return `chat-wallpaper-${id}`;
}
