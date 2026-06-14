"use client";

import { useChat } from "ai/react";
import { Bot, Send } from "lucide-react";

export function ChatWindow() {
  const { messages, input, handleInputChange, handleSubmit, status, error } = useChat({
    api: "/api/chat",
    initialMessages: [
      {
        id: "hello",
        role: "assistant",
        content: "欢迎来到庄园。我是 ziki 的 AI 分身，不是现实中的 ziki 本人。你想先逛逛，还是创建一个自己的小角色？"
      }
    ]
  });

  return (
    <div className="mx-auto flex min-h-[calc(100vh-150px)] max-w-3xl flex-col rounded-[24px] bg-white p-4 pixel-border">
      <div className="flex items-center gap-3 border-b-2 border-ink/10 pb-4">
        <div className="rounded-2xl bg-grape p-3 text-white">
          <Bot />
        </div>
        <div>
          <h1 className="text-2xl font-black">和 ziki AI 分身聊天</h1>
          <p className="text-sm text-ink/60">AI 分身可以介绍庄园，但不会代表现实中的 ziki 做承诺。</p>
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto py-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[82%] rounded-3xl px-4 py-3 leading-7 ${message.role === "user" ? "bg-ink text-white" : "bg-cream text-ink"}`}>
              {message.content}
            </div>
          </div>
        ))}
        {status === "submitted" || status === "streaming" ? <p className="text-sm font-bold text-ink/50">ziki AI 正在想一想...</p> : null}
        {error ? <p className="text-sm font-bold text-red-600">{error.message}</p> : null}
      </div>
      <form className="flex gap-2 border-t-2 border-ink/10 pt-4" onSubmit={handleSubmit}>
        <input
          className="min-w-0 flex-1 rounded-2xl border-2 border-ink/20 px-4 py-3 outline-none focus:border-grape"
          maxLength={1000}
          onChange={handleInputChange}
          placeholder="问问庄园怎么玩..."
          value={input}
        />
        <button className="inline-flex items-center gap-2 rounded-2xl bg-ink px-5 py-3 font-black text-white" type="submit">
          <Send size={18} />
          发送
        </button>
      </form>
    </div>
  );
}
