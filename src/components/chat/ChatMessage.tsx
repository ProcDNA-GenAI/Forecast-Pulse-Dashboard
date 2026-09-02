"use client";

import { Bot } from "lucide-react";
import { useEffect, useState } from "react";
import type { ChatMessage as ChatMessageModel } from "@/utils/chat/types";

const allowedTags = new Set([
  "a",
  "blockquote",
  "br",
  "code",
  "div",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "li",
  "ol",
  "p",
  "pre",
  "span",
  "strong",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "ul",
]);

const removedTags = new Set([
  "button",
  "embed",
  "form",
  "iframe",
  "input",
  "link",
  "meta",
  "object",
  "script",
  "style",
]);

function isSafeLink(href: string) {
  return (
    href.startsWith("https://") ||
    href.startsWith("http://") ||
    href.startsWith("mailto:") ||
    href.startsWith("/") ||
    href.startsWith("#")
  );
}

function sanitizeAssistantHtml(content: string) {
  const parsedDocument = new DOMParser().parseFromString(content, "text/html");
  const elements = Array.from(parsedDocument.body.querySelectorAll("*"));

  elements.forEach((element) => {
    const tagName = element.tagName.toLowerCase();

    if (removedTags.has(tagName)) {
      element.remove();
      return;
    }

    if (!allowedTags.has(tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      return;
    }

    Array.from(element.attributes).forEach((attribute) => {
      if (tagName !== "a" || attribute.name.toLowerCase() !== "href") {
        element.removeAttribute(attribute.name);
      }
    });

    if (tagName === "a") {
      const href = element.getAttribute("href")?.trim() ?? "";

      if (!isSafeLink(href)) {
        element.removeAttribute("href");
      } else {
        element.setAttribute("rel", "noopener noreferrer");
        element.setAttribute("target", "_blank");
      }
    }
  });

  return parsedDocument.body.innerHTML;
}

function AssistantHtml({ content }: { content: string }) {
  const [sanitizedHtml, setSanitizedHtml] = useState<string | null>(null);

  useEffect(() => {
    setSanitizedHtml(sanitizeAssistantHtml(content));
  }, [content]);

  if (sanitizedHtml === null) {
    return <span className="whitespace-pre-wrap">{content}</span>;
  }

  return <div className="chat-rich-text" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
}

export function ChatMessage({ message }: { message: ChatMessageModel }) {
  const isAssistant = message.role === "assistant";

  return (
    <div className={`flex items-end gap-2 ${isAssistant ? "justify-start" : "justify-end"}`}>
      {isAssistant ? (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm">
          <Bot aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
        </span>
      ) : null}

      <div
        className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-[1.55] shadow-sm ${
          isAssistant
            ? "rounded-bl-md border border-border bg-surface text-content"
            : "rounded-br-md bg-primary text-white"
        }`}
      >
        {message.contentType === "html" ? (
          <AssistantHtml content={message.content} />
        ) : (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        )}
      </div>
    </div>
  );
}

export function ChatThinkingMessage() {
  return (
    <div className="flex items-end gap-2" role="status" aria-label="Chat Assistant is thinking">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm">
        <Bot aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
      </span>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-border bg-surface px-4 py-3 shadow-sm">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            aria-hidden="true"
            className="chat-thinking-dot h-1.5 w-1.5 rounded-full bg-secondary"
            style={{ animationDelay: `${index * 130}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
