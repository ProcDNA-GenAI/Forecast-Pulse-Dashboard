"use client";

import { Bot, Sparkles } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { sendDashboardChat } from "@/utils/chat/chat-service";
import {
  createChatMessageId,
  type ChatMessage,
  type ChatReply,
} from "@/utils/chat/types";
import { ChatAssistantPanel } from "./ChatAssistantPanel";

const initialMessages: ChatMessage[] = [
  {
    id: "chat-assistant-welcome",
    role: "assistant",
    content:
      "Hi! I’m your Forecast Pulse assistant. Ask me about market trends, assumptions, or a chart on this dashboard.",
    contentType: "text",
  },
];

export function ChatAssistant({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isSending, setIsSending] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const requestControllerRef = useRef<AbortController | null>(null);

  const openAssistant = () => setIsOpen(true);

  const closeAssistant = useCallback(() => {
    setIsOpen(false);
    requestAnimationFrame(() => launcherRef.current?.focus());
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        closeAssistant();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [closeAssistant, isOpen]);

  useEffect(() => {
    return () => requestControllerRef.current?.abort();
  }, []);

  const sendMessage = async () => {
    const content = inputValue.trim();

    if (!content || isSending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createChatMessageId(),
      role: "user",
      content,
      contentType: "text",
    };
    const conversation = [...messages, userMessage];
    const assistantMessageId = createChatMessageId();
    let hasStreamedContent = false;

    setMessages(conversation);
    setInputValue("");
    setIsSending(true);

    const controller = new AbortController();
    requestControllerRef.current = controller;

    const handleChunk = (chunk: ChatReply) => {
      hasStreamedContent = true;
      setMessages((current) => {
        const existingMessage = current.find((message) => message.id === assistantMessageId);

        if (!existingMessage) {
          return [
            ...current,
            {
              id: assistantMessageId,
              role: "assistant",
              content: chunk.content,
              contentType: chunk.contentType,
            },
          ];
        }

        return current.map((message) =>
          message.id === assistantMessageId
            ? { ...message, content: `${message.content}${chunk.content}` }
            : message,
        );
      });
    };

    try {
      const reply = await sendDashboardChat(conversation, {
        signal: controller.signal,
        onChunk: handleChunk,
      });

      if (!hasStreamedContent) {
        setMessages((current) => [
          ...current,
          {
            id: assistantMessageId,
            role: "assistant",
            content: reply.content,
            contentType: reply.contentType,
          },
        ]);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setMessages((current) => [
        ...current,
        {
          id: assistantMessageId,
          role: "assistant",
          content: "I couldn’t complete that message. Please try again.",
          contentType: "text",
        },
      ]);
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null;
      }
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-clip">
      <div
        className={`min-w-0 transition-[margin-right] duration-300 ease-out ${
          isOpen ? "xl:mr-[30vw]" : ""
        }`}
      >
        {children}
      </div>

      {isOpen ? (
        <>
          <button
            type="button"
            tabIndex={-1}
            aria-label="Close Chat Assistant"
            onClick={closeAssistant}
            className="fixed inset-0 z-[65] cursor-default bg-primary-deep/20 backdrop-blur-[1px] xl:hidden"
          />
          <ChatAssistantPanel
            messages={messages}
            inputValue={inputValue}
            isSending={isSending}
            onInputChange={setInputValue}
            onSend={() => void sendMessage()}
            onClose={closeAssistant}
          />
        </>
      ) : (
        <button
          ref={launcherRef}
          type="button"
          onClick={openAssistant}
          aria-expanded="false"
          aria-controls="chat-assistant-panel"
          className="chat-launcher-enter group fixed bottom-5 right-5 z-[60] flex cursor-pointer items-center gap-2.5 rounded-2xl border border-white/20 bg-primary px-3.5 py-3 text-white shadow-[0_12px_34px_rgba(8,50,96,0.3)] transition hover:-translate-y-0.5 hover:bg-secondary hover:shadow-[0_16px_38px_rgba(8,50,96,0.34)] focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 sm:bottom-6 sm:right-6 sm:px-4"
        >
          <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-primary-deep shadow-sm transition-transform group-hover:scale-105">
            <Bot aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={2.2} />
            <Sparkles aria-hidden="true" className="absolute -right-1 -top-1 h-3 w-3 text-white" fill="currentColor" />
          </span>
          <span className="text-[13px] font-bold tracking-[0.01em]">Chat Assistant</span>
        </button>
      )}
    </div>
  );
}
