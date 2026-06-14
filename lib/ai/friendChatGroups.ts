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
    initialMessages: [
      {
        friendId: "nana",
        content: "今天如果又开始自责，先停一下。你不是没用，你只是同时背了太多选项。"
      },
      {
        friendId: "kai",
        content: "对，脑子里开了二十个窗口还怪自己卡，多少有点离谱。",
        replyTo: "娜娜"
      },
      {
        friendId: "lin",
        content: "等你来了，我们先分清：情绪、事实、下一步。不要把三件事搅在一起。"
      }
    ]
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
    initialMessages: [
      {
        friendId: "momo",
        content: "今天不许用“等状态好一点”当免死金牌。先做 10 分钟。"
      },
      {
        friendId: "kai",
        content: "标题都没写就开始焦虑成片，挺有仪式感。开干。"
      }
    ]
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
    initialMessages: [
      {
        friendId: "nana",
        content: "如果你今晚很累，我们可以只聊一点点。不用把所有事都解释清楚。"
      },
      {
        friendId: "yan",
        content: "先不要在半夜做重大决定。半夜的大脑很会夸大坏结果。"
      }
    ]
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
    initialMessages: [
      {
        friendId: "lin",
        content: "重大选择不要只问“喜不喜欢”，还要问机会成本、可逆性和验证周期。"
      },
      {
        friendId: "yan",
        content: "我负责挑刺。能承受坏情况，才是真的想清楚。"
      }
    ]
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
    initialMessages: [
      {
        friendId: "kai",
        content: "本群宗旨：允许崩溃三分钟，但不允许饿着肚子硬撑。"
      },
      {
        friendId: "nana",
        content: "凯凯翻译一下就是：先照顾身体，再处理世界。"
      }
    ]
  }
];

export function getFriendChatGroup(groupId: string) {
  return friendChatGroups.find((group) => group.id === groupId);
}
