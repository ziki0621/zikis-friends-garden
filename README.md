# AI 朋友群聊 Demo

一个网站版 AI 朋友群聊 Demo：第一屏是群聊列表，点进群聊后进入社交软件式聊天界面，并保留 DeepSeek / OpenAI-compatible API 接口。

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- OpenAI-compatible API adapter

## 本地启动

```bash
npm install
cp .env.example .env.local
npm run dev
```

打开 `http://localhost:3000`，会自动进入 `/ai-friends`。

## 页面与接口

- 群聊列表：`/ai-friends`
- 群聊详情：`/ai-friends/[groupId]`
- 聊天接口：`POST /api/ai-friends/chat`
- 主动消息接口：`POST /api/ai-friends/proactive`

未配置 API key 时，Demo 会使用本地 mock 回复，方便先试交互流程。

## 接入 DeepSeek

DeepSeek API 使用 OpenAI-compatible 格式。官方 base URL 是：

```text
https://api.deepseek.com
```

在 `.env.local` 中填入：

```env
DEEPSEEK_API_KEY=sk-your-key
AI_FRIENDS_BASE_URL=https://api.deepseek.com
AI_FRIENDS_MODEL=deepseek-v4-flash
AI_FRIENDS_PROVIDER_NAME=DeepSeek
```

然后重启 dev server：

```bash
npm run dev
```

打开任意群聊发送一条消息。如果顶部状态从 `未连接 API 时使用本地 mock` 变成 `DeepSeek · deepseek-v4-flash`，就说明已经接上真实 DeepSeek API。

也可以使用更通用的变量，便于以后切换其他 OpenAI-compatible provider：

```env
AI_FRIENDS_API_KEY=sk-your-key
AI_FRIENDS_BASE_URL=https://api.deepseek.com
AI_FRIENDS_MODEL=deepseek-v4-flash
AI_FRIENDS_PROVIDER_NAME=DeepSeek
```

## 环境变量

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=

DEEPSEEK_API_KEY=
AI_FRIENDS_API_KEY=
AI_FRIENDS_BASE_URL=https://api.deepseek.com
AI_FRIENDS_MODEL=deepseek-v4-flash
AI_FRIENDS_PROVIDER_NAME=DeepSeek

NEXT_PUBLIC_SITE_URL=http://localhost:3000
```
