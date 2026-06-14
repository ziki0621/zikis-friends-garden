const KEY = "ziki-wallpaper-v1";

export const wallpapers = [
  { id: "garden", label: "庄园花园", emoji: "🌸", animated: false },
  { id: "linen", label: "亚麻纹理", emoji: "🧶", animated: false },
  { id: "stars", label: "星点夜幕", emoji: "✨", animated: false },
  { id: "plain", label: "素净暖色", emoji: "🍂", animated: false },
  { id: "sakura", label: "飘落花瓣", emoji: "💮", animated: true },
  { id: "aurora", label: "柔光浮动", emoji: "🌅", animated: true },
  { id: "cosmos", label: "星辰流转", emoji: "🌌", animated: true }
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
  const wp = wallpapers.find((w) => w.id === id);
  if (!wp || wp.id === "garden") return "chat-wallpaper";
  return `chat-wallpaper-${wp.id}`;
}
