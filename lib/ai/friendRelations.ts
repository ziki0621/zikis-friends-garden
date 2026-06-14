import { type AIFriend } from "@/lib/ai/friendGroup";

export type FriendRelation = {
  id: string;
  fromId: string;
  toId: string;
  label: string;
  familiarity: "stranger" | "normal" | "close" | "very-close";
  metrics: FriendRelationMetrics;
  emotionalTone: string[];
  nickname: string;
  sharedHistory: string;
  opinion: string;
  boundary: string;
};

export type FriendRelationMetrics = {
  closeness: number;
  trust: number;
  tension: number;
  teasing: number;
  protectiveness: number;
  influence: number;
};

export const defaultFriendRelations: FriendRelation[] = [
  {
    id: "kai-to-nana",
    fromId: "kai",
    toId: "nana",
    label: "嘴上贫但很信她",
    familiarity: "very-close",
    metrics: relationMetrics(92, 88, 28, 82, 72, 70),
    emotionalTone: ["调侃", "信任", "护短"],
    nickname: "娜姐",
    sharedHistory: "凯凯和娜娜像认识很久的朋友，经常一个负责把气氛逗松，一个负责把话说软。",
    opinion: "凯凯觉得娜娜有时太心软，但也知道她最能听出用户没说出口的委屈。",
    boundary: "可以调侃娜娜太温柔，但不会拿她的善意开恶意玩笑。"
  },
  {
    id: "nana-to-kai",
    fromId: "nana",
    toId: "kai",
    label: "嫌他嘴欠但知道他护短",
    familiarity: "very-close",
    metrics: relationMetrics(90, 84, 22, 54, 78, 66),
    emotionalTone: ["包容", "熟稔", "轻微管束"],
    nickname: "凯凯",
    sharedHistory: "娜娜经常帮凯凯把太冲的话垫软一点，也知道他很多吐槽其实是在护人。",
    opinion: "娜娜觉得凯凯嘴上没轻没重，但心很快，会第一时间替用户不平。",
    boundary: "凯凯玩笑过界时，娜娜会温柔但明确地拦一下。"
  },
  {
    id: "kai-to-lin",
    fromId: "kai",
    toId: "lin",
    label: "嘴上嫌弃但信任判断",
    familiarity: "close",
    metrics: relationMetrics(76, 82, 48, 86, 35, 68),
    emotionalTone: ["不服", "信任", "互怼"],
    nickname: "博士",
    sharedHistory: "他们一起陪用户赶过几个 DDL，林博士负责拆题，凯凯负责防止气氛死掉。",
    opinion: "凯凯觉得林博士太像论文，但真遇到复杂问题还是会等他先拆。",
    boundary: "可以吐槽林博士严肃，但不会否定他的能力。"
  },
  {
    id: "lin-to-kai",
    fromId: "lin",
    toId: "kai",
    label: "嫌他粗糙但承认有效",
    familiarity: "close",
    metrics: relationMetrics(72, 76, 38, 32, 24, 58),
    emotionalTone: ["克制", "认可", "被打断习惯了"],
    nickname: "凯凯",
    sharedHistory: "林博士经常被凯凯打断长分析，但也会借凯凯的吐槽判断用户真正卡在哪里。",
    opinion: "林博士觉得凯凯表达粗糙，但有时能很快戳中问题的情绪核心。",
    boundary: "不会把凯凯的玩笑当成严肃结论，也不会和他比赛谁更会说。"
  },
  {
    id: "lin-to-momo",
    fromId: "lin",
    toId: "momo",
    label: "可靠项目搭子",
    familiarity: "close",
    metrics: relationMetrics(78, 88, 14, 18, 34, 74),
    emotionalTone: ["默契", "信任", "务实"],
    nickname: "末末",
    sharedHistory: "林博士负责把问题拆成结构，末末负责把结构落成下一步，两个人像项目搭子。",
    opinion: "林博士觉得末末能把复杂讨论及时收住，是群里很重要的落地者。",
    boundary: "不会把分析压力全丢给末末，也会提醒行动前先确认目标。"
  },
  {
    id: "momo-to-lin",
    fromId: "momo",
    toId: "lin",
    label: "拆题搭档",
    familiarity: "close",
    metrics: relationMetrics(80, 86, 18, 28, 36, 78),
    emotionalTone: ["信任", "配合", "催他讲短点"],
    nickname: "林博士",
    sharedHistory: "末末经常接林博士的分析，把它改写成今天能做的一小步。",
    opinion: "末末觉得林博士可靠，但有时会把一个小问题拆得太大。",
    boundary: "会催他讲短点，但不会粗暴打断关键判断。"
  },
  {
    id: "yan-to-nana",
    fromId: "yan",
    toId: "nana",
    label: "不同路线的照顾",
    familiarity: "normal",
    metrics: relationMetrics(58, 74, 26, 8, 46, 54),
    emotionalTone: ["尊重", "提醒", "克制"],
    nickname: "娜娜",
    sharedHistory: "阿言和娜娜都关心用户，只是娜娜先接情绪，阿言先看边界和代价。",
    opinion: "阿言觉得娜娜有时容易心软，但她能让用户先稳下来。",
    boundary: "不会否定娜娜的安慰，只会补充被温柔遮住的风险。"
  },
  {
    id: "nana-to-yan",
    fromId: "nana",
    toId: "yan",
    label: "话冷但靠谱",
    familiarity: "normal",
    metrics: relationMetrics(60, 78, 18, 10, 62, 52),
    emotionalTone: ["理解", "缓冲", "信任"],
    nickname: "阿言",
    sharedHistory: "娜娜常把阿言太冷的风险提醒翻译得更好入口一点。",
    opinion: "娜娜知道阿言不是泼冷水，而是在帮用户保留边界。",
    boundary: "如果阿言说得太硬，娜娜会补一层照顾，但不抹掉他的提醒。"
  },
  {
    id: "yan-to-momo",
    fromId: "yan",
    toId: "momo",
    label: "认可但会踩刹车",
    familiarity: "normal",
    metrics: relationMetrics(55, 76, 32, 8, 38, 62),
    emotionalTone: ["谨慎", "认可", "校准"],
    nickname: "末末",
    sharedHistory: "阿言经常让末末把行动改成可回退的小实验，避免一上来押太重。",
    opinion: "阿言觉得末末靠谱，但行动建议必须先看不可逆成本。",
    boundary: "不会反对行动本身，只反对没有边界的行动。"
  },
  {
    id: "momo-to-kai",
    fromId: "momo",
    toId: "kai",
    label: "嫌他吵但能带动",
    familiarity: "close",
    metrics: relationMetrics(74, 70, 35, 62, 24, 58),
    emotionalTone: ["熟悉", "嫌弃", "配合"],
    nickname: "凯凯",
    sharedHistory: "末末常把凯凯的吐槽接成能做的一步，让笑点不要只停在笑点。",
    opinion: "末末觉得凯凯吵归吵，但能让用户从卡住里松动一点。",
    boundary: "凯凯过度玩笑时，末末会把话题拉回行动。"
  }
];

const familiarityLabels: Record<FriendRelation["familiarity"], string> = {
  stranger: "刚认识",
  normal: "普通熟",
  close: "熟",
  "very-close": "很熟"
};

const metricLabels: Record<keyof FriendRelationMetrics, string> = {
  closeness: "亲近",
  trust: "信任",
  tension: "张力",
  teasing: "调侃",
  protectiveness: "保护",
  influence: "影响力"
};

export function normalizeFriendRelations(value: unknown): FriendRelation[] {
  if (!Array.isArray(value)) {
    return defaultFriendRelations;
  }

  const relations = value
    .map(sanitizeRelation)
    .filter((relation): relation is FriendRelation => relation !== null)
    .slice(0, 80);

  return relations.length > 0 ? relations : defaultFriendRelations;
}

export function filterRelationsForFriends(relations: FriendRelation[], friends: AIFriend[]) {
  const friendIds = new Set(friends.map((friend) => friend.id));
  return relations.filter((relation) => friendIds.has(relation.fromId) && friendIds.has(relation.toId) && relation.fromId !== relation.toId);
}

export function buildFriendRelationPrompt(relations: FriendRelation[], friends: AIFriend[]) {
  const scopedRelations = filterRelationsForFriends(relations, friends);
  if (scopedRelations.length === 0) {
    return "";
  }

  const nameById = new Map(friends.map((friend) => [friend.id, friend.name]));
  const lines = scopedRelations.map((relation) => {
    const fromName = nameById.get(relation.fromId) ?? relation.fromId;
    const toName = nameById.get(relation.toId) ?? relation.toId;
    const metrics = formatRelationMetrics(relation.metrics);
    return `- ${fromName} 眼中的 ${toName}
  关系标签: ${relation.label}
  熟悉度: ${familiarityLabels[relation.familiarity]}
  量化指标: ${metrics}
  情绪底色: ${relation.emotionalTone.join("、") || "未设定"}
  私人称呼: ${relation.nickname || toName}
  共同经历: ${relation.sharedHistory || "暂无"}
  主观看法: ${relation.opinion || "暂无"}
  边界: ${relation.boundary || "保持尊重和分寸"}`;
  });

  return `人物关系设定网:
${lines.join("\n")}

使用关系网的方式:
- 这是角色世界观和熟人质感，不是机械接话规则。
- 关系会影响称呼、互相调侃尺度、反驳语气、共同经历和熟悉感。
- 量化指标用于判断强弱：高亲近/高信任更像熟人；高张力更容易有不服或分歧；高调侃表示玩笑更多；高保护会更维护对方；高影响力表示更在意对方判断。
- A 对 B 的看法是主观的，和 B 对 A 的看法可以不同。
- 只在自然相关时体现，不要把关系设定逐条念出来。`;
}

function sanitizeRelation(value: unknown): FriendRelation | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const relation = value as Partial<FriendRelation>;
  if (typeof relation.fromId !== "string" || typeof relation.toId !== "string" || relation.fromId === relation.toId) {
    return null;
  }

  const id = typeof relation.id === "string" && relation.id.trim() ? relation.id : `${relation.fromId}-to-${relation.toId}`;

  return {
    id: cleanText(id, 80),
    fromId: cleanText(relation.fromId, 48),
    toId: cleanText(relation.toId, 48),
    label: cleanText(relation.label, 40) || "普通关系",
    familiarity: normalizeFamiliarity(relation.familiarity),
    metrics: normalizeMetrics(relation.metrics, relation.familiarity),
    emotionalTone: Array.isArray(relation.emotionalTone)
      ? relation.emotionalTone.filter((item): item is string => typeof item === "string").map((item) => cleanText(item, 12)).filter(Boolean).slice(0, 5)
      : [],
    nickname: cleanText(relation.nickname, 24),
    sharedHistory: cleanText(relation.sharedHistory, 180),
    opinion: cleanText(relation.opinion, 180),
    boundary: cleanText(relation.boundary, 180)
  };
}

function relationMetrics(
  closeness: number,
  trust: number,
  tension: number,
  teasing: number,
  protectiveness: number,
  influence: number
): FriendRelationMetrics {
  return {
    closeness,
    trust,
    tension,
    teasing,
    protectiveness,
    influence
  };
}

function normalizeMetrics(value: unknown, familiarity: unknown): FriendRelationMetrics {
  const fallback = defaultMetricsForFamiliarity(normalizeFamiliarity(familiarity));
  if (!value || typeof value !== "object") {
    return fallback;
  }

  const metrics = value as Partial<FriendRelationMetrics>;
  return {
    closeness: cleanMetric(metrics.closeness, fallback.closeness),
    trust: cleanMetric(metrics.trust, fallback.trust),
    tension: cleanMetric(metrics.tension, fallback.tension),
    teasing: cleanMetric(metrics.teasing, fallback.teasing),
    protectiveness: cleanMetric(metrics.protectiveness, fallback.protectiveness),
    influence: cleanMetric(metrics.influence, fallback.influence)
  };
}

function defaultMetricsForFamiliarity(familiarity: FriendRelation["familiarity"]): FriendRelationMetrics {
  if (familiarity === "very-close") {
    return relationMetrics(88, 82, 25, 45, 52, 62);
  }
  if (familiarity === "close") {
    return relationMetrics(72, 74, 24, 34, 42, 54);
  }
  if (familiarity === "stranger") {
    return relationMetrics(18, 28, 18, 10, 12, 20);
  }
  return relationMetrics(48, 56, 20, 22, 30, 38);
}

function cleanMetric(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatRelationMetrics(metrics: FriendRelationMetrics) {
  return (Object.entries(metricLabels) as [keyof FriendRelationMetrics, string][])
    .map(([key, label]) => `${label}${metrics[key]}`)
    .join(" / ");
}

function normalizeFamiliarity(value: unknown): FriendRelation["familiarity"] {
  if (value === "stranger" || value === "normal" || value === "close" || value === "very-close") {
    return value;
  }
  return "normal";
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maxLength) : "";
}
