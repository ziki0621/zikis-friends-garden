type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatCompletionChoice = {
  message?: {
    content?: string;
  };
};

type ChatCompletionResponse = {
  choices?: ChatCompletionChoice[];
  error?: {
    message?: string;
  };
};

export type ModelJsonResult =
  | {
      ok: true;
      content: string;
      provider: string;
      model: string;
    }
  | {
      ok: false;
      error: string;
      provider: string;
      model: string;
      status?: number;
    };

type ModelConfig = {
  provider: string;
  baseUrl: string;
  model: string;
  apiKey: string;
};

export function hasConfiguredFriendModel() {
  // 前端传 key 也算已配置
  return true;
}

export async function callFriendModelJson({
  messages,
  temperature = 0.8,
  maxTokens = 2200,
  userConfig
}: {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  userConfig?: { apiKey?: string; baseUrl?: string; model?: string; providerName?: string } | null;
}): Promise<ModelJsonResult> {
  const config = getFriendModelConfig(userConfig);

  if (!config.apiKey) {
    return {
      ok: false,
      error: "请点击右上角 ⚙️ 设置你的 API Key，或在本页面配置 DEEPSEEK_API_KEY 环境变量。",
      provider: "Local mock",
      model: "mock"
    };
  }

  let lastEmptyResponse = false;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature,
        max_tokens: maxTokens,
        response_format: {
          type: "json_object"
        }
      })
    });

    const data = (await response.json().catch(() => null)) as ChatCompletionResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error?.message ?? `API returned HTTP ${response.status}.`,
        provider: config.provider,
        model: config.model,
        status: response.status
      };
    }

    const content = data?.choices?.[0]?.message?.content;
    if (content) {
      return {
        ok: true,
        content,
        provider: config.provider,
        model: config.model
      };
    }

    lastEmptyResponse = true;
  }

  return {
    ok: false,
    error: lastEmptyResponse
      ? "Model returned empty content twice. Try sending again or reduce the prompt size."
      : "Model response did not include choices[0].message.content.",
    provider: config.provider,
    model: config.model
  };
}

function getFriendModelConfig(userConfig?: { apiKey?: string; baseUrl?: string; model?: string; providerName?: string } | null): ModelConfig {
  // 前端传来的用户 key 优先
  if (userConfig?.apiKey && userConfig.apiKey.trim()) {
    return {
      provider: userConfig.providerName?.trim() || "Custom",
      baseUrl: stripTrailingSlash(userConfig.baseUrl?.trim() || "https://api.deepseek.com"),
      model: userConfig.model?.trim() || "deepseek-v4-flash",
      apiKey: userConfig.apiKey.trim()
    };
  }

  // fallback 到服务器环境变量
  const baseUrl = stripTrailingSlash(process.env.AI_FRIENDS_BASE_URL || "https://api.deepseek.com");

  return {
    provider: process.env.AI_FRIENDS_PROVIDER_NAME || "DeepSeek",
    baseUrl,
    model: process.env.AI_FRIENDS_MODEL || "deepseek-v4-flash",
    apiKey: process.env.AI_FRIENDS_API_KEY || process.env.DEEPSEEK_API_KEY || ""
  };
}

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}
