const KEY = "ziki-searchable-history-v1";

type HistoryEntry = {
  id: string;
  groupId: string;
  content: string;
  speaker: string;
  createdAt: number;
};

export function saveToSearchableHistory(entry: Omit<HistoryEntry, "createdAt">) {
  if (typeof window === "undefined") return;
  const all = readAll();
  all.push({ ...entry, createdAt: Date.now() });
  // 保留最多 200 条
  window.localStorage.setItem(KEY, JSON.stringify(all.slice(-200)));
}

function readAll(): HistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

/** 关键词检索相关历史（最多600字） */
export function searchHistory(keywords: string[], groupId?: string, maxChars = 600): string {
  if (typeof window === "undefined") return "";
  const all = readAll();
  const filtered = all.filter(e => {
    if (groupId && e.groupId !== groupId) return false;
    const text = e.content.toLowerCase();
    return keywords.some(kw => text.includes(kw.toLowerCase()));
  });
  if (filtered.length === 0) return "";
  const lines: string[] = [];
  let total = 0;
  for (const e of filtered.slice(-20)) {
    const line = `${e.speaker}: ${e.content}`;
    if (total + line.length > maxChars) break;
    lines.push(line);
    total += line.length;
  }
  return lines.join("\n");
}

/** 提取关键词 */
export function extractKeywords(text: string): string[] {
  const words = text
    .replace(/[，。！？、；：""（）【】\s]/g, " ")
    .split(" ")
    .map(w => w.trim())
    .filter(w => w.length >= 2 && w.length <= 10);
  return [...new Set(words)].slice(0, 8);
}
