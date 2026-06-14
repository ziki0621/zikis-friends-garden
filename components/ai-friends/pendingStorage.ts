const KEY = "ziki-pending-batch-v1";

type PendingBatch = {
  groupId: string;
  runId: number;
  messages: { friendId: string; name: string; color: string; content: string; tone?: string; replyTo?: string }[];
  /** 是否已由 deliver 接管，接管后不再从 storage 回放 */
  claimed: boolean;
};

export function writePendingBatch(batch: PendingBatch) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(batch));
}

export function readPendingBatch(): PendingBatch | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.messages)) return null;
    return parsed;
  } catch { return null; }
}

export function claimPendingBatch(runId: number): PendingBatch | null {
  const batch = readPendingBatch();
  if (!batch || batch.runId !== runId) return null;
  batch.claimed = true;
  writePendingBatch(batch);
  return batch;
}

export function clearPendingBatch() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

/** deliver 每送出一条就更新 remaining，全部送完就清掉 */
export function updateRemainingPending(runId: number, remainingMessages: { friendId: string; name: string; color: string; content: string; tone?: string; replyTo?: string }[]) {
  const batch = readPendingBatch();
  if (!batch || batch.runId !== runId) return;
  if (remainingMessages.length === 0) {
    clearPendingBatch();
  } else {
    batch.messages = remainingMessages;
    writePendingBatch(batch);
  }
}
