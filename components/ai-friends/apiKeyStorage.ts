const PROFILES_KEY = "ziki-api-profiles-v1";
const ACTIVE_KEY = "ziki-api-active-profile-v1";
const LEGACY_KEY = "ziki-user-api-config-v1";

export type ApiProfile = {
  id: string;
  name: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  providerName: string;
  createdAt: number;
};

/* ── 读取所有配置 ── */

export function getAllProfiles(): ApiProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PROFILES_KEY);
    if (!raw) {
      // 迁移旧单配置格式
      const legacy = window.localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        try {
          const parsed = JSON.parse(legacy);
          if (parsed && typeof parsed.apiKey === "string" && parsed.apiKey.trim()) {
            const profile: ApiProfile = {
              id: uid(),
              name: parsed.providerName || "默认配置",
              apiKey: parsed.apiKey.trim(),
              baseUrl: parsed.baseUrl?.trim() || "https://api.deepseek.com",
              model: parsed.model?.trim() || "deepseek-v4-flash",
              providerName: parsed.providerName?.trim() || "Custom",
              createdAt: Date.now()
            };
            setAllProfiles([profile]);
            window.localStorage.setItem(ACTIVE_KEY, profile.id);
            window.localStorage.removeItem(LEGACY_KEY);
            return [profile];
          }
        } catch {}
      }
      return [];
    }
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter(p => p && typeof p.id === "string" && typeof p.apiKey === "string");
  } catch { return []; }
}

export function setAllProfiles(profiles: ApiProfile[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles.slice(0, 20)));
}

/* ── 激活配置 ── */

export function getActiveProfileId(): string | null {
  if (typeof window === "undefined") return null;
  const profiles = getAllProfiles();
  if (profiles.length === 0) return null;
  const active = window.localStorage.getItem(ACTIVE_KEY);
  if (active && profiles.some(p => p.id === active)) return active;
  // 默认激活第一个
  window.localStorage.setItem(ACTIVE_KEY, profiles[0].id);
  return profiles[0].id;
}

export function setActiveProfileId(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_KEY, id);
}

/* ── 获取当前激活的配置 ── */

export function getActiveProfile(): ApiProfile | null {
  const activeId = getActiveProfileId();
  if (!activeId) return null;
  return getAllProfiles().find(p => p.id === activeId) ?? null;
}

/* ── CRUD ── */

export function addProfile(name: string, apiKey: string, baseUrl: string, model: string, providerName: string): ApiProfile {
  const profile: ApiProfile = {
    id: uid(),
    name: name.trim() || providerName.trim() || "未命名",
    apiKey: apiKey.trim(),
    baseUrl: baseUrl.trim() || "https://api.deepseek.com",
    model: model.trim() || "deepseek-v4-flash",
    providerName: providerName.trim() || "Custom",
    createdAt: Date.now()
  };
  const profiles = getAllProfiles();
  setAllProfiles([...profiles, profile]);
  setActiveProfileId(profile.id);
  return profile;
}

export function updateProfile(id: string, updates: Partial<Omit<ApiProfile, "id" | "createdAt">>) {
  const profiles = getAllProfiles().map(p =>
    p.id === id ? { ...p, ...updates } : p
  );
  setAllProfiles(profiles);
}

export function deleteProfile(id: string) {
  const profiles = getAllProfiles().filter(p => p.id !== id);
  setAllProfiles(profiles);
  if (getActiveProfileId() === id) {
    const active = profiles[0]?.id ?? null;
    if (active) window.localStorage.setItem(ACTIVE_KEY, active);
    else window.localStorage.removeItem(ACTIVE_KEY);
  }
}

/* ── 向后兼容 ── */

export function getUserApiConfig(): ApiProfile | null {
  return getActiveProfile();
}

export function setUserApiConfig(config: ApiProfile) {
  addProfile(config.providerName || "默认", config.apiKey, config.baseUrl, config.model, config.providerName);
}

export function clearUserApiConfig() {
  const active = getActiveProfileId();
  if (active) deleteProfile(active);
}

export function hasUserApiConfig(): boolean {
  return getActiveProfile() !== null;
}

function uid() { return `ap-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`; }
