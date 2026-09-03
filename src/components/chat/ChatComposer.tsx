"use client";

import { ArrowUp, Sparkles } from "lucide-react";
import { useEffect, useRef, type FormEvent, type KeyboardEvent } from "react";

type ChatComposerProps = {
  value: string;
  isSending: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
};

export function ChatComposer({ value, isSending, disabled = false, onChange, onSend }: ChatComposerProps) {
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

  const cannotSend = value.trim().length === 0 || isSending || disabled;

  return (
    <form onSubmit={submit} className="border-t border-primary/10 bg-surface/95 px-3 pb-3 pt-3 backdrop-blur-md sm:px-4 sm:pb-4">
      <div className="rounded-[1.35rem] border border-primary/15 bg-[linear-gradient(180deg,#ffffff_0%,#f4f8fc_100%)] px-3 py-2.5 pl-4 shadow-[0_10px_28px_rgba(8,50,96,0.09)] transition focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/10">
        <div className="flex items-end gap-2.5">
          <Sparkles className="mb-2.5 h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending || disabled}
            rows={1}
            placeholder="What would you like to know?"
            aria-label="Message Chat Assistant"
            className="block min-h-10 max-h-32 flex-1 resize-none bg-transparent py-2 text-[13px] leading-5 text-content outline-none placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={cannotSend}
            aria-label="Send message"
            title="Send message"
            className="mb-0.5 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-white shadow-[0_8px_18px_rgba(8,50,96,0.22)] transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-35"
          >
            {isSending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
            ) : (
              <ArrowUp aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={2.2} />
            )}
          </button>
        </div>
      </div>
      <p className="mt-2 text-center text-[9px] text-muted">Enter to send · Shift + Enter for a new line · Responses may require verification</p>
    </form>
  );
}
