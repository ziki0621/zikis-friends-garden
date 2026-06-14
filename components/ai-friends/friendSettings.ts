import { type AIFriend, getDefaultFriendTemplate } from "@/lib/ai/friendGroup";

export type FriendSettingsMap = Record<string, AIFriend[]>;

const STORAGE_KEY = "ziki-ai-friend-settings-v1";
const USER_PROFILE_KEY = "ziki-ai-user-profile-v1";

export type UserProfile = {
  name: string;
  title: string;
  about: string;
  chatStyle: string;
  color: string;
  avatar?: string;
  emoji?: string;
};

export const defaultUserProfile: UserProfile = {
  name: "我",
  title: "群主",
  about: "正在和 AI 朋友一起聊天，想要自然、有分寸的陪伴。",
  chatStyle: "喜欢朋友像真实群聊一样自然接话，不要太像客服。",
  color: "#95EC69",
  emoji: "🏠"
};

export function readFriendSettings(): FriendSettingsMap {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return parsed as FriendSettingsMap;
  } catch {
    return {};
  }
}

export function writeFriendSettings(settings: FriendSettingsMap) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function readUserProfile(): UserProfile {
  if (typeof window === "undefined") {
    return defaultUserProfile;
  }

  try {
    const raw = window.localStorage.getItem(USER_PROFILE_KEY);
    if (!raw) {
      return defaultUserProfile;
    }

    return sanitizeUserProfile(JSON.parse(raw) as unknown);
  } catch {
    return defaultUserProfile;
  }
}

export function writeUserProfile(profile: UserProfile) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(sanitizeUserProfile(profile)));
}

export function getConfiguredFriends(groupId: string, fallbackFriends: AIFriend[], settings: FriendSettingsMap) {
  return sanitizeFriends(settings[groupId], fallbackFriends);
}

export function getStoredConfiguredFriends(groupId: string, fallbackFriends: AIFriend[]) {
  return getConfiguredFriends(groupId, fallbackFriends, readFriendSettings());
}

export function sanitizeFriends(value: unknown, fallbackFriends: AIFriend[]) {
  if (!Array.isArray(value)) {
    return fallbackFriends;
  }

  const sourceFriends = value.length > 0 ? value : fallbackFriends;
  const sanitized = sourceFriends
    .map((item, index): AIFriend | null => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const friend = item as Partial<AIFriend>;
      const fallbackFriend = fallbackFriends.find((candidate) => candidate.id === friend.id) ?? fallbackFriends[index] ?? getDefaultFriendTemplate("");
      const defaultFriend = getDefaultFriendTemplate(typeof friend.id === "string" ? friend.id : fallbackFriend.id);
    const baseFriend: AIFriend = {
      ...defaultFriend,
      ...fallbackFriend,
      relationship: cleanText(fallbackFriend.relationship, defaultFriend.relationship, 220),
      personality: cleanText(fallbackFriend.personality, defaultFriend.personality, 220),
      style: cleanText(fallbackFriend.style, defaultFriend.style, 220),
      job: cleanText(fallbackFriend.job, defaultFriend.job, 220),
      careFocus: cleanText(fallbackFriend.careFocus, defaultFriend.careFocus, 220),
      quirks: cleanText(fallbackFriend.quirks, defaultFriend.quirks, 220),
      boundaries: cleanText(fallbackFriend.boundaries, defaultFriend.boundaries, 220)
    };

      return {
      ...baseFriend,
        id: cleanText(friend?.id, baseFriend.id, 40),
      name: cleanText(friend?.name, baseFriend.name, 18),
      title: cleanText(friend?.title, baseFriend.title, 28),
      relationship: cleanText(friend?.relationship, baseFriend.relationship, 220),
      personality: cleanText(friend?.personality, baseFriend.personality, 220),
      style: cleanText(friend?.style, baseFriend.style, 220),
      job: cleanText(friend?.job, baseFriend.job, 220),
      careFocus: cleanText(friend?.careFocus, baseFriend.careFocus, 220),
      quirks: cleanText(friend?.quirks, baseFriend.quirks, 220),
      boundaries: cleanText(friend?.boundaries, baseFriend.boundaries, 220),
      color: cleanColor(friend?.color, baseFriend.color),
      avatar: cleanAvatar(friend?.avatar)
    };
    })
    .filter((friend): friend is AIFriend => friend !== null)
    .slice(0, 8);

  return sanitized.length > 0 ? sanitized : fallbackFriends.slice(0, 1);
}

export function enrichFriendSettingsBase(friend: AIFriend): AIFriend {
  const defaultFriend = getDefaultFriendTemplate(friend.id);
  return {
    ...defaultFriend,
    ...friend,
    relationship: cleanText(friend.relationship, defaultFriend.relationship, 220),
    personality: cleanText(friend.personality, defaultFriend.personality, 220),
    style: cleanText(friend.style, defaultFriend.style, 220),
    job: cleanText(friend.job, defaultFriend.job, 220),
    careFocus: cleanText(friend.careFocus, defaultFriend.careFocus, 220),
    quirks: cleanText(friend.quirks, defaultFriend.quirks, 220),
    boundaries: cleanText(friend.boundaries, defaultFriend.boundaries, 220)
  };
}

export function sanitizeUserProfile(value: unknown): UserProfile {
  if (!value || typeof value !== "object") {
    return defaultUserProfile;
  }

  const profile = value as Partial<UserProfile>;
  return {
    name: cleanText(profile.name, defaultUserProfile.name, 18),
    title: cleanText(profile.title, defaultUserProfile.title, 28),
    about: cleanText(profile.about, defaultUserProfile.about, 160),
    chatStyle: cleanText(profile.chatStyle, defaultUserProfile.chatStyle, 160),
    color: cleanColor(profile.color, defaultUserProfile.color),
    avatar: cleanAvatar(profile.avatar)
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

function cleanAvatar(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  if (!value.startsWith("data:image/")) {
    return undefined;
  }

  return value.slice(0, 500000);
}
