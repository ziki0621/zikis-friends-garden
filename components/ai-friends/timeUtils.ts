/** 相对时间格式化：刚刚 / 14:32 / 昨天 14:32 / 3月5日 */
export function formatRelativeTime(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const sec = Math.floor(diff / 1000);

  if (sec < 60) return "刚刚";
  if (sec < 3600) return `${Math.floor(sec / 60)} 分钟前`;

  const msgDate = new Date(ts);
  const today = new Date(now);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const msgDay = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

  const hh = String(msgDate.getHours()).padStart(2, "0");
  const mm = String(msgDate.getMinutes()).padStart(2, "0");

  if (msgDay.getTime() === todayDay.getTime()) return `${hh}:${mm}`;
  if (msgDay.getTime() === yesterdayDay.getTime()) return `昨天 ${hh}:${mm}`;
  return `${msgDate.getMonth() + 1}月${msgDate.getDate()}日`;
}

/** 聊天内消息时间标签：今天 / 昨天 14:32 / 2026年3月5日 14:32 */
export function formatChatTime(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");

  if (msgDay.getTime() === today.getTime()) return `${hh}:${mm}`;
  if (msgDay.getTime() === yesterday.getTime()) return `昨天 ${hh}:${mm}`;
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${hh}:${mm}`;
}

/** 刷新最后一次活动时间到 storage */
export function touchLastActivity(chatId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`ziki-last-activity:${chatId}`, String(Date.now()));
}

/** 读取最后一次活动时间 */
export function getLastActivityTime(chatId: string): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(`ziki-last-activity:${chatId}`);
  return raw ? Number(raw) : 0;
}
