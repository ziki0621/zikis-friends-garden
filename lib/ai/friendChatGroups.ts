import {
  type AIFriend,
  type ChatMode,
  defaultFriends
} from "@/lib/ai/friendGroup";

export type FriendChatGroup = {
  id: string;
  name: string;
  description: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  accent: string;
  style: string;
  mode: ChatMode;
  userState: string;
  friends: AIFriend[];
  initialMessages: {
    friendId: string;
    content: string;
    replyTo?: string;
  }[];
};

const [nana, kai, lin, momo, yan] = defaultFriends;

export const friendChatGroups: FriendChatGroup[] = [
  {
    id: "inner-noise",
    name: "内耗急救群",
    description: "娜娜、凯凯、林博士、末末、阿言",
    lastMessage: "先别急着选，我们把它拆成能验证的小问题。",
    lastTime: "21:42",
    unread: 3,
    accent: "#0F766E",
    style: "温柔治愈 + 高效决策",
    mode: "analysis",
    userState: "最近容易内耗，想要有人接住情绪，也想要具体判断。",
    friends: defaultFriends,
    initialMessages: []
  },
  {
    id: "deadline-squad",
    name: "DDL 互助小队",
    description: "末末、凯凯、林博士",
    lastMessage: "你先开文档，标题写了也算破冰。",
    lastTime: "20:18",
    unread: 1,
    accent: "#2563EB",
    style: "行动监督 + 轻度毒舌",
    mode: "plan",
    userState: "最近有任务拖延，需要短步骤和监督。",
    friends: [momo, kai, lin],
    initialMessages: []
  },
  {
    id: "late-night",
    name: "深夜情绪收容所",
    description: "娜娜、阿言、末末",
    lastMessage: "今晚不用解决一生的问题，先把自己放回床上。",
    lastTime: "昨天",
    unread: 0,
    accent: "#7C3AED",
    style: "安静陪伴",
    mode: "comfort",
    userState: "深夜容易情绪低落，需要低压力陪伴。",
    friends: [nana, yan, momo],
    initialMessages: []
  },
  {
    id: "crossroads",
    name: "人生岔路口会议",
    description: "林博士、阿言、娜娜、凯凯",
    lastMessage: "反对意见不是泼冷水，是帮你看见盲区。",
    lastTime: "周三",
    unread: 0,
    accent: "#EA580C",
    style: "学术理性 + 让他们辩论",
    mode: "debate",
    userState: "正在面对重要选择，需要多视角辩论。",
    friends: [lin, yan, nana, kai],
    initialMessages: []
  },
  {
    id: "daily-chaos",
    name: "日常吐槽小群",
    description: "凯凯、娜娜、末末",
    lastMessage: "可以吐槽，但吐槽完记得吃饭。",
    lastTime: "周一",
    unread: 0,
    accent: "#DB2777",
    style: "毒舌搞笑 + 热闹整活",
    mode: "normal",
    userState: "日常聊天，想轻松一点。",
    friends: [kai, nana, momo],
    initialMessages: []
  }
];

export function getFriendChatGroup(groupId: string) {
  return friendChatGroups.find((group) => group.id === groupId);
}
