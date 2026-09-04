"use client";

import { Bot, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useChatAssistant } from "@/hooks/useChatAssistant";
import { ChatAssistantPanel } from "./ChatAssistantPanel";

export function ChatAssistant({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const chat = useChatAssistant();

  const closeAssistant = useCallback(() => {
    setIsOpen(false);
    requestAnimationFrame(() => launcherRef.current?.focus());
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) closeAssistant();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [closeAssistant, isOpen]);

  return (
    <div className="min-h-screen overflow-x-clip">
      <div className={`min-w-0 transition-[margin-right] duration-300 ease-out ${isOpen ? "xl:mr-[38vw]" : ""}`}>
        {children}
      </div>

      {isOpen ? (
        <>
          <button type="button" tabIndex={-1} aria-label="Close Chat Assistant" onClick={closeAssistant} className="fixed inset-0 z-[65] cursor-pointer bg-primary-deep/25 backdrop-blur-[1px] xl:hidden" />
          <ChatAssistantPanel
            messages={chat.messages}
            inputValue={chat.inputValue}
            isSending={chat.isSending}
            activeRoute={chat.activeRoute}
            bootstrapData={chat.bootstrapData}
            bootstrapError={chat.bootstrapError}
            bootstrapStatus={chat.bootstrapStatus}
            onInputChange={chat.setInputValue}
            onSend={(question) => void chat.sendMessage(question)}
            onNewConversation={chat.startNewConversation}
            onRetryBootstrap={chat.reloadBootstrap}
            onClose={closeAssistant}
          />
        </>
      ) : (
        <button
          ref={launcherRef}
          type="button"
          onClick={() => setIsOpen(true)}
          aria-expanded="false"
          aria-controls="chat-assistant-panel"
          className="chat-launcher-enter group fixed bottom-5 right-5 z-[60] flex cursor-pointer items-center gap-2.5 rounded-2xl border border-white/20 bg-primary px-3.5 py-3 text-white shadow-[0_12px_34px_rgba(8,50,96,0.3)] transition hover:-translate-y-0.5 hover:bg-secondary hover:shadow-[0_16px_38px_rgba(8,50,96,0.34)] focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 sm:bottom-6 sm:right-6 sm:px-4"
        >
          <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-primary-deep shadow-sm transition-transform group-hover:scale-105">
            <Bot aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={2.2} />
            <Sparkles aria-hidden="true" className="absolute -right-1 -top-1 h-3 w-3 text-white" fill="currentColor" />
          </span>
          <span className="text-[13px] font-bold tracking-[0.01em]">AI Assistant</span>
        </button>
      )}
    </div>
  );
}
