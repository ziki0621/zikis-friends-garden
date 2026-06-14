import { type AIFriend, type ChatHistoryMessage } from "@/lib/ai/friendGroup";
import { formatUserProfileForPrompt } from "@/components/ai-friends/userProfileStorage";
import { formatFriendMemoryForPrompt, autoMemorizeFromChat } from "@/components/ai-friends/friendMemoryStorage";
import { formatGroupSummaryForPrompt, setGroupSummary, getGroupSummary } from "@/components/ai-friends/groupSummaryStorage";
import { searchHistory, extractKeywords, saveToSearchableHistory } from "@/components/ai-friends/searchableHistory";
import { callFriendModelJson } from "@/lib/ai/openAICompatible";

/* ─── 拼接 5 层上下文 ─── */

export type ContextLayers = {
  /** 完整 system prompt */
  system: string;
  /** 完整 user prompt */
  user: string;
  /** 是否需要异步生成摘要 */
  needsSummaryUpdate: boolean;
  groupId: string;
  userMessage: string;
  friends: AIFriend[];
};

export async function assembleContext(params: {
  groupId: string;
  groupName: string;
  message: string;
  history: ChatHistoryMessage[];
  friends: AIFriend[];
  mode: string;
  groupStyle: string;
  userConfig?: { apiKey?: string; baseUrl?: string; model?: string; providerName?: string } | null;
}): Promise<ContextLayers> {
  const { groupId, groupName, message, history, friends, mode, groupStyle, userConfig } = params;

  // ── Layer 4: 检索相关历史 ──
  const keywords = extractKeywords(message);
  const relatedHistory = searchHistory(keywords, groupId, 600);

  // ── Layer 5: 最近原文（最后 12 条）──
  const recentRaw = history.slice(-12).map(h =>
    `${h.role === "user" ? "用户" : h.speaker || "AI"}: ${h.content}`
  ).join("\n");

  // ── Layer 3: 群聊摘要 ──
  const groupSummary = formatGroupSummaryForPrompt(groupId, groupName);

  // ── Layer 2: 每个朋友对用户的记忆 ──
  const friendMemories = friends.map(f =>
    formatFriendMemoryForPrompt(f.id, f.name)
  ).filter(Boolean).join("\n\n");

  // ── Layer 1: 用户长期档案 ──
  const userProfile = formatUserProfileForPrompt();

  // ── 构建 system prompt ──
  const systemPrompt = [
    `你是 AI 朋友群聊调度器。当前群聊：「${groupName}」，风格：${groupStyle}，模式：${mode}。`,
    "",
    userProfile,
    "",
    groupSummary,
    "",
    friendMemories ? `【朋友们的个人记忆】\n${friendMemories}` : "",
    relatedHistory ? `【检索到的相关历史】\n${relatedHistory}` : "",
    "",
    "以上为上下文。请参考这些信息来理解用户、把握分寸、给出恰当的回应。"
  ].filter(Boolean).join("\n");

  const userPrompt = [
    `最近对话：`,
    recentRaw || "（无历史）",
    "",
    `当前用户消息：${message}`
  ].join("\n");

  // ── 决定是否需要更新群聊摘要（每10轮更新一次）──
  const needsSummaryUpdate = history.length > 0 && history.length % 10 === 0;

  return {
    system: systemPrompt.slice(0, 4000),
    user: userPrompt.slice(0, 3000),
    needsSummaryUpdate,
    groupId,
    userMessage: message,
    friends
  };
}

/** 异步更新群聊摘要 */
export async function updateGroupSummaryIfNeeded(
  groupId: string,
  history: ChatHistoryMessage[],
  userConfig?: { apiKey?: string; baseUrl?: string; model?: string; providerName?: string } | null
) {
  if (history.length < 6) return;
  const rawHistory = history.slice(-20).map(h =>
    `${h.role === "user" ? "用户" : h.speaker || "AI"}: ${h.content}`
  ).join("\n");
  const oldSummary = getGroupSummary(groupId);

  try {
    const result = await callFriendModelJson({
      messages: [
        {
          role: "system",
          content: [
            "你是群聊摘要器。基于最近的对话历史" + (oldSummary ? "和已有的摘要" : "") + "，写出一个更新的群聊摘要（≤300 中文字符）。",
            "包含：群聊目的、最近主要话题、关键进展、未解决的问题。",
            "用自然流畅的中文叙述。" + (oldSummary ? `\n已有摘要：${oldSummary}` : "")
          ].join("\n")
        },
        { role: "user", content: rawHistory.slice(0, 4000) }
      ],
      temperature: 0.3,
      maxTokens: 400,
      userConfig,
      jsonMode: false
    });
    if (result.ok && result.content.trim()) {
      setGroupSummary(groupId, result.content.trim());
    }
  } catch {}
}

/** 保存对话到可检索历史 */
export function saveToHistory(groupId: string, role: string, content: string, speaker?: string) {
  saveToSearchableHistory({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    groupId,
    content: content.slice(0, 400),
    speaker: speaker || (role === "user" ? "用户" : "系统")
  });
}

/** 为每个朋友自动更新记忆 */
export function autoUpdateFriendMemories(friends: AIFriend[], context: string) {
  for (const f of friends) {
    autoMemorizeFromChat(f.id, context);
  }
}
