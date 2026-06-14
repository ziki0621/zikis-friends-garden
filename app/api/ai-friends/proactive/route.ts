import { NextResponse } from "next/server";
import {
  buildFriendGroupPrompt,
  coerceFriendGroupResponse,
  mockProactiveResponse,
  normalizeFriends,
  parseJsonFromModel
} from "@/lib/ai/friendGroup";
import { callFriendModelJson } from "@/lib/ai/openAICompatible";

export const maxDuration = 30;

type ProactiveRequest = {
  eventType?: unknown;
  eventText?: unknown;
  friends?: unknown;
  groupStyle?: unknown;
  userState?: unknown;
  apiKey?: unknown;
  baseUrl?: unknown;
  model?: unknown;
  providerName?: unknown;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as ProactiveRequest;
  const friends = normalizeFriends(body.friends);
  const eventType = typeof body.eventType === "string" ? body.eventType.slice(0, 40) : "time";
  const eventText =
    typeof body.eventText === "string"
      ? body.eventText.slice(0, 240)
      : eventType === "weather"
        ? "外面降温并可能下雨。"
        : "用户设置的长期目标已经两天没有更新。";
  const groupStyle = typeof body.groupStyle === "string" ? body.groupStyle.slice(0, 80) : "像熟朋友一样自然冒泡";
  const userState = typeof body.userState === "string" ? body.userState.slice(0, 160) : "";

  const userConfig = {
    apiKey: typeof body.apiKey === "string" ? body.apiKey.trim() : undefined,
    baseUrl: typeof body.baseUrl === "string" ? body.baseUrl.trim() : undefined,
    model: typeof body.model === "string" ? body.model.trim() : undefined,
    providerName: typeof body.providerName === "string" ? body.providerName.trim() : undefined
  };

  const hasServerKey = Boolean(process.env.AI_FRIENDS_API_KEY || process.env.DEEPSEEK_API_KEY);
  const hasUserKey = Boolean(userConfig.apiKey);
  if (!hasServerKey && !hasUserKey) {
    return NextResponse.json({
      provider: "未配置 API",
      model: "mock",
      usingMock: true,
      warning: "请在聊天设置中填入 API Key。",
      ...mockProactiveResponse(eventType, friends)
    });
  }

  const modelResult = await callFriendModelJson({
    messages: [
      {
        role: "system",
        content: buildFriendGroupPrompt({
          friends,
          groupStyle,
          mode: "normal",
          userState
        })
      },
      {
        role: "user",
        content: `这是一个系统触发的主动消息事件，不是用户主动提问。

事件类型: ${eventType}
事件内容: ${eventText}

请让 1-2 位 AI 朋友自然冒泡，像朋友群提醒一样，轻量、具体、有分寸。不要像系统通知，不要制造焦虑。`
      }
    ],
    temperature: 0.75,
    maxTokens: 900,
    userConfig: hasUserKey ? userConfig : undefined
  });

  if (!modelResult.ok) {
    return NextResponse.json(
      {
        error: modelResult.error,
        provider: modelResult.provider,
        model: modelResult.model
      },
      { status: modelResult.status ?? 502 }
    );
  }

  const parsed = parseJsonFromModel(modelResult.content);
  const normalized = coerceFriendGroupResponse(parsed, friends);

  if (!normalized) {
    return NextResponse.json(
      {
        error: "Model returned content that could not be parsed as the expected friend-group JSON.",
        provider: modelResult.provider,
        model: modelResult.model,
        rawPreview: modelResult.content.slice(0, 800)
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    provider: modelResult.provider,
    model: modelResult.model,
    usingMock: false,
    ...normalized
  });
}
