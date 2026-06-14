const KEY = "ziki-user-api-config-v1";

export type UserApiConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
  providerName: string;
};

export function getUserApiConfig(): UserApiConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.apiKey !== "string" || !parsed.apiKey.trim()) return null;
    return {
      apiKey: parsed.apiKey.trim(),
      baseUrl: typeof parsed.baseUrl === "string" && parsed.baseUrl.trim() ? parsed.baseUrl.trim() : "https://api.deepseek.com",
      model: typeof parsed.model === "string" && parsed.model.trim() ? parsed.model.trim() : "deepseek-v4-flash",
      providerName: typeof parsed.providerName === "string" && parsed.providerName.trim() ? parsed.providerName.trim() : "Custom"
    };
  } catch { return null; }
}

export function setUserApiConfig(config: UserApiConfig) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(config));
}

export function clearUserApiConfig() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

export function hasUserApiConfig(): boolean {
  return getUserApiConfig() !== null;
}
