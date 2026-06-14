import { type AIFriend } from "@/lib/ai/friendGroup";
import {
  type FriendRelation,
  defaultFriendRelations,
  filterRelationsForFriends,
  normalizeFriendRelations
} from "@/lib/ai/friendRelations";

const FRIEND_RELATIONS_KEY = "ziki-ai-friend-relations-v1";

export function readStoredFriendRelations() {
  if (typeof window === "undefined") {
    return defaultFriendRelations;
  }

  try {
    const raw = window.localStorage.getItem(FRIEND_RELATIONS_KEY);
    if (!raw) {
      return defaultFriendRelations;
    }

    return normalizeFriendRelations(JSON.parse(raw) as unknown);
  } catch {
    return defaultFriendRelations;
  }
}

export function writeStoredFriendRelations(relations: FriendRelation[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(FRIEND_RELATIONS_KEY, JSON.stringify(normalizeFriendRelations(relations)));
}

export function resetStoredFriendRelations() {
  if (typeof window === "undefined") {
    return defaultFriendRelations;
  }

  window.localStorage.removeItem(FRIEND_RELATIONS_KEY);
  return defaultFriendRelations;
}

export function readFriendRelationsForFriends(friends: AIFriend[]) {
  return filterRelationsForFriends(readStoredFriendRelations(), friends);
}
