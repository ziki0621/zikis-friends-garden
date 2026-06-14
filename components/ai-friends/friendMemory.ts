import {
  type AIFriend,
  type FriendGroupResponse,
  type MemoryContext,
  normalizeMemoryContext
} from "@/lib/ai/friendGroup";

export type FriendMemoryState = MemoryContext & {
  groupId: string;
  turnCount: number;
  updatedAt: string;
};

const MAX_SUMMARY_LINES = 10;
const MAX_USER_MEMORY = 18;
const MAX_FRIEND_MEMORY = 8;
const MAX_PINNED_FACTS = 12;

export function createEmptyFriendMemory(groupId: string): FriendMemoryState {
  return {
    groupId,
    compactSummary: "",
    userMemory: [],
    friendMemories: {},
    pinnedFacts: [],
    turnCount: 0,
    updatedAt: new Date().toISOString()
  };
}

export function readFriendMemory(groupId: string): FriendMemoryState {
  if (typeof window === "undefined") {
    return createEmptyFriendMemory(groupId);
  }

  try {
    const raw = window.localStorage.getItem(getMemoryStorageKey(groupId));
    if (!raw) {
      return createEmptyFriendMemory(groupId);
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return createEmptyFriendMemory(groupId);
    }

    const value = parsed as Partial<FriendMemoryState>;
    const memory = normalizeMemoryContext(value);
    return {
      groupId,
      compactSummary: memory.compactSummary,
      userMemory: memory.userMemory.slice(0, MAX_USER_MEMORY),
      friendMemories: trimFriendMemories(memory.friendMemories),
      pinnedFacts: memory.pinnedFacts.slice(0, MAX_PINNED_FACTS),
      turnCount: typeof value.turnCount === "number" && Number.isFinite(value.turnCount) ? Math.max(0, value.turnCount) : 0,
      updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString()
    };
  } catch {
    return createEmptyFriendMemory(groupId);
  }
}

export function writeFriendMemory(memory: FriendMemoryState) {
  if (typeof window === "undefined") {
    return;
  }

  const safeMemory: FriendMemoryState = {
    ...createEmptyFriendMemory(memory.groupId),
    ...normalizeMemoryContext(memory),
    groupId: memory.groupId,
    friendMemories: trimFriendMemories(memory.friendMemories),
    turnCount: Math.max(0, memory.turnCount),
    updatedAt: memory.updatedAt
  };

  window.localStorage.setItem(getMemoryStorageKey(memory.groupId), JSON.stringify(safeMemory));
}

export function updateFriendMemoryFromResponse(groupId: string, friends: AIFriend[], response: FriendGroupResponse) {
  const current = readFriendMemory(groupId);
  const summaryLine = buildSummaryLine(response);
  const summaryLines = uniqueCompactLines([summaryLine, ...current.compactSummary.split("\n")]).slice(0, MAX_SUMMARY_LINES);
  const friendMemories = mergeFriendMessageMemory(current.friendMemories, friends, response);

  const next: FriendMemoryState = {
    groupId,
    compactSummary: summaryLines.join("\n").slice(0, 1600),
    userMemory: uniqueList([...response.memoryCandidates, ...current.userMemory], 180).slice(0, MAX_USER_MEMORY),
    friendMemories,
    pinnedFacts: current.pinnedFacts.slice(0, MAX_PINNED_FACTS),
    turnCount: current.turnCount + 1,
    updatedAt: new Date().toISOString()
  };

  writeFriendMemory(next);
  return next;
}

export function toMemoryContext(memory: FriendMemoryState): MemoryContext {
  return {
    compactSummary: memory.compactSummary,
    userMemory: memory.userMemory,
    friendMemories: memory.friendMemories,
    pinnedFacts: memory.pinnedFacts
  };
}

function getMemoryStorageKey(groupId: string) {
  return `ziki-ai-friend-memory-v1:${groupId}`;
}

function buildSummaryLine(response: FriendGroupResponse) {
  const points = response.summary.mainPoints.filter(Boolean).slice(0, 2).join("；");
  const nextAction = response.summary.nextAction?.trim();
  const line = [points, nextAction ? `下一步：${nextAction}` : ""].filter(Boolean).join("。");
  return line.slice(0, 220);
}

function mergeFriendMessageMemory(
  current: Record<string, string[]>,
  friends: AIFriend[],
  response: FriendGroupResponse
) {
  const knownFriendIds = new Set(friends.map((friend) => friend.id));
  const next: Record<string, string[]> = trimFriendMemories(current);

  response.messages.slice(-6).forEach((message) => {
    if (!knownFriendIds.has(message.friendId)) {
      return;
    }

    const content = message.content.trim().replace(/\s+/g, " ").slice(0, 90);
    if (!content) {
      return;
    }

    const line = `最近说过：${content}`;
    next[message.friendId] = uniqueList([line, ...(next[message.friendId] ?? [])], 140).slice(0, MAX_FRIEND_MEMORY);
  });

  return next;
}

function trimFriendMemories(memories: Record<string, string[]>) {
  const next: Record<string, string[]> = {};
  Object.entries(memories)
    .slice(0, 12)
    .forEach(([friendId, items]) => {
      const safeItems = uniqueList(items, 140).slice(0, MAX_FRIEND_MEMORY);
      if (safeItems.length > 0) {
        next[friendId.slice(0, 40)] = safeItems;
      }
    });
  return next;
}

function uniqueCompactLines(lines: string[]) {
  return uniqueList(
    lines
      .flatMap((line) => line.split("\n"))
      .map((line) => line.trim())
      .filter(Boolean),
    220
  );
}

function uniqueList(items: string[], maxLength: number) {
  return Array.from(
    new Set(
      items
        .filter((item) => typeof item === "string")
        .map((item) => item.trim().replace(/\s+/g, " ").slice(0, maxLength))
        .filter(Boolean)
    )
  );
}
