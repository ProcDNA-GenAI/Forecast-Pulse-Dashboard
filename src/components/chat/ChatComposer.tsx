"use client";

import { SendHorizontal } from "lucide-react";
import { useEffect, useRef, type FormEvent, type KeyboardEvent } from "react";

type ChatComposerProps = {
  value: string;
  isSending: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
};

export function ChatComposer({ value, isSending, onChange, onSend }: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
  }, [value]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSend();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  const cannotSend = value.trim().length === 0 || isSending;

  return (
    <form onSubmit={submit} className="border-t border-border bg-surface/95 p-3 backdrop-blur-sm sm:p-4">
      <div className="relative rounded-2xl border border-border bg-page/60 shadow-[0_8px_24px_rgba(8,50,96,0.07)] transition focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/10">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSending}
          rows={1}
          placeholder="Ask about the dashboard..."
          aria-label="Message Chat Assistant"
          className="block min-h-14 max-h-32 w-full resize-none bg-transparent py-4 pl-4 pr-14 text-[13px] leading-5 text-content outline-none placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-70"
        />
        <button
          type="submit"
          disabled={cannotSend}
          aria-label="Send message"
          title="Send message"
          className="absolute bottom-2.5 right-2.5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-primary text-white shadow-sm transition hover:bg-secondary hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-35"
        >
          <SendHorizontal aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={2.2} />
        </button>
      </div>
      <p className="mt-2 text-center text-[10px] text-muted">Enter to send · Shift + Enter for a new line</p>
    </form>
  );
}
