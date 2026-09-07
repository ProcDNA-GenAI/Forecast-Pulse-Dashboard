"use client";

import { ChevronDown, MessageSquarePlus, RefreshCw, X } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import type { ChatBootstrapData, ChatMessage as ChatMessageModel, RoutingDecision } from "@/utils/chat/types";
import { ChatComposer } from "./ChatComposer";
import { ChatMessage } from "./ChatMessage";

type ChatAssistantPanelProps = {
  messages: ChatMessageModel[];
  inputValue: string;
  isSending: boolean;
  activeRoute: RoutingDecision | null;
  bootstrapData: ChatBootstrapData | null;
  bootstrapError: string | null;
  bootstrapStatus: "error" | "idle" | "loading" | "ready";
  onInputChange: (value: string) => void;
  onSend: (question?: string) => void;
  onNewConversation: () => void;
  onRetryBootstrap: () => void;
  onClose: () => void;
};

function sourceSummary(data: ChatBootstrapData | null) {
  if (!data) return "Preparing connected sources";
  const total = data.studyCount + data.literatureDocumentCount;
  return `${data.diseaseArea.diseasearea_name} · ${total} knowledge source${total === 1 ? "" : "s"} ready`;
}

function questionPreview(content: string) {
  const preview = content.replaceAll("\n", " ").trim();
  return preview.length > 58 ? `${preview.slice(0, 57).trim()}...` : preview;
}

function JumpToQuestion({
  questions,
  onJump,
}: {
  questions: ChatMessageModel[];
  onJump: (messageId: string) => void;
}) {
  return (
    <label className="relative ml-auto inline-flex items-center" htmlFor="jump-to-question">
      <span className="sr-only">Jump to question</span>
      <select
        id="jump-to-question"
        defaultValue=""
        onChange={(event) => {
          if (!event.target.value) return;
          onJump(event.target.value);
          event.target.value = "";
        }}
        className="h-7 w-[178px] cursor-pointer appearance-none rounded-lg border border-border bg-white py-1 pl-2.5 pr-7 text-[10px] font-semibold text-content shadow-sm outline-none transition hover:border-primary/35 focus:border-primary/45 focus:ring-2 focus:ring-primary/10"
      >
        <option value="" className="text-content">Jump to question</option>
        {questions.map((message, index) => (
          <option key={message.id} value={message.id} className="text-content">
            {`Q${index + 1}: ${questionPreview(message.content)}`}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-primary" aria-hidden="true" />
    </label>
  );
}

export function ChatAssistantPanel({
  messages,
  inputValue,
  isSending,
  activeRoute,
  bootstrapData,
  bootstrapError,
  bootstrapStatus,
  onInputChange,
  onSend,
  onNewConversation,
  onRetryBootstrap,
  onClose,
}: ChatAssistantPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef(new Map<string, HTMLDivElement>());
  const questions = useMemo(
    () => messages.filter((message) => message.role === "user"),
    [messages],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: isSending ? "auto" : "smooth", block: "end" });
  }, [isSending, messages]);

  return (
    <aside
      id="chat-assistant-panel"
      role="dialog"
      aria-modal="false"
      aria-labelledby="chat-assistant-title"
      className="chat-panel-enter fixed inset-y-0 right-0 z-[70] flex w-full flex-col overflow-hidden bg-white sm:w-[min(560px,94vw)] xl:w-[33vw] xl:rounded-l-[40px]"
    >
      <header className="relative shrink-0 bg-white px-5 pb-4 pt-8 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <h2 id="chat-assistant-title" className="text-lg font-bold text-primary">AI Chat Assistant</h2>
          </div>
          <button type="button" onClick={onNewConversation} disabled={isSending} aria-label="Start a new conversation" title="New conversation" className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-primary transition hover:bg-primary/7 disabled:cursor-not-allowed disabled:opacity-40">
            <MessageSquarePlus className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
          <button type="button" onClick={onClose} autoFocus aria-label="Close Chat Assistant" title="Close AI Assistant" className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#666970] transition hover:bg-[#f2f3f5] hover:text-content focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
            <X aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        {bootstrapStatus !== "idle" || activeRoute || questions.length > 1 ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#ececef] pt-2.5">
            {bootstrapStatus !== "idle" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f2f4f7] px-2.5 py-1 text-[9px] font-semibold text-muted">
                <span className={`h-1.5 w-1.5 rounded-full ${bootstrapStatus === "ready" ? "bg-success" : bootstrapStatus === "error" ? "bg-danger" : "animate-pulse bg-accent"}`} />
                {bootstrapStatus === "ready" ? sourceSummary(bootstrapData) : bootstrapStatus === "error" ? "Sources unavailable" : "Preparing sources"}
              </span>
            ) : null}
            {activeRoute ? (
              <span className="rounded-full bg-primary/8 px-2.5 py-1 text-[9px] font-bold text-primary">
                {activeRoute === "DAE" ? "Market research" : activeRoute === "BR" ? "Business rules" : "Connected data"}
              </span>
            ) : null}
            {questions.length > 1 ? (
              <JumpToQuestion
                questions={questions}
                onJump={(messageId) => messageRefs.current.get(messageId)?.scrollIntoView({ behavior: "smooth", block: "start" })}
              />
            ) : null}
          </div>
        ) : null}
      </header>

      <div className="flex min-h-0 flex-1 flex-col bg-white">
        {bootstrapError ? (
          <div className="mx-3 mt-3 flex items-start gap-3 rounded-xl border border-danger/20 bg-danger/5 px-3 py-2.5 text-[11px] leading-4 text-content sm:mx-4">
            <span className="min-w-0 flex-1"><strong className="block text-danger">Connected sources could not be prepared</strong>{bootstrapError}</span>
            <button type="button" onClick={onRetryBootstrap} className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-danger/20 bg-surface px-2 py-1 font-bold text-danger hover:bg-danger/5">
              <RefreshCw className="h-3 w-3" aria-hidden="true" />Retry
            </button>
          </div>
        ) : null}

        <div className="chat-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
          <div className="space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                ref={(node) => {
                  if (node) messageRefs.current.set(message.id, node);
                  else messageRefs.current.delete(message.id);
                }}
                className="scroll-mt-4"
              >
                <ChatMessage message={message} onAsk={onSend} />
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <ChatComposer
          value={inputValue}
          isSending={isSending}
          disabled={bootstrapStatus !== "ready"}
          onChange={onInputChange}
          onSend={() => onSend()}
        />
      </div>
    </aside>
  );
}
