import { type AIFriend, defaultFriends, getDefaultFriendTemplate } from "@/lib/ai/friendGroup";
import { readFriendSettings, writeFriendSettings } from "@/components/ai-friends/friendSettings";

const CUSTOM_FRIENDS_KEY = "ziki-ai-custom-friends-v1";
const HIDDEN_FRIENDS_KEY = "ziki-ai-hidden-friends-v1";

const friendColors = ["#F97373", "#F59E0B", "#2F80ED", "#10B981", "#8B5CF6", "#0891B2", "#DB2777"];

export function readVisibleAIFriends() {
  const hiddenIds = new Set(readHiddenAIFriendIds());
  return [...defaultFriends.filter((friend) => !hiddenIds.has(friend.id)), ...readCustomAIFriends()];
}

export function readStoredAIFriend(friendId: string) {
  return readVisibleAIFriends().find((friend) => friend.id === friendId) ?? null;
}

export function createStoredAIFriend(name: string) {
  const cleanName = name.trim().slice(0, 18) || "新朋友";
  const now = new Date();
  const id = `friend-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const friend: AIFriend = {
    ...defaultFriends[0],
    id,
    name: cleanName,
    title: "刚加入的 AI 朋友",
    relationship: "像刚拉进群的新朋友，正在慢慢熟悉用户和其他朋友。",
    personality: "友好、好奇、有边界感，会先观察大家怎么聊天，再自然加入。",
    style: "自然口语，短句，不装熟，也不端着。",
    job: "补充新视角，接住冷场，让聊天更像真实朋友群。",
    careFocus: "用户当下真正想聊什么，以及群里有没有没人接住的话。",
    quirks: "会先问一句很具体的小问题；熟起来后会有自己的固定口头禅。",
    boundaries: "不抢话，不制造依赖，不替用户做重大决定。",
    color: friendColors[now.getSeconds() % friendColors.length],
    emoji: ["🐱", "🐶", "🐰", "🦊", "🐻", "🐼", "🐨", "🐸", "🐙", "🦄"][now.getSeconds() % 10]
  };

  writeCustomAIFriends([friend, ...readCustomAIFriends()]);
  return friend;
}

export function deleteStoredAIFriend(friendId: string) {
  const customFriends = readCustomAIFriends();
  if (customFriends.some((friend) => friend.id === friendId)) {
    writeCustomAIFriends(customFriends.filter((friend) => friend.id !== friendId));
  } else {
    const hiddenIds = new Set(readHiddenAIFriendIds());
    hiddenIds.add(friendId);
    writeHiddenAIFriendIds([...hiddenIds]);
  }

  const settings = readFriendSettings();
  const nextSettings = Object.fromEntries(
    Object.entries(settings).map(([groupId, friends]) => [groupId, friends.filter((friend) => friend.id !== friendId)])
  );
  writeFriendSettings(nextSettings);
}

export function readCustomAIFriends() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(CUSTOM_FRIENDS_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map(sanitizeFriend).filter((friend): friend is AIFriend => friend !== null).slice(0, 30);
  } catch {
    return [];
  }
}

export function updateStoredAIFriend(friendId: string, updates: Partial<AIFriend>) {
  const friends = readVisibleAIFriends();
  const next = friends.map((f) => (f.id === friendId ? { ...f, ...updates } : f));
  // Write back to the right store (custom or hidden)
  const custom = readCustomAIFriends();
  if (custom.some((f) => f.id === friendId)) {
    writeCustomAIFriends(next.filter((f) => custom.some((c) => c.id === f.id)));
  }
  // Also update group-level friend settings
  const groupSettings = readFriendSettings();
  for (const [gid, gfs] of Object.entries(groupSettings)) {
    if (gfs.some((f) => f.id === friendId)) {
      groupSettings[gid] = gfs.map((f) => (f.id === friendId ? { ...f, ...updates } : f));
    }
  }
  writeFriendSettings(groupSettings);
}

export function writeCustomAIFriends(friends: AIFriend[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CUSTOM_FRIENDS_KEY, JSON.stringify(friends.slice(0, 30)));
}

function readHiddenAIFriendIds() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(HIDDEN_FRIENDS_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string").slice(0, 50) : [];
  } catch {
    return [];
  }
}

function writeHiddenAIFriendIds(friendIds: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(HIDDEN_FRIENDS_KEY, JSON.stringify(friendIds.slice(0, 50)));
}

function sanitizeFriend(value: unknown): AIFriend | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Partial<AIFriend>;
  if (typeof item.id !== "string" || typeof item.name !== "string") {
    return null;
  }

  const fallback = getDefaultFriendTemplate(item.id);
  return {
    id: cleanText(item.id, fallback.id, 48),
    name: cleanText(item.name, fallback.name, 18),
    title: cleanText(item.title, fallback.title, 40),
    relationship: cleanText(item.relationship, fallback.relationship, 220),
    personality: cleanText(item.personality, fallback.personality, 220),
    style: cleanText(item.style, fallback.style, 220),
    job: cleanText(item.job, fallback.job, 220),
    careFocus: cleanText(item.careFocus, fallback.careFocus, 220),
    quirks: cleanText(item.quirks, fallback.quirks, 220),
    boundaries: cleanText(item.boundaries, fallback.boundaries, 220),
    color: cleanColor(item.color, fallback.color),
    avatar: typeof item.avatar === "string" && item.avatar.startsWith("data:image/") ? item.avatar.slice(0, 500000) : undefined
  };
}

function cleanText(value: unknown, fallback: string, maxLength: number) {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : fallback;
}

function cleanColor(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}
