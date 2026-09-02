"use client";

import { Bot, Sparkles, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ChatMessage as ChatMessageModel } from "@/utils/chat/types";
import { ChatComposer } from "./ChatComposer";
import { ChatMessage, ChatThinkingMessage } from "./ChatMessage";

type ChatAssistantPanelProps = {
  messages: ChatMessageModel[];
  inputValue: string;
  isSending: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onClose: () => void;
};

export function ChatAssistantPanel({
  messages,
  inputValue,
  isSending,
  onInputChange,
  onSend,
  onClose,
}: ChatAssistantPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [isSending, messages]);

  return (
    <aside
      id="chat-assistant-panel"
      role="dialog"
      aria-modal="false"
      aria-labelledby="chat-assistant-title"
      className="chat-panel-enter fixed inset-y-0 right-0 z-[70] flex w-full flex-col overflow-hidden border-l border-primary/15 bg-page shadow-[-18px_0_48px_rgba(8,50,96,0.18)] sm:w-[min(430px,92vw)] xl:w-[30vw]"
    >
      <header className="relative shrink-0 overflow-hidden bg-gradient-to-r from-primary-deep via-primary to-secondary px-4 py-4 text-white">
        <div aria-hidden="true" className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center gap-3">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary-deep shadow-sm">
            <Bot aria-hidden="true" className="h-5 w-5" strokeWidth={2.2} />
            <Sparkles aria-hidden="true" className="absolute -right-1 -top-1 h-3.5 w-3.5 text-white" fill="currentColor" />
          </span>
          <div className="min-w-0">
            <h2 id="chat-assistant-title" className="text-[15px] font-bold">Chat Assistant</h2>
            <p className="mt-0.5 truncate text-[11px] text-primary-soft">Forecast Pulse intelligence</p>
          </div>
          <span className="ml-auto mr-1 hidden items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-primary-soft sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#73dfaa]" />
            Ready
          </span>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            aria-label="Close Chat Assistant"
            title="Close Chat Assistant"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-white transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          >
            <X aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col bg-[linear-gradient(180deg,rgba(12,68,124,0.045),rgba(244,243,239,0)_32%)]">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isSending ? <ChatThinkingMessage /> : null}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <ChatComposer
          value={inputValue}
          isSending={isSending}
          onChange={onInputChange}
          onSend={onSend}
        />
      </div>
    </aside>
  );
}
