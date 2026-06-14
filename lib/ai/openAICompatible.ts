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

export function hasConfiguredFriendModel() {
  return Boolean(getFriendModelConfig().apiKey);
}

export async function callFriendModelJson({
  messages,
  temperature = 0.8,
  maxTokens = 2200
}: {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}): Promise<ModelJsonResult> {
  const config = getFriendModelConfig();

  if (!config.apiKey) {
    return {
      ok: false,
      error: "Missing AI_FRIENDS_API_KEY or DEEPSEEK_API_KEY; using local demo mock.",
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
        error: data?.error?.message ?? `Model API returned HTTP ${response.status}.`,
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

function getFriendModelConfig() {
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
