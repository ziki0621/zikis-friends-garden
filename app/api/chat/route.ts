import { openai } from "@ai-sdk/openai";
import { streamText, type CoreMessage } from "ai";
import { zikiPersona } from "@/lib/ai/zikiPersona";

export const maxDuration = 30;

type ChatRequest = {
  messages?: {
    role?: string;
    content?: unknown;
  }[];
};

export async function POST(request: Request) {
  const body = (await request.json()) as ChatRequest;
  const safeMessages = (body.messages ?? [])
    .filter((message) => message.role === "user" || message.role === "assistant")
    .slice(-20)
    .map((message) => ({
      role: message.role as "user" | "assistant",
      content: typeof message.content === "string" ? message.content.slice(0, 1000) : ""
    }))
    .filter((message) => message.content.length > 0) satisfies CoreMessage[];

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: zikiPersona,
    messages: safeMessages
  });

  return result.toDataStreamResponse();
}
