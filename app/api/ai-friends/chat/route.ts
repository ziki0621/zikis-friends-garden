import { NextResponse } from "next/server";
import {
  coerceFriendGroupResponse,
  estimateReplyPlan,
  type InteractionType,
  mockFriendGroupResponse,
  normalizeFriends,
  normalizeHistory,
  normalizeMemoryContext,
  normalizeMode,
  parseJsonFromModel,
  buildFriendGroupPrompt,
  buildUserPrompt
} from "@/lib/ai/friendGroup";
import { callFriendModelJson } from "@/lib/ai/openAICompatible";
import { filterRelationsForFriends, normalizeFriendRelations } from "@/lib/ai/friendRelations";
import { runOrchestratedConversation } from "@/lib/ai/friendOrchestrator";

export const maxDuration = 60;

type ChatRequest = {
  message?: unknown;
  history?: unknown;
  friends?: unknown;
  mode?: unknown;
  groupStyle?: unknown;
  memory?: unknown;
  userState?: unknown;
  interactionType?: unknown;
  relations?: unknown;
  apiKey?: unknown;
  baseUrl?: unknown;
  model?: unknown;
  providerName?: unknown;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as ChatRequest;
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 1200) : "";

  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const friends = normalizeFriends(body.friends);
  const mode = normalizeMode(body.mode);
  const history = normalizeHistory(body.history);
  const memoryContext = normalizeMemoryContext(body.memory);
  const relations = filterRelationsForFriends(normalizeFriendRelations(body.relations), friends);
  const interactionType: InteractionType = body.interactionType === "ambient" ? "ambient" : "user";
  const groupStyle = typeof body.groupStyle === "string" ? body.groupStyle.slice(0, 80) : "温柔治愈 + 热闹整活";
  const userState = typeof body.userState === "string" ? body.userState.slice(0, 160) : "";

  const replyPlan =
    friends.length === 1
      ? { min: 1, max: 3, label: "私聊场景" }
      : estimateReplyPlan(message, mode);

  const userConfig = {
    apiKey: typeof body.apiKey === "string" ? body.apiKey.trim() : undefined,
    baseUrl: typeof body.baseUrl === "string" ? body.baseUrl.trim() : undefined,
    model: typeof body.model === "string" ? body.model.trim() : undefined,
    providerName: typeof body.providerName === "string" ? body.providerName.trim() : undefined
  };

  const hasServerKey = Boolean(process.env.AI_FRIENDS_API_KEY || process.env.DEEPSEEK_API_KEY);
  const hasUserKey = Boolean(userConfig.apiKey);
  const effectiveConfig = hasUserKey ? userConfig : undefined;

  // 没有 API Key → mock
  if (!hasServerKey && !hasUserKey) {
    return NextResponse.json({
      provider: "未配置 API",
      model: "mock",
      usingMock: true,
      warning: "请在聊天设置中填入 API Key（支持 DeepSeek、OpenAI、Groq 等）。",
      ...mockFriendGroupResponse(message, mode, friends, replyPlan)
    });
  }

  // ═══ 编排模式：多朋友群聊 ═══
  if (friends.length >= 2) {
    try {
      const response = await runOrchestratedConversation({
        message,
        history,
        friends,
        mode,
        groupStyle,
        userState,
        userConfig: effectiveConfig,
        interactionType
      });

      const hasMessages = response.messages.length > 0;

      return NextResponse.json({
        provider: effectiveConfig?.providerName || "DeepSeek",
        model: effectiveConfig?.model || "deepseek-v4-flash",
        usingMock: false,
        orchestrated: true,
        ...response,
        summary: response.summary || {
          mainPoints: [],
          disagreement: "暂无",
          safestAdvice: hasMessages ? "请继续。" : "请稍后再试。",
          nextAction: "等待用户回复。",
          missingInfo: "N/A"
        }
      });
    } catch {
      // 编排失败 → 回退到原来的单次调用
    }
  }

  // ═══ 回退：私聊或原单次调用 ═══
  const modelResult = await callFriendModelJson({
    messages: [
      {
        role: "system",
        content: buildFriendGroupPrompt({ friends, groupStyle, mode, userState, replyPlan, memoryContext, relations })
      },
      {
        role: "user",
        content: buildUserPrompt({ message, history, memoryContext, friends, mode, interactionType })
      }
    ],
    userConfig: effectiveConfig
  });

  if (!modelResult.ok) {
    return NextResponse.json(
      { error: modelResult.error, provider: modelResult.provider, model: modelResult.model },
      { status: modelResult.status ?? 502 }
    );
  }

  const parsed = parseJsonFromModel(modelResult.content);
  const normalized = coerceFriendGroupResponse(parsed, friends);

  if (!normalized) {
    return NextResponse.json({
      provider: modelResult.provider,
      model: modelResult.model,
      usingMock: true,
      warning: "模型说话格式乱了，已切到兜底回复。",
      ...mockFriendGroupResponse(message, mode, friends, replyPlan)
    });
  }

  return NextResponse.json({
    provider: modelResult.provider,
    model: modelResult.model,
    usingMock: false,
    ...normalized,
    messages: normalized.messages.slice(0, replyPlan.max)
  });
}
