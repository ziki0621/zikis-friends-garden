import { buildFriendSkillCards, buildSkillActivationHints } from "@/lib/ai/friendSkills";
import {
  type FriendRelation,
  buildFriendRelationPrompt,
  normalizeFriendRelations
} from "@/lib/ai/friendRelations";

export type FriendId = "nana" | "kai" | "lin" | "momo" | "yan";

export type ChatMode = "normal" | "comfort" | "wake" | "analysis" | "debate" | "plan" | "review";

export type AIFriend = {
  id: FriendId | string;
  name: string;
  title: string;
  relationship: string;
  personality: string;
  style: string;
  job: string;
  careFocus: string;
  quirks: string;
  boundaries: string;
  color: string;
  avatar?: string;
};

export type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
  speaker?: string;
};

export type FriendReply = {
  friendId: string;
  name: string;
  tone: "support" | "tease" | "analysis" | "challenge" | "action" | "summary";
  content: string;
  replyTo?: string;
};

export type FriendGroupResponse = {
  messages: FriendReply[];
  summary: {
    mainPoints: string[];
    disagreement: string;
    safestAdvice: string;
    nextAction: string;
    missingInfo: string;
  };
  memoryCandidates: string[];
};

export type MemoryContext = {
  compactSummary: string;
  userMemory: string[];
  friendMemories: Record<string, string[]>;
  pinnedFacts: string[];
};

export type ReplyPlan = {
  min: number;
  max: number;
  label: string;
};

export type InteractionType = "user" | "ambient";

export const defaultFriends: AIFriend[] = [
  {
    id: "nana",
    name: "娜娜",
    title: "温柔但不溺爱的姐姐型朋友",
    relationship: "像认识很久的姐姐，会记得用户的小情绪，也会提醒用户别把自己放太低。",
    personality: "细腻、慢热、观察力强，不急着给答案，先确认用户有没有被理解。",
    style: "语气软，短句多，会说“先别急”“我听懂了”。偶尔轻轻打断过度自责。",
    job: "接住情绪、翻译用户没说出口的委屈、把话题从自责拉回照顾自己。",
    careFocus: "睡眠、饮食、情绪负荷、关系里的委屈和没有被看见的努力。",
    quirks: "喜欢把复杂情绪比作天气；会在群里给尖锐观点垫一层软垫。",
    boundaries: "不把用户哄成永远需要她；遇到危险情绪会温柔但明确地建议找现实支持。",
    color: "#F97373"
  },
  {
    id: "kai",
    name: "凯凯",
    title: "嘴欠但护短的损友",
    relationship: "像一起熬过项目和烂事的老同学，嘴上嫌弃，实际很护短。",
    personality: "反应快、爱拆台、讨厌假正经，最怕群聊变成心理咨询室排队叫号。",
    style: "口语、短促、有梗，会吐槽但不羞辱。常用“不是吧”“你这也太会为难自己了”。",
    job: "打破沉闷、戳穿过度脑补、把用户从自我审判里拎出来。",
    careFocus: "用户是不是又在替别人找借口、是不是把小事脑补成灾难。",
    quirks: "会接别人话里的漏洞；偶尔装作不在乎，其实第一个提醒用户吃饭睡觉。",
    boundaries: "毒舌只针对事情和思路，不攻击人格、外貌、能力底色。",
    color: "#F59E0B"
  },
  {
    id: "lin",
    name: "林博士",
    title: "冷静拆题的研究型朋友",
    relationship: "像群里那个会认真看完长消息的人，平时安静，一开口就能把线头理出来。",
    personality: "克制、好奇、证据感强，不喜欢空泛鸡汤，也不急着站队。",
    style: "清楚、克制、带一点学术感，但必须说人话。常把问题拆成变量、风险、验证。",
    job: "拆问题、识别假设、列选择标准、帮大家把吵散的观点收成可判断的结构。",
    careFocus: "事实和解释有没有混在一起，短期情绪和长期目标有没有打架。",
    quirks: "会说“先定义一下问题”；被凯凯吐槽太严肃时会认真解释半句。",
    boundaries: "不装权威，不替用户做最终决定；高风险领域提醒咨询专业人士。",
    color: "#2F80ED"
  },
  {
    id: "momo",
    name: "末末",
    title: "靠谱行动派搭子",
    relationship: "像会陪用户开文档、列清单、互相报进度的同伴，不讲大道理。",
    personality: "利落、现实、执行力强，对拖延很敏感，但不会用羞耻感催人。",
    style: "直接、短句、动词多。喜欢说“先做十分钟”“下一步是什么”。",
    job: "把讨论落到下一步、压缩任务、设计低门槛行动，让用户开始动起来。",
    careFocus: "任务是否太大、步骤是否清楚、今天能不能完成一个小动作。",
    quirks: "会把任何宏大问题改写成待办；看到大家聊散了会把话题拉回行动。",
    boundaries: "不把人当机器催；用户明显疲惫时会先降负荷而不是加码。",
    color: "#10B981"
  },
  {
    id: "yan",
    name: "阿言",
    title: "清醒现实派反对席",
    relationship: "像那个不一定顺着你、但会帮你挡坑的朋友，话少但靠谱。",
    personality: "谨慎、清醒、有边界感，不爱热闹，但会在关键处提醒风险。",
    style: "冷一点、准一点，不煽情。会说“等一下”“这个前提不稳”。",
    job: "提出反例、看坏情况、提醒代价和边界，防止群聊只剩鼓励。",
    careFocus: "不可逆成本、关系权力差、钱和时间的风险、用户是否被情绪推着走。",
    quirks: "常在大家兴奋时踩刹车；如果观点被采纳，会很淡地说“那就行”。",
    boundaries: "挑刺不是泼冷水；不能制造恐惧，也不能替用户否定所有可能性。",
    color: "#8B5CF6"
  }
];

const defaultFriendById = new Map<string, AIFriend>(defaultFriends.map((friend) => [friend.id, friend]));

export const modeLabels: Record<ChatMode, string> = {
  normal: "普通聊天",
  comfort: "安慰我",
  wake: "骂醒我",
  analysis: "帮我分析",
  debate: "让他们辩论",
  plan: "制定计划",
  review: "复盘今天"
};

export function normalizeMode(value: unknown): ChatMode {
  const modes = Object.keys(modeLabels) as ChatMode[];
  return modes.includes(value as ChatMode) ? (value as ChatMode) : "normal";
}

export function normalizeFriends(value: unknown): AIFriend[] {
  if (!Array.isArray(value)) {
    return defaultFriends;
  }

  const safeFriends = value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const friend = item as Partial<AIFriend>;
      if (typeof friend.id !== "string" || typeof friend.name !== "string") {
        return null;
      }
      const fallbackFriend = getDefaultFriendTemplate(friend.id);
      const normalizedFriend: AIFriend = {
        id: friend.id.slice(0, 40),
        name: friend.name.slice(0, 24),
        title: cleanFriendText(friend.title, fallbackFriend.title, 40),
        relationship: cleanFriendText(friend.relationship, fallbackFriend.relationship, 220),
        personality: cleanFriendText(friend.personality, fallbackFriend.personality, 220),
        style: cleanFriendText(friend.style, fallbackFriend.style, 220),
        job: cleanFriendText(friend.job, fallbackFriend.job, 220),
        careFocus: cleanFriendText(friend.careFocus, fallbackFriend.careFocus, 220),
        quirks: cleanFriendText(friend.quirks, fallbackFriend.quirks, 220),
        boundaries: cleanFriendText(friend.boundaries, fallbackFriend.boundaries, 220),
        color: typeof friend.color === "string" ? friend.color.slice(0, 20) : "#2A2A2A"
      };
      if (typeof friend.avatar === "string") {
        normalizedFriend.avatar = friend.avatar.slice(0, 500000);
      }
      return normalizedFriend;
    })
    .filter((friend): friend is AIFriend => Boolean(friend))
    .slice(0, 6);

  return safeFriends.length >= 1 ? safeFriends : defaultFriends;
}

export function normalizeHistory(value: unknown): ChatHistoryMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item): ChatHistoryMessage | null => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const message = item as Partial<ChatHistoryMessage>;
      if (message.role !== "user" && message.role !== "assistant") {
        return null;
      }
      if (typeof message.content !== "string" || message.content.trim().length === 0) {
        return null;
      }
      const normalized: ChatHistoryMessage = {
        role: message.role,
        content: message.content.slice(0, 1200)
      };
      if (typeof message.speaker === "string") {
        normalized.speaker = message.speaker.slice(0, 24);
      }
      return normalized;
    })
    .filter((message): message is ChatHistoryMessage => message !== null)
    .slice(-16);
}

export function normalizeMemoryContext(value: unknown): MemoryContext {
  if (!value || typeof value !== "object") {
    return createEmptyMemoryContext();
  }

  const raw = value as Partial<MemoryContext>;
  const friendMemories: Record<string, string[]> = {};

  if (raw.friendMemories && typeof raw.friendMemories === "object" && !Array.isArray(raw.friendMemories)) {
    Object.entries(raw.friendMemories)
      .slice(0, 12)
      .forEach(([friendId, memories]) => {
        if (!Array.isArray(memories)) {
          return;
        }
        const safeMemories = cleanMemoryList(memories, 8, 180);
        if (safeMemories.length > 0) {
          friendMemories[friendId.slice(0, 40)] = safeMemories;
        }
      });
  }

  return {
    compactSummary: typeof raw.compactSummary === "string" ? raw.compactSummary.trim().slice(0, 1600) : "",
    userMemory: cleanMemoryList(raw.userMemory, 18, 180),
    friendMemories,
    pinnedFacts: cleanMemoryList(raw.pinnedFacts, 12, 180)
  };
}

export function buildFriendGroupPrompt({
  friends,
  groupStyle,
  mode,
  userState,
  replyPlan,
  memoryContext,
  relations
}: {
  friends: AIFriend[];
  groupStyle: string;
  mode: ChatMode;
  userState: string;
  replyPlan?: ReplyPlan;
  memoryContext?: MemoryContext;
  relations?: FriendRelation[];
}) {
  const friendList = friends
    .map(
      (friend) => `- ${friend.name} (${friend.title})
  关系定位: ${friend.relationship}
  性格底色: ${friend.personality}
  群内分工: ${friend.job}
  说话方式: ${friend.style}
  关心重点: ${friend.careFocus}
  小习惯: ${friend.quirks}
  边界: ${friend.boundaries}`
    )
    .join("\n");
  const skillCards = buildFriendSkillCards(friends);

  const isDirectChat = friends.length === 1;
  const memoryBlock = formatMemoryContext(memoryContext, friends);
  const relationBlock = buildFriendRelationPrompt(normalizeFriendRelations(relations), friends);

  return `你是一个“AI 朋友聊天”调度器。${isDirectChat ? "当前是用户和一位 AI 朋友的私聊，请只让这个朋友自然回应。" : "请让多个 AI 朋友像真实微信群一样围绕用户消息讨论，不要像客服逐条答题。"}

群聊风格: ${groupStyle || "温柔但有活人感"}
当前模式: ${modeLabels[mode]}
用户近期状态: ${userState || "未知"}
${memoryBlock}

朋友列表:
${friendList}

朋友角色 skills:
${skillCards}
${relationBlock ? `\n${relationBlock}\n` : ""}

硬性要求:
1. messages 必须按真实聊天时间顺序排列。${isDirectChat ? "私聊时只能由这位朋友发言，像真实私聊一样一次发 1-3 条，不要自问自答。" : "群聊时后面的朋友要能“看见”前面朋友说了什么。"}
2. 只能使用朋友列表里的 friendId 和 name，绝对不要创造新朋友、新昵称或旁白角色。
3. 本轮建议输出 ${replyPlan ? `${replyPlan.min}-${replyPlan.max} 条 messages，原因: ${replyPlan.label}` : "1-8 条 messages"}。短寒暄、确认、轻松吐槽只需要 1-3 条；复杂选择、规划、辩论、情绪较重时才需要 5-8 条。
4. ${isDirectChat ? "私聊时不要出现其他朋友，也不要说“大家觉得”。" : "参与人数要跟消息复杂度匹配：1-2 条时只需要 1-2 位朋友；3-5 条时 2-3 位朋友；6 条以上才让 3 位以上朋友参与。同一位朋友可以隔几条再回来补一句，但不要机械轮流点名。"}
5. 每条 content 写成真实聊天短消息，通常 8-45 个中文字符，最多 2 句。不要长段落，不要演讲。
6. 朋友是否发言必须优先看角色 skill 的出场条件和沉默条件；没有被触发的人可以不说话。不要为了凑人数让所有人都露面。
7. 每位朋友发言要使用自己的 skill：注意雷达决定看见什么，回应招式决定怎么说，群友化学反应决定接谁的话，禁区决定绝对不要怎么说。
8. 如果 messages 超过 3 条，从第 3 条开始至少一半发言要接住前面朋友的话，设置 replyTo，并在 content 中自然接梗、反驳、补充、打圆场或追问。
9. 如果 messages 超过 4 条，至少 2 条不要直接回答用户，而是朋友之间互相聊起来；如果本轮只有 1-3 条，不要强行互相表演。
10. 不要让所有角色重复同一个观点；每个人必须有独立作用。
11. 最后不要用“总结一下”收束，也不要像会议纪要。可以留一个自然的开放话口，让用户或朋友能继续接。
12. 语言要像朋友群聊，可以有轻微吐槽、停顿、口语词，但不要羞辱、威胁、PUA 或制造依赖。
13. 高风险内容如自伤、暴力、违法、严重心理危机、医疗法律金融决策，必须先安全支持并建议寻求现实专业帮助。
14. 可以使用长期记忆，但只在当前话题自然相关时轻轻带到，不要每次都说“我记得”，也不要把记忆当作审判用户的证据。当前消息与旧记忆冲突时，以当前消息为准。
15. memoryCandidates 只记录稳定偏好、长期目标、重要关系、持续困扰、明确雷区或用户主动要求记住的事；不要记录一次性情绪、隐私细节或模型自己的猜测。每轮 0-3 条，短句即可。
16. 输出必须是合法 JSON，不要 Markdown，不要代码块，不要额外解释。

JSON 结构:
{
  "messages": [
    {
      "friendId": "朋友 id",
      "name": "朋友名",
      "tone": "support|tease|analysis|challenge|action|summary",
      "content": "这位朋友的一条短群聊消息",
      "replyTo": "可选，正在回应的朋友名"
    }
  ],
  "summary": {
    "mainPoints": ["观点一", "观点二"],
    "disagreement": "当前分歧",
    "safestAdvice": "最稳妥建议",
    "nextAction": "下一步行动",
    "missingInfo": "还需要补充的信息"
  },
  "memoryCandidates": ["可选，值得写入长期记忆的用户状态或目标"]
}`;
}

export function estimateReplyPlan(message: string, mode: ChatMode): ReplyPlan {
  const normalized = message.trim();
  const compact = normalized.replace(/\s+/g, "");
  const complexPattern = /怎么办|怎么选|要不要|选择|纠结|分析|计划|规划|方案|建议|复盘|为什么|关系|工作|职业|面试|项目|论文|焦虑|崩溃|难受|分手|家里|钱|风险|利弊|长期|未来/;
  const simplePattern = /^(在吗|有人吗|哈喽|hello|hi|嗨|嗯|嗯嗯|好|行|可以|谢谢|笑死|哈哈|哈哈哈|？|\?|。|\.|ok|OK)$/;

  if (simplePattern.test(compact) || compact.length <= 6) {
    return {
      min: 1,
      max: 2,
      label: "很短的寒暄或确认，只要像朋友随手接一句"
    };
  }

  if (compact.length <= 22 && !complexPattern.test(compact)) {
    return {
      min: 2,
      max: 3,
      label: "轻量日常消息，少数朋友自然接话即可"
    };
  }

  if (complexPattern.test(compact) || compact.length >= 80 || mode === "debate" || mode === "plan") {
    return {
      min: 5,
      max: mode === "debate" ? 8 : 7,
      label: "问题较复杂，需要多人从不同角度讨论"
    };
  }

  if (mode === "analysis" || mode === "review" || mode === "comfort") {
    return {
      min: 3,
      max: 5,
      label: "需要一些陪伴或拆解，但不用全员开会"
    };
  }

  return {
    min: 2,
    max: 5,
    label: "普通聊天，回复数量要错落自然"
  };
}

export function buildUserPrompt({
  message,
  history,
  memoryContext,
  friends,
  mode,
  interactionType = "user"
}: {
  message: string;
  history: ChatHistoryMessage[];
  memoryContext?: MemoryContext;
  friends: AIFriend[];
  mode: ChatMode;
  interactionType?: InteractionType;
}) {
  const recent = history
    .slice(-8)
    .map((item) => `${item.role === "user" ? "用户" : item.speaker || "AI 朋友"}: ${item.content}`)
    .join("\n");
  const compactSummary = memoryContext?.compactSummary?.trim();
  const skillActivationHints = buildSkillActivationHints({
    message,
    friends,
    mode
  });
  const messageBlock =
    interactionType === "ambient"
      ? `群友续聊触发:
这不是用户新发来的消息，而是群友看到最近聊天后自然接话的模拟触发。
请只基于最近原文上下文和最后几条群友消息，生成 1-3 条自然续聊。
可以接梗、补刀、打圆场、追问或把话题轻轻收住；不要重新回答用户最初的问题，不要像总结，不要强行让所有人发言。

续聊触发说明:
${message}`
      : `用户刚刚发来的消息:
${message}`;

  return `压缩上下文摘要:
${compactSummary || "暂无"}

最近原文上下文:
${recent || "暂无"}

${skillActivationHints}

${messageBlock}`;
}

function createEmptyMemoryContext(): MemoryContext {
  return {
    compactSummary: "",
    userMemory: [],
    friendMemories: {},
    pinnedFacts: []
  };
}

function cleanMemoryList(value: unknown, maxItems: number, maxLength: number) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().replace(/\s+/g, " ").slice(0, maxLength))
        .filter(Boolean)
    )
  ).slice(0, maxItems);
}

function formatMemoryContext(memoryContext: MemoryContext | undefined, friends: AIFriend[]) {
  const memory = normalizeMemoryContext(memoryContext);
  const friendNameById = new Map(friends.map((friend) => [friend.id, friend.name]));
  const lines: string[] = [];

  if (memory.compactSummary) {
    lines.push(`群聊压缩摘要:\n${memory.compactSummary}`);
  }

  if (memory.userMemory.length > 0) {
    lines.push(`用户长期记忆:\n${memory.userMemory.map((item) => `- ${item}`).join("\n")}`);
  }

  const friendMemoryLines = Object.entries(memory.friendMemories)
    .filter(([, memories]) => memories.length > 0)
    .map(([friendId, memories]) => {
      return `- ${friendNameById.get(friendId) ?? friendId}: ${memories.slice(0, 4).join("；")}`;
    });

  if (friendMemoryLines.length > 0) {
    lines.push(`朋友近期记忆:\n${friendMemoryLines.join("\n")}`);
  }

  if (memory.pinnedFacts.length > 0) {
    lines.push(`置顶事实:\n${memory.pinnedFacts.map((item) => `- ${item}`).join("\n")}`);
  }

  return lines.length > 0 ? `\n长期记忆:\n${lines.join("\n\n")}` : "";
}

export function coerceFriendGroupResponse(value: unknown, friends: AIFriend[]): FriendGroupResponse | null {
  const raw: Partial<FriendGroupResponse> = Array.isArray(value) ? { messages: value as FriendReply[] } : (value as Partial<FriendGroupResponse>);
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.messages)) {
    return null;
  }

  const knownFriends = new Map(friends.map((friend) => [friend.id, friend]));
  const messages = raw.messages
    .map((message): FriendReply | null => {
      if (!message || typeof message !== "object") {
        return null;
      }
      const item = message as Partial<FriendReply>;
      if (typeof item.content !== "string" || item.content.trim().length === 0) {
        return null;
      }
      const fallbackFriend = friends.find((friend) => friend.name === item.name) ?? friends[0];
      const friend = typeof item.friendId === "string" ? knownFriends.get(item.friendId) ?? fallbackFriend : fallbackFriend;
      const normalized: FriendReply = {
        friendId: friend.id,
        name: friend.name,
        tone: normalizeTone(item.tone),
        content: item.content.slice(0, 260)
      };
      const replyToFriend = friends.find((candidate) => candidate.name === item.replyTo);
      if (replyToFriend) {
        normalized.replyTo = replyToFriend.name;
      }
      return normalized;
    })
    .filter((message): message is FriendReply => message !== null)
    .slice(0, 12);

  if (messages.length === 0) {
    return null;
  }

  const summary = raw.summary && typeof raw.summary === "object" ? (raw.summary as Partial<FriendGroupResponse["summary"]>) : {};

  return {
    messages,
    summary: {
      mainPoints: Array.isArray(summary.mainPoints)
        ? summary.mainPoints.filter((item): item is string => typeof item === "string").slice(0, 4)
        : [],
      disagreement: typeof summary.disagreement === "string" ? summary.disagreement.slice(0, 240) : "暂时没有明显分歧。",
      safestAdvice: typeof summary.safestAdvice === "string" ? summary.safestAdvice.slice(0, 240) : "先把问题拆小，再做下一步。",
      nextAction: typeof summary.nextAction === "string" ? summary.nextAction.slice(0, 240) : "补充一个更具体的目标或限制条件。",
      missingInfo: typeof summary.missingInfo === "string" ? summary.missingInfo.slice(0, 240) : "还缺少时间、预算、优先级等信息。"
    },
    memoryCandidates: Array.isArray(raw.memoryCandidates)
      ? raw.memoryCandidates.filter((item): item is string => typeof item === "string").slice(0, 4)
      : []
  };
}

export function parseJsonFromModel(content: string) {
  try {
    return JSON.parse(content) as unknown;
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      return null;
    }
    try {
      return JSON.parse(match[0]) as unknown;
    } catch {
      return null;
    }
  }
}

export function mockFriendGroupResponse(message: string, mode: ChatMode, friends: AIFriend[], replyPlan = estimateReplyPlan(message, mode)): FriendGroupResponse {
  const soft = pickFriend(friends, 0);
  const sharp = pickFriend(friends, 1);
  const analyst = pickFriend(friends, 2);
  const action = pickFriend(friends, 3);
  const skeptic = pickFriend(friends, 4);
  const shortMessage = message.length > 34 ? `${message.slice(0, 34)}...` : message;
  const isPlan = mode === "plan" || mode === "wake";

  if (replyPlan.max <= 2) {
    const messages: FriendReply[] = [
      {
        friendId: soft.id,
        name: soft.name,
        tone: "support",
        content: "在呢。你说，我们听着。"
      },
      {
        friendId: sharp.id,
        name: sharp.name,
        tone: "tease",
        content: "突然冒泡，感觉有事。",
        replyTo: soft.name
      }
    ];

    return {
      messages: messages.slice(0, replyPlan.max),
      summary: {
        mainPoints: ["用户发来轻量消息，适合少量自然回应"],
        disagreement: "暂无分歧。",
        safestAdvice: "先自然接住，不要过度展开。",
        nextAction: "等用户继续说具体内容。",
        missingInfo: "用户还没有说明具体话题。"
      },
      memoryCandidates: []
    };
  }

  const messages: FriendReply[] = [
    {
      friendId: soft.id,
      name: soft.name,
      tone: "support",
      content: `我先接一下，“${shortMessage}”听着已经压了蛮久。`
    },
    {
      friendId: sharp.id,
      name: sharp.name,
      tone: "tease",
      content: isPlan ? `我插一句，别再靠“我再想想”续命了。` : `我补刀：不是你不行，是这事被揉太大了。`,
      replyTo: soft.name
    },
    {
      friendId: analyst.id,
      name: analyst.name,
      tone: "analysis",
      content: "先别求最终答案，先分清事实、情绪、下一步。"
    },
    {
      friendId: skeptic.id,
      name: skeptic.name,
      tone: "challenge",
      content: "对，而且要看不可逆成本。能试错和不能试错差很多。",
      replyTo: analyst.name
    },
    {
      friendId: action.id,
      name: action.name,
      tone: "action",
      content: "行动版：写 3 个选项，每个只写一个最小验证。"
    },
    {
      friendId: sharp.id,
      name: sharp.name,
      tone: "tease",
      content: "末末这个说法能活，别一上来就搞人生大工程。",
      replyTo: action.name
    },
    {
      friendId: soft.id,
      name: soft.name,
      tone: "support",
      content: "嗯，先做小一点。你今晚不用把自己审完。 ",
      replyTo: sharp.name
    }
  ];

  return {
    messages: messages.slice(0, replyPlan.max),
    summary: {
      mainPoints: ["先接住情绪，不急着自责", "把问题拆成目标、风险和验证动作", "优先做低成本、可回退的小实验"],
      disagreement: "凯凯想立刻推进，阿言提醒要看不可逆成本。",
      safestAdvice: "先做一个 24 小时内可完成的小验证，不要直接押上长期承诺。",
      nextAction: "把你的选项发来，或者先写下每个选项的好处、代价、今天能验证的一步。",
      missingInfo: "还需要知道你的时间限制、最怕的后果、以及这件事是否涉及不可逆成本。"
    },
    memoryCandidates: ["用户正在处理一个需要拆解和低成本验证的问题。"]
  };
}

export function mockProactiveResponse(eventType: string, friends: AIFriend[]): FriendGroupResponse {
  const friend = eventType === "weather" ? pickFriend(friends, 1) : pickFriend(friends, 3);
  const helper = eventType === "weather" ? pickFriend(friends, 0) : pickFriend(friends, 2);

  return {
    messages: [
      {
        friendId: friend.id,
        name: friend.name,
        tone: eventType === "weather" ? "tease" : "action",
        content:
          eventType === "weather"
            ? "外面像是要下雨。友情提醒：带伞，不要表演“我能躲过每一滴雨”的玄学项目。"
            : "到点了。你今天那个小目标还没更新，先别装没看见，给它 10 分钟也算赢。"
      },
      {
        friendId: helper.id,
        name: helper.name,
        tone: eventType === "weather" ? "support" : "analysis",
        content:
          eventType === "weather"
            ? "顺便照顾一下自己，天气变化的时候人也容易没精神。今天可以把任务切小一点。"
            : "如果卡住了，就只回一句：现在卡在哪。我们先定位，不急着把整天都审判掉。",
        replyTo: friend.name
      }
    ],
    summary: {
      mainPoints: ["主动消息应像朋友提醒，不像系统通知"],
      disagreement: "暂无分歧。",
      safestAdvice: "只做轻提醒，不制造压力。",
      nextAction: eventType === "weather" ? "出门前检查雨具和衣物。" : "给当前目标更新一个最小进度。",
      missingInfo: "可以接入真实天气、时间和目标状态。"
    },
    memoryCandidates: []
  };
}

function normalizeTone(value: unknown): FriendReply["tone"] {
  if (
    value === "support" ||
    value === "tease" ||
    value === "analysis" ||
    value === "challenge" ||
    value === "action" ||
    value === "summary"
  ) {
    return value;
  }

  return "support";
}

function pickFriend(friends: AIFriend[], index: number) {
  const safeFriends = friends.length > 0 ? friends : defaultFriends;
  return safeFriends[index % safeFriends.length];
}

export function getDefaultFriendTemplate(friendId: string) {
  return defaultFriendById.get(friendId) ?? defaultFriends[0];
}

function cleanFriendText(value: unknown, fallback: string, maxLength: number) {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : fallback;
}
