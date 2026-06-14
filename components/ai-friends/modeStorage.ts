const KEY = "ziki-ai-mode-v1";

export type AiMode = "speed" | "realistic";

export function getAiMode(): AiMode {
  if (typeof window === "undefined") return "realistic";
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === "speed" || raw === "realistic") return raw;
  } catch {}
  return "realistic";
}

export function setAiMode(mode: AiMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, mode);
}
