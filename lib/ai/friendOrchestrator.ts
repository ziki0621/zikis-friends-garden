import { type AIFriend, type ChatHistoryMessage, type FriendGroupResponse, type FriendReply } from "@/lib/ai/friendGroup";
import { buildFriendSkillCards } from "@/lib/ai/friendSkills";
import { callFriendModelJson } from "@/lib/ai/openAICompatible";

/* ─── 类型 ─── */

type OrchestrateInput = {
  message: string;
  history: ChatHistoryMessage[];
  friends: AIFriend[];
  mode: string;
  groupStyle: string;
  userState: string;
  userConfig?: { apiKey?: string; baseUrl?: string; model?: string; providerName?: string } | null;
  interactionType?: "user" | "ambient";
};

type Batch = {
  friendIds: string[];
  focus: string;
  replyTo: string | null;
};

type OrchestrateResult = {
  ok: true;
  batches: Batch[];
  totalExpected: number;
} | {
  ok: false;
  error: string;
};

type SpeakResult = {
  friendId: string;
  name: string;
  spoken: string | null;
  skipped: boolean;
};

/* ─── Orchestrator 主入口 ─── */

export async function runOrchestratedConversation(input: OrchestrateInput): Promise<FriendGroupResponse> {
  const { message, history, friends, mode, groupStyle, userState, userConfig, interactionType } = input;

  // 单人或空群 → 回退到简单模式
  if (friends.length <= 1) {
    return fallbackSingleReply(input);
  }

  // ═══ Phase 1: 导演选角 ═══
  const orchestrate = await callOrchestrator({ message, history, friends, mode, groupStyle, userState, userConfig, interactionType });

  if (!orchestrate.ok) {
    return fallbackSingleReply(input);
  }

  const { batches } = orchestrate;

  // ═══ 上下文：压缩旧对话为 500 字摘要 + 保留最近 8 条 ═══
  const rawHistory = history.map((h) => formatHistoryLine(h));
  const FULL_CONTEXT_LIMIT = 12;
  const KEEP_RAW = 8;
  let compressedContextLines: string[];
  if (rawHistory.length > FULL_CONTEXT_LIMIT) {
    const older = rawHistory.slice(0, -KEEP_RAW);
    const recent = rawHistory.slice(-KEEP_RAW);
    const summary = await compressOlderMessages(older, userConfig);
    compressedContextLines = summary ? [`【对话摘要】${summary}`, "", "--- 最近对话 ---", ...recent] : recent;
  } else {
    compressedContextLines = rawHistory;
  }

  // ═══ Phase 2: 按批次并行发言 ═══
  const allSpoken: SpeakResult[] = [];
  const contextLines: string[] = [...compressedContextLines];

  for (const batch of batches) {
    // 同批次并行
    const results = await Promise.all(
      batch.friendIds.map((friendId) => {
        const friend = friends.find((f) => f.id === friendId);
        if (!friend) return null;
        return speakOne(friend, {
          context: contextLines.join("\n") + `\n用户: ${message}\n`,
          focus: batch.focus,
          replyTo: batch.replyTo ?? undefined,
          mode,
          userConfig
        });
      })
    );

    for (const result of results) {
      if (!result) continue;
      allSpoken.push(result);
      if (result.spoken) {
        contextLines.push(`${result.name}: ${result.spoken}`);
      }
    }
  }

  // ═══ Phase 3: 收尾检查 ═══
  if (allSpoken.filter((s) => !s.skipped).length >= 1) {
    const completion = await callCompletionCheck({
      message,
      spokenLines: contextLines.slice(-12),
      friends,
      mode,
      userConfig
    });

    // 如果有 needMore，给还没说话的人一次机会
    if (completion.needMore && completion.extraFriendId) {
      const extraFriend = friends.find((f) => f.id === completion.extraFriendId);
      if (extraFriend && !allSpoken.some((s) => s.friendId === extraFriend.id)) {
        const extraResult = await speakOne(extraFriend, {
          context: contextLines.join("\n") + "\n",
          focus: completion.extraReason || "补充你的视角",
          replyTo: undefined,
          mode,
          userConfig
        });
        if (extraResult) {
          allSpoken.push(extraResult);
          if (extraResult.spoken) {
            contextLines.push(`${extraResult.name}: ${extraResult.spoken}`);
          }
        }
      }
    }
  }

  // ═══ 组装回复 ═══
  const spokenOnly = allSpoken.filter((s) => s.spoken);
  const messages: FriendReply[] = spokenOnly.map((s, idx) => {
    const friend = friends.find((f) => f.id === s.friendId);
    // 根据朋友性格检测 tone
    let tone: FriendReply["tone"] = "support";
    if (friend) {
      if (friend.id === "kai") tone = "tease";
      else if (friend.id === "momo") tone = "action";
      else if (friend.id === "lin") tone = "analysis";
      else if (friend.id === "yan") tone = "challenge";
      else if (friend.id === "nana") tone = "support";
    }
    // 检测 replyTo —— 找对话里最后提到的人名
    let replyTo: string | undefined;
    if (idx > 0) {
      for (let j = idx - 1; j >= 0; j--) {
        const prev = spokenOnly[j];
        if (prev.spoken && s.spoken) {
          // 简单检测：如果当前消息没提到任何前面的朋友名，默认回应最近一个
          const mentionedFriend = spokenOnly.filter((p, pi) => pi < idx && s.spoken!.includes(p.name));
          if (mentionedFriend.length > 0) {
            replyTo = mentionedFriend[mentionedFriend.length - 1].name;
          } else if (j === 0) {
            replyTo = prev.name;
          }
          break;
        }
      }
    }
    return {
      friendId: s.friendId,
      name: s.name,
      tone,
      content: s.spoken!,
      replyTo
    };
  });

  // ═══ 生成总结 ═══
  const summary = await generateSummary(messages, message, mode, userConfig);

  return {
    messages,
    summary,
    memoryCandidates: []
  };
}

/* ─── Phase 1: Orchestrator ─── */

async function callOrchestrator(input: OrchestrateInput): Promise<OrchestrateResult> {
  const skillCards = buildFriendSkillCards(input.friends);
  const friendList = input.friends.map((f) => `- ${f.id}: ${f.name}（${f.title}，职责：${f.job}，关心：${f.careFocus}）`).join("\n");

  const prompt = `你是一个群聊导演，决定 AI 朋友们怎么接用户的话。
当前群聊风格：${input.groupStyle}
当前模式：${input.mode}
用户状态：${input.userState}

朋友们：
${friendList}

朋友技能卡：
${skillCards}

根据用户消息和对话上下文，决定哪些朋友应该说话，分成几个批次。
同一批次内的朋友互不依赖，可以同时开口；不同批次有先后顺序，后一批能看到前一批的发言。

规则：
1. 如果用户消息很短（寒暄、确认），只安排 1-2 位朋友，1 个批次。
2. 如果需要安慰，让娜娜先开口。
3. 如果需要分析或辩论，让林博士和娜娜先铺垫，凯凯、阿言补充。
4. 如果需要行动，让末末收尾。
5. 每个人最多出场一次。
6. 阿言主要在别人过于乐观或用户准备做不可逆决定时出场；日常话题可以不出现。
7. 不要安排全体 5 人出场，一般 2-4 人就够了。
8. 每个 batch 里 focus 要具体（30 字以内），描述这位朋友发言的方向。
9. replyTo 填朋友名，表示回应谁上一轮说的话；没有则用 null。

输出严格 JSON：
{
  "batches": [
    { "friendIds": ["friendId1"], "focus": "先接住情绪，确认用户被听见", "replyTo": null },
    { "friendIds": ["friendId2", "friendId3"], "focus": "一个分析变量，一个吐槽脑补", "replyTo": "娜娜" }
  ],
  "totalExpected": 3
}`;

  const recent = input.history
    .slice(-6)
    .map((h) => formatHistoryLine(h))
    .join("\n");

  try {
    const result = await callFriendModelJson({
      messages: [
        { role: "system", content: prompt },
        {
          role: "user",
          content: `对话上下文：
${recent}

用户消息：${input.interactionType === "ambient" ? "【群友自然续聊触发】" + input.message : input.message}

输出批次安排 JSON：`
        }
      ],
      temperature: 0.4,
      maxTokens: 600,
      userConfig: input.userConfig?.apiKey ? input.userConfig : undefined
    });

    if (!result.ok) return { ok: false, error: result.error };

    const parsed = JSON.parse(result.content);
    if (!parsed.batches || !Array.isArray(parsed.batches)) return { ok: false, error: "invalid JSON" };

    const batches: Batch[] = parsed.batches
      .map((b: any) => ({
        friendIds: Array.isArray(b.friendIds) ? b.friendIds.filter((id: string) => input.friends.some((f) => f.id === id)) : [],
        focus: typeof b.focus === "string" ? b.focus.slice(0, 100) : "参与讨论",
        replyTo: typeof b.replyTo === "string" ? b.replyTo.slice(0, 24) : null
      }))
      .filter((b: Batch) => b.friendIds.length > 0)
      .slice(0, 3);

    if (batches.length === 0) return { ok: false, error: "no valid batches" };

    return {
      ok: true,
      batches,
      totalExpected: typeof parsed.totalExpected === "number" ? parsed.totalExpected : batches.reduce((sum, b) => sum + b.friendIds.length, 0)
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "orchestrator failed" };
  }
}

/* ─── Phase 2: Individual Speak ─── */

async function speakOne(
  friend: AIFriend,
  opts: {
    context: string;
    focus: string;
    replyTo?: string;
    mode: string;
    userConfig?: { apiKey?: string; baseUrl?: string; model?: string; providerName?: string } | null;
  }
): Promise<SpeakResult | null> {
  try {
    const systemPrompt = buildSpeakSystemPrompt(friend, opts);
    const result = await callFriendModelJson({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: opts.context }
      ],
      temperature: getFriendTemperature(friend.id, opts.mode),
      maxTokens: 300,
      userConfig: opts.userConfig?.apiKey ? opts.userConfig : undefined,
      jsonMode: false
    });

    if (!result.ok) return { friendId: friend.id, name: friend.name, spoken: null, skipped: true };

    const content = result.content.trim();
    if (!content || content.toLowerCase() === "null" || content.toLowerCase() === "skip" || content === "（沉默）" || content === "(silent)") {
      return { friendId: friend.id, name: friend.name, spoken: null, skipped: true };
    }

    let spoken = content;
    try {
      const maybe = JSON.parse(content);
      if (typeof maybe.spoken === "string" && maybe.spoken.trim()) spoken = maybe.spoken.trim();
      else if (typeof maybe.content === "string" && maybe.content.trim()) spoken = maybe.content.trim();
    } catch {}

    if (!spoken) return { friendId: friend.id, name: friend.name, spoken: null, skipped: true };

    return { friendId: friend.id, name: friend.name, spoken: spoken.slice(0, 260), skipped: false };
  } catch {
    return { friendId: friend.id, name: friend.name, spoken: null, skipped: true };
  }
}

function buildSpeakSystemPrompt(
  friend: AIFriend,
  opts: { focus: string; replyTo?: string; mode: string }
) {
  const replyHint = opts.replyTo
    ? `你正在回应「${opts.replyTo}」刚才说的话。自然地接住 TA 的话，但不要刻意重复 TA 的名字。`
    : "你是本轮第一个开口的人。自然地进入话题，不要自我介绍。";

  return `你是 ${friend.name}，${friend.title}。

你的性格底色：${friend.personality}
你的说话习惯：${friend.style}
你在群里的分工：${friend.job}
你真正关心的事：${friend.careFocus}
你的小习惯：${friend.quirks}
你的边界：${friend.boundaries}

当前群聊模式：${opts.mode}
${replyHint}
你本轮发言的方向指导：${opts.focus || "自然接话"}

【重要规则】
1. 只输出一条短消息（8-45 个中文字符，最多 2 句）。
2. 像真实朋友群聊——短促、口语、停顿感，不要长篇大论。
3. 如果你觉得现在不适合开口，输出 null。
4. 不要重复前面朋友已经说过的观点。你有独立人格。
5. 不要用"总结一下""看来大家""亲"等客服/机器人腔。
6. 保持你的性格特征：${friend.quirks}

只输出你要说的话（纯文本），不要前缀、引号或解释。`;
}

/* ─── Phase 3: Completion Check ─── */

async function callCompletionCheck(opts: {
  message: string;
  spokenLines: string[];
  friends: AIFriend[];
  mode: string;
  userConfig?: any;
}): Promise<{ needMore: boolean; extraFriendId?: string; extraReason?: string }> {
  const notSpoken = opts.friends.filter((f) => !opts.spokenLines.some((line) => line.startsWith(f.name + ":")));

  if (notSpoken.length === 0) return { needMore: false };

  try {
    const prompt = `你是群聊轮次的判断者。下面是本轮对话的最新内容：

${opts.spokenLines.join("\n")}

还没有说话的朋友：${notSpoken.map((f) => `${f.name}(${f.job})`).join("、")}

用户原始消息：${opts.message}

现在是否还需要让其中某位朋友补充发言？
- 如果话题已经收得很好，不需要再说话了 → needMore: false
- 如果某位朋友有明显的独特视角还没有被提到 → needMore: true，并指定 extraFriendId

输出严格 JSON：{ "needMore": true/false, "extraFriendId": "friendId或null", "extraReason": "简要理由" }`;

    const result = await callFriendModelJson({
      messages: [
        { role: "system", content: "你是群聊节奏判断器。只输出 JSON。" },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      maxTokens: 200,
      userConfig: opts.userConfig?.apiKey ? opts.userConfig : undefined
    });

    if (!result.ok) return { needMore: false };

    const parsed = JSON.parse(result.content);
    if (parsed.needMore && typeof parsed.extraFriendId === "string") {
      return { needMore: true, extraFriendId: parsed.extraFriendId, extraReason: parsed.extraReason?.slice(0, 60) };
    }
    return { needMore: false };
  } catch {
    return { needMore: false };
  }
}

/* ─── 兜底单次回复 ─── */

async function fallbackSingleReply(input: OrchestrateInput): Promise<FriendGroupResponse> {
  const friend = input.friends[0];
  const result = await speakOne(friend, {
    context: input.history.map(formatHistoryLine).join("\n") + `\n用户: ${input.message}`,
    focus: "先接一下话",
    mode: input.mode,
    userConfig: input.userConfig
  });

  if (!result?.spoken) {
    return {
      messages: [],
      summary: { mainPoints: [], disagreement: "暂无", safestAdvice: "请稍后再试。", nextAction: "重试", missingInfo: "N/A" },
      memoryCandidates: []
    };
  }

  return {
    messages: [{ friendId: friend.id, name: friend.name, tone: "support", content: result.spoken }],
    summary: { mainPoints: [`${friend.name}: ${result.spoken.slice(0, 40)}`], disagreement: "暂无", safestAdvice: "请继续。", nextAction: "等待用户回复。", missingInfo: "N/A" },
    memoryCandidates: []
  };
}

/* ─── Summary Generation ─── */

async function generateSummary(
  messages: FriendReply[],
  userMessage: string,
  mode: string,
  userConfig?: any
): Promise<FriendGroupResponse["summary"]> {
  if (messages.length === 0) {
    return {
      mainPoints: [],
      disagreement: "暂无对话。",
      safestAdvice: "请稍后再试。",
      nextAction: "重新发送消息。",
      missingInfo: "N/A"
    };
  }

  const conversation = messages.map((m) => `${m.name}: ${m.content}`).join("\n");

  try {
    const result = await callFriendModelJson({
      messages: [
        {
          role: "system",
          content: `你是群聊观察员。基于 AI 朋友们刚才的发言，用 JSON 输出一份简短总结。

字段：
- mainPoints: 2-4 条主要观点（每条 30 字以内）
- disagreement: 朋友们的主要分歧点（一句话，无分歧时写 "暂无分歧"）
- safestAdvice: 最稳妥的一个建议（一句话）
- nextAction: 建议用户下一步做什么（一句话）
- missingInfo: 还需要用户补充什么信息（一句话）`
        },
        {
          role: "user",
          content: `用户原始问题：${userMessage}
群聊模式：${mode}

朋友们的发言：
${conversation}`
        }
      ],
      temperature: 0.3,
      maxTokens: 500,
      userConfig: userConfig?.apiKey ? userConfig : undefined
    });

    if (result.ok) {
      const parsed = JSON.parse(result.content);
      return {
        mainPoints: Array.isArray(parsed.mainPoints) ? parsed.mainPoints.slice(0, 4) : [parsed.mainPoints?.toString() || ""],
        disagreement: parsed.disagreement || "暂无分歧",
        safestAdvice: parsed.safestAdvice || "先不急着下结论。",
        nextAction: parsed.nextAction || "等待用户回复。",
        missingInfo: parsed.missingInfo || "暂无"
      };
    }
  } catch {}

  return {
    mainPoints: messages.slice(0, 3).map((m) => `${m.name}: ${m.content.slice(0, 40)}`),
    disagreement: "暂无分歧",
    safestAdvice: "先不急着下结论。",
    nextAction: "等用户继续说。",
    missingInfo: "暂无"
  };
}

/* ─── Helpers ─── */

function formatHistoryLine(h: ChatHistoryMessage): string {
  return `${h.role === "user" ? "用户" : h.speaker || "AI"}: ${h.content}`;
}

/** 压缩旧的对话历史到 500 字摘要 */
async function compressOlderMessages(
  olderLines: string[],
  userConfig?: { apiKey?: string; baseUrl?: string; model?: string; providerName?: string } | null
): Promise<string | null> {
  if (olderLines.length === 0) return null;
  const raw = olderLines.join("\n").slice(0, 4000);
  try {
    const result = await callFriendModelJson({
      messages: [
        { role: "system", content: "你是对话摘要器。把下面这段群聊历史压缩成一段连贯的摘要（≤500 中文字符）。保留关键事件、情绪变化、重要决定和未解决的问题。用自然的中文叙述。不要遗漏任何一方的关键观点。" },
        { role: "user", content: raw }
      ],
      temperature: 0.3,
      maxTokens: 400,
      userConfig: userConfig?.apiKey ? userConfig : undefined,
      jsonMode: false
    });
    if (result.ok && result.content.trim()) {
      return result.content.trim().slice(0, 500);
    }
  } catch {}
  // 兜底：硬截断前几条
  return olderLines.slice(0, 8).map((l) => l.slice(0, 60)).join("；").slice(0, 500) || null;
}

function getFriendTemperature(friendId: string, mode: string): number {
  const base: Record<string, number> = {
    nana: 0.7, kai: 0.88, lin: 0.45, momo: 0.5, yan: 0.35
  };
  const modeMod: Record<string, number> = {
    comfort: 0, wake: 0.1, analysis: -0.1, debate: 0.05, plan: -0.05, review: -0.05, normal: 0
  };
  return Math.min(1, Math.max(0, (base[friendId] ?? 0.7) + (modeMod[mode] ?? 0)));
}
