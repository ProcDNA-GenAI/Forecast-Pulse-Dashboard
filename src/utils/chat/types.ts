export type ChatRole = "assistant" | "user";

export type ChatContentType = "html" | "text";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  contentType: ChatContentType;
};

export type ChatReply = Pick<ChatMessage, "content" | "contentType">;

export type ChatChunkHandler = (chunk: ChatReply) => void;

export type ChatTransportOptions = {
  signal?: AbortSignal;
  onChunk?: ChatChunkHandler;
};

export type ChatTransport = (
  messages: ChatMessage[],
  options?: ChatTransportOptions,
) => Promise<ChatReply>;

export function createChatMessageId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()}`;
}
