"use client";

import { Send } from "lucide-react";
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
    <form onSubmit={submit} className="bg-white px-4 pb-6 pt-3 sm:px-5">
      <div className="rounded-full border border-[#dedfe3] bg-white px-3 py-1.5 pl-4 transition focus-within:border-primary/45 focus-within:ring-2 focus-within:ring-primary/10">
        <div className="flex items-end gap-2.5">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending || disabled}
            rows={1}
            placeholder="Ask Question"
            aria-label="Message Chat Assistant"
            className="block min-h-9 max-h-32 flex-1 resize-none bg-transparent py-2 text-[13px] leading-5 text-content outline-none placeholder:text-[#9b9da3] disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={cannotSend}
            aria-label="Send message"
            title="Send message"
            className="mb-0.5 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-primary transition hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-35"
          >
            {isSending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
            ) : (
              <Send aria-hidden="true" className="h-[19px] w-[19px] fill-primary" strokeWidth={1.8} />
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
