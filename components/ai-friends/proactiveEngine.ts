import { getUserApiConfig } from "@/components/ai-friends/apiKeyStorage";
import { getAiMode } from "@/components/ai-friends/modeStorage";

const FREQ_KEY = "ziki-proactive-frequency-v1";
const LAST_TRIGGER_KEY = "ziki-proactive-last-trigger-v1";
const MESSAGE_QUEUE_KEY = "ziki-proactive-queue-v1";

export type ProactiveFrequency = "off" | "low" | "medium" | "high";

const INTERVALS: Record<ProactiveFrequency, number> = {
  off: 0,
  low: 1000 * 60 * 60 * 6,       // 6 小时
  medium: 1000 * 60 * 60 * 2,     // 2 小时
  high: 1000 * 60 * 30            // 30 分钟
};

export function getProactiveFrequency(): ProactiveFrequency {
  if (typeof window === "undefined") return "off";
  const raw = window.localStorage.getItem(FREQ_KEY);
  if (raw === "low" || raw === "medium" || raw === "high") return raw;
  return "off";
}

export function setProactiveFrequency(freq: ProactiveFrequency) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FREQ_KEY, freq);
}

export function getLastTrigger(): number {
  if (typeof window === "undefined") return 0;
  return Number(window.localStorage.getItem(LAST_TRIGGER_KEY)) || 0;
}

function setLastTrigger(ts: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAST_TRIGGER_KEY, String(ts));
}

/* ─── 待投递的消息队列（给前端渲染）─── */

export type QueuedProactiveMessage = {
  id: string;
  groupId: string;
  groupName: string;
  friendId: string;
  friendName: string;
  content: string;
  timestamp: number;
};

export function getQueuedMessages(): QueuedProactiveMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(MESSAGE_QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch { return []; }
}

function enqueueMessage(msg: QueuedProactiveMessage) {
  const queue = getQueuedMessages();
  queue.push(msg);
  window.localStorage.setItem(MESSAGE_QUEUE_KEY, JSON.stringify(queue.slice(-20)));
}

export function dequeueAllMessages(): QueuedProactiveMessage[] {
  const queue = getQueuedMessages();
  window.localStorage.removeItem(MESSAGE_QUEUE_KEY);
  return queue;
}

/* ─── 引擎 ─── */

let engineTimer: ReturnType<typeof setInterval> | null = null;

export function startProactiveEngine(
  onNewMessage?: (msg: QueuedProactiveMessage) => void
) {
  stopProactiveEngine();
  const freq = getProactiveFrequency();
  const interval = INTERVALS[freq];
  if (!interval) return;
  // 首次启动时按剩余时间触发
  const last = getLastTrigger();
  const elapsed = Date.now() - last;
  const initialDelay = Math.max(30_000, interval - elapsed);

  engineTimer = setInterval(async () => {
    const now = Date.now();
    const result = await triggerProactiveMessage();
    if (result) {
      setLastTrigger(now);
      onNewMessage?.(result);
    }
  }, initialDelay);

  // 第一次触发后切换到正常间隔
  setTimeout(() => {
    if (engineTimer) {
      clearInterval(engineTimer);
      engineTimer = setInterval(async () => {
        const now = Date.now();
        const result = await triggerProactiveMessage();
        if (result) {
          setLastTrigger(now);
          onNewMessage?.(result);
        }
      }, interval);
    }
  }, initialDelay);
}

export function stopProactiveEngine() {
  if (engineTimer) {
    clearInterval(engineTimer);
    engineTimer = null;
  }
}

/** 触发一次主动消息 */
async function triggerProactiveMessage(): Promise<QueuedProactiveMessage | null> {
  try {
    // 随机选择一个群聊或私聊
    const groups = readAllChatGroups();
    if (groups.length === 0) return null;
    const group = groups[Math.floor(Math.random() * groups.length)];
    const friend = group.friends[Math.floor(Math.random() * group.friends.length)];
    if (!friend) return null;

    const uc = getUserApiConfig();
    const res = await fetch("/api/ai-friends/proactive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "time",
        eventText: `现在是 ${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}，${friend.name} 想随便给用户发个消息——不用假装发生了什么事，就像朋友突然想到了你，随便说一句。`,
        friends: [friend],
        groupStyle: group.style,
        userState: group.userState,
        aiMode: getAiMode(),
        groupId: group.id,
        groupName: group.name,
        ...(uc ? { apiKey: uc.apiKey, baseUrl: uc.baseUrl, model: uc.model, providerName: uc.providerName } : {})
      })
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.messages?.[0]) return null;

    const msg = data.messages[0];
    const queued: QueuedProactiveMessage = {
      id: crypto.randomUUID(),
      groupId: group.id,
      groupName: group.name,
      friendId: msg.friendId || friend.id,
      friendName: msg.name || friend.name,
      content: msg.content,
      timestamp: Date.now()
    };

    enqueueMessage(queued);

    // 浏览器通知
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification(`${queued.friendName} · ${queued.groupName}`, {
        body: queued.content,
        icon: "/favicon.ico",
        tag: "ziki-proactive"
      });
    }

    return queued;
  } catch {
    return null;
  }
}

/** 读取所有可用的群聊（含私聊虚拟群） */
function readAllChatGroups(): { id: string; name: string; style: string; userState: string; friends: any[] }[] {
  try {
    const groupsRaw = window.localStorage.getItem("ziki-ai-custom-chat-groups-v1");
    const friends = readVisibleFriends();
    const builtIn: { id: string; name: string; style: string; userState: string }[] = [
      { id: "inner-noise", name: "内耗急救群", style: "温柔治愈 + 高效决策", userState: "最近容易内耗" },
      { id: "deadline-squad", name: "DDL 互助小队", style: "行动监督 + 轻度毒舌", userState: "有任务要推进" },
      { id: "late-night", name: "深夜情绪收容所", style: "安静陪伴，不吵不闹", userState: "晚上容易情绪波动" },
      { id: "crossroads", name: "人生岔路口会议", style: "学术理性 + 多视角辩论", userState: "面临重要选择" },
      { id: "daily-chaos", name: "日常吐槽小群", style: "毒舌搞笑 + 热闹整活", userState: "日常吐槽" }
    ];

    // 内置群聊 + 朋友虚拟群
    const all: any[] = [...builtIn, ...friends.map((f: any) => ({
      id: `dm-${f.id}`,
      name: f.name,
      style: "一对一私聊",
      userState: `用户正在和 ${f.name} 私聊`,
      friends: [f]
    }))];

    if (groupsRaw) {
      try {
        const custom = JSON.parse(groupsRaw);
        if (Array.isArray(custom)) {
          all.push(...custom.map((g: any) => ({
            id: g.id, name: g.name, style: g.style || "自然朋友群聊",
            userState: g.userState || "新建的群聊",
            friends: g.friends || []
          })));
        }
      } catch {}
    }

    return all.filter((g) => g.friends && g.friends.length > 0);
  } catch { return []; }
}

function readVisibleFriends(): any[] {
  try {
    const hidden = JSON.parse(window.localStorage.getItem("ziki-ai-hidden-friends-v1") || "[]");
    const custom = JSON.parse(window.localStorage.getItem("ziki-ai-custom-friends-v1") || "[]");
    const defaultIds = ["nana", "kai", "lin", "momo", "yan"];
    const defaults = [
      { id: "nana", name: "娜娜", emoji: "🌸", color: "#F97373" },
      { id: "kai", name: "凯凯", emoji: "🔥", color: "#F59E0B" },
      { id: "lin", name: "林博士", emoji: "🧠", color: "#2F80ED" },
      { id: "momo", name: "末末", emoji: "🚀", color: "#10B981" },
      { id: "yan", name: "阿言", emoji: "🛡️", color: "#8B5CF6" }
    ];
    return [
      ...defaults.filter((d) => !hidden.includes(d.id)),
      ...custom.filter((c: any) => c && typeof c.id === "string")
    ];
  } catch { return []; }
}
