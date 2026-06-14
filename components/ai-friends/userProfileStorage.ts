const KEY = "ziki-user-long-profile-v1";

export type UserLongProfile = {
  name: string;
  preferredTone: string;
  currentFocus: string;
  dislikedStyles: string[];
  languages: string[];
  personality: string;
  goals: string;
};

const defaults: UserLongProfile = {
  name: "用户",
  preferredTone: "自然、直接、有温度",
  currentFocus: "待探索",
  dislikedStyles: [],
  languages: ["中文"],
  personality: "开放、好奇",
  goals: ""
};

export function getUserLongProfile(): UserLongProfile {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch { return defaults; }
}

export function setUserLongProfile(p: Partial<UserLongProfile>) {
  if (typeof window === "undefined") return;
  const existing = getUserLongProfile();
  window.localStorage.setItem(KEY, JSON.stringify({ ...existing, ...p }));
}

export function formatUserProfileForPrompt(): string {
  const p = getUserLongProfile();
  return [
    `用户长期档案：`,
    `- 称呼：${p.name}`,
    `- 偏好语气：${p.preferredTone}`,
    `- 当前关注：${p.currentFocus}`,
    `- 性格：${p.personality}`,
    `- 目标：${p.goals || "待探索"}`,
    p.dislikedStyles.length > 0 ? `- 不喜欢：${p.dislikedStyles.join("、")}` : "",
  ].filter(Boolean).join("\n");
}
