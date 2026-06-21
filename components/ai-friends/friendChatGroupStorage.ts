import { type AIFriend, defaultFriends, getDefaultFriendTemplate } from "@/lib/ai/friendGroup";
import { type FriendChatGroup, friendChatGroups } from "@/lib/ai/friendChatGroups";
import { readVisibleAIFriends } from "@/components/ai-friends/aiFriendRosterStorage";

const CUSTOM_GROUPS_KEY = "ziki-ai-custom-chat-groups-v1";
const HIDDEN_GROUPS_KEY = "ziki-ai-hidden-chat-groups-v1";

const accentColors = ["#0F766E", "#2563EB", "#7C3AED", "#EA580C", "#DB2777", "#0891B2"];

export function readVisibleFriendChatGroups() {
  const hiddenIds = new Set(readHiddenFriendChatGroupIds());
  const visibleFriends = readVisibleAIFriends();
  const visibleFriendIds = new Set(visibleFriends.map((friend) => friend.id));
  const defaultVisibleFriend = visibleFriends[0] ?? defaultFriends[0];
  const builtInGroups = friendChatGroups
    .filter((group) => !hiddenIds.has(group.id))
    .map((group) => {
      const groupFriends = group.friends.filter((friend) => visibleFriendIds.has(friend.id));
      return {
        ...group,
        friends: groupFriends.length > 0 ? groupFriends : [defaultVisibleFriend],
        description: (groupFriends.length > 0 ? groupFriends : [defaultVisibleFriend]).map((friend) => friend.name).join("、")
      };
    });

  return [...builtInGroups, ...readCustomFriendChatGroups()];
}

export function readStoredFriendChatGroup(groupId: string) {
  return readVisibleFriendChatGroups().find((group) => group.id === groupId) ?? null;
}

export function createStoredFriendChatGroup(name: string) {
  const cleanName = name.trim().slice(0, 18) || "新的朋友群";
  const now = new Date();
  const id = `custom-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const rosterFriends = readVisibleAIFriends();
  // 如果没有可见朋友，自动创建一个占位朋友
  const actualFriends = rosterFriends.length > 0
    ? rosterFriends
    : [createMinimalFriend(cleanName + "的好友")];
  const friends = actualFriends.slice(0, 3).map((friend) => ({ ...friend }));
  const group: FriendChatGroup = {
    id,
    name: cleanName,
    description: friends.map((friend) => friend.name).join("、"),
    lastMessage: "新群建好了，进来聊两句。",
    lastTime: "刚刚",
    unread: 0,
    accent: accentColors[now.getSeconds() % accentColors.length],
    style: "自然朋友群聊",
    mode: "normal",
    userState: "用户新建了一个 AI 朋友群，希望聊天自然、有来有回。",
    friends,
    initialMessages: [
      {
        friendId: friends[0].id,
        content: "新群开张。你可以先丢个话题，我们接着聊。"
      },
      {
        friendId: friends[1].id,
        content: "先说好，本群允许跑题，但不允许假装很官方。"
      }
    ]
  };

  writeCustomFriendChatGroups([group, ...readCustomFriendChatGroups()]);
  return group;
}

export function deleteStoredFriendChatGroup(groupId: string) {
  const customGroups = readCustomFriendChatGroups();
  if (customGroups.some((group) => group.id === groupId)) {
    writeCustomFriendChatGroups(customGroups.filter((group) => group.id !== groupId));
    return;
  }

  const hiddenIds = new Set(readHiddenFriendChatGroupIds());
  hiddenIds.add(groupId);
  writeHiddenFriendChatGroupIds([...hiddenIds]);
}

export function readCustomFriendChatGroups() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(CUSTOM_GROUPS_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map(sanitizeCustomGroup).filter((group): group is FriendChatGroup => group !== null).slice(0, 20);
  } catch {
    return [];
  }
}

function writeCustomFriendChatGroups(groups: FriendChatGroup[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CUSTOM_GROUPS_KEY, JSON.stringify(groups.slice(0, 20)));
}

function readHiddenFriendChatGroupIds() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(HIDDEN_GROUPS_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string").slice(0, 50) : [];
  } catch {
    return [];
  }
}

function writeHiddenFriendChatGroupIds(groupIds: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(HIDDEN_GROUPS_KEY, JSON.stringify(groupIds.slice(0, 50)));
}

function sanitizeCustomGroup(value: unknown): FriendChatGroup | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const group = value as Partial<FriendChatGroup>;
  if (typeof group.id !== "string" || typeof group.name !== "string") {
    return null;
  }

  const friends = sanitizeGroupFriends(group.friends);
  return {
    id: group.id.slice(0, 48),
    name: cleanText(group.name, "朋友群", 18),
    description: cleanText(group.description, friends.map((friend) => friend.name).join("、"), 80),
    lastMessage: cleanText(group.lastMessage, "进来聊两句。", 80),
    lastTime: cleanText(group.lastTime, "刚刚", 12),
    unread: typeof group.unread === "number" && group.unread > 0 ? Math.min(group.unread, 99) : 0,
    accent: cleanColor(group.accent, "#0F766E"),
    style: cleanText(group.style, "自然朋友群聊", 80),
    mode: group.mode ?? "normal",
    userState: cleanText(group.userState, "用户希望朋友自然接话。", 160),
    friends,
    initialMessages: Array.isArray(group.initialMessages)
      ? group.initialMessages
          .map((message): FriendChatGroup["initialMessages"][number] | null => {
            if (!message || typeof message !== "object") {
              return null;
            }
            const item = message as Partial<FriendChatGroup["initialMessages"][number]>;
            if (typeof item.friendId !== "string" || typeof item.content !== "string") {
              return null;
            }
            const initialMessage: FriendChatGroup["initialMessages"][number] = {
              friendId: item.friendId.slice(0, 40),
              content: item.content.slice(0, 180)
            };
            if (typeof item.replyTo === "string") {
              initialMessage.replyTo = item.replyTo.slice(0, 24);
            }
            return initialMessage;
          })
          .filter((message): message is FriendChatGroup["initialMessages"][number] => message !== null)
          .slice(0, 8)
      : []
  };
}

function sanitizeGroupFriends(value: unknown): AIFriend[] {
  if (!Array.isArray(value)) {
    return defaultFriends.slice(0, 3);
  }

  const friends = value
    .map((friend, index): AIFriend | null => {
      if (!friend || typeof friend !== "object") {
        return null;
      }
      const item = friend as Partial<AIFriend>;
      const defaultFriend = getDefaultFriendTemplate(typeof item.id === "string" ? item.id : defaultFriends[index % defaultFriends.length].id);
      return {
        id: cleanText(item.id, `friend-${index}`, 40),
        name: cleanText(item.name, defaultFriend.name, 18),
        title: cleanText(item.title, defaultFriend.title, 28),
        relationship: cleanText(item.relationship, defaultFriend.relationship, 220),
        personality: cleanText(item.personality, defaultFriend.personality, 220),
        style: cleanText(item.style, defaultFriend.style, 220),
        job: cleanText(item.job, defaultFriend.job, 220),
        careFocus: cleanText(item.careFocus, defaultFriend.careFocus, 220),
        quirks: cleanText(item.quirks, defaultFriend.quirks, 220),
        boundaries: cleanText(item.boundaries, defaultFriend.boundaries, 220),
        color: cleanColor(item.color, defaultFriend.color),
        avatar: typeof item.avatar === "string" && item.avatar.startsWith("data:image/") ? item.avatar.slice(0, 500000) : undefined
      };
    })
    .filter((friend): friend is AIFriend => friend !== null)
    .slice(0, 6);

  return friends.length >= 2 ? friends : defaultFriends.slice(0, 3);
}

const autoFriendColors = ["#F97373", "#F59E0B", "#2F80ED", "#10B981", "#8B5CF6", "#0891B2", "#DB2777"];

function createMinimalFriend(name: string): AIFriend {
  const id = `auto-friend-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const base = defaultFriends[0];
  const friend: AIFriend = {
    ...base,
    id,
    name: name.slice(0, 18),
    title: "自动创建的 AI 朋友",
    relationship: "刚加入的 AI 朋友。",
    personality: "友好、自然、有边界感。",
    style: "口语短句，不装熟。",
    job: "自然接话，不让群聊冷场。",
    careFocus: "用户当下想聊什么。",
    quirks: "会问具体的小问题",
    boundaries: "不抢话，不制造依赖。",
    color: autoFriendColors[Math.floor(Math.random() * autoFriendColors.length)],
    emoji: ["🐱","🐶","🐰","🦊","🐻","🐼","🐨","🐸","🐙","🦄","🐵","🐮","🐷","🐭","🐹","🐔","🐧","🦁","🐯","🐺","🦝","🦥","🦭","🐬","🐳","🦋","🐝","🐞","🪲","🦉","🦅","🦇"][Math.floor(Math.random() * 32)]
  };
  // 写入 custom friends
  const existing = (() => {
    try { return JSON.parse(window.localStorage.getItem("ziki-ai-custom-friends-v1") || "[]"); }
    catch { return []; }
  })();
  window.localStorage.setItem("ziki-ai-custom-friends-v1", JSON.stringify([friend, ...existing]));
  return friend;
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
