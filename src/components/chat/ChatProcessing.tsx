"use client";

import { Check, ChevronDown, Circle, LoaderCircle } from "lucide-react";
import { useEffect, useId, useState } from "react";
import type { ProcessingStep } from "@/utils/chat/types";

function stepLabel(step: ProcessingStep) {
  return step.title?.trim() || step.message.trim() || step.stage;
}

export function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="chat-thinking-dot h-1.5 w-1.5 rounded-full bg-secondary"
          style={{ animationDelay: `${index * 130}ms` }}
        />
      ))}
    </span>
  );
}

export function DocumentProcessing({ steps }: { steps: ProcessingStep[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const contentId = useId();
  const activeStep = steps.at(-1);
  const status = activeStep ? stepLabel(activeStep) : "Preparing InsightSphere";

  return (
    <section role="status" aria-live="polite" className="w-fit max-w-[min(22rem,calc(100vw-5.5rem))] overflow-hidden rounded-2xl rounded-tl-sm border border-primary/10 bg-surface shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-left"
      >
        <ThinkingDots />
        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-primary">{status}</span>
        {steps.length > 1 ? (
          <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-muted transition ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
        ) : null}
      </button>

      {isOpen && steps.length > 1 ? (
        <div id={contentId} className="space-y-2 border-t border-primary/10 px-3.5 py-2.5">
          {steps.map((step, index) => {
            const isCurrent = index === steps.length - 1;
            return (
              <div key={`${step.node}-${step.step}-${index}`} className="flex items-center gap-2 text-[11px] leading-4 text-content">
                {isCurrent ? (
                  <LoaderCircle className="h-3.5 w-3.5 shrink-0 animate-spin text-secondary" aria-hidden="true" />
                ) : (
                  <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-success text-white">
                    <Check className="h-2.5 w-2.5" aria-hidden="true" />
                  </span>
                )}
                <span className={isCurrent ? "font-semibold" : "text-muted"}>{stepLabel(step)}</span>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

export function ChatProcessing({
  steps,
  isStreaming,
  confidenceScore,
  confidenceReason,
}: {
  steps: ProcessingStep[];
  isStreaming: boolean;
  confidenceScore?: number | null;
  confidenceReason?: string | null;
}) {
  const [isOpen, setIsOpen] = useState(isStreaming);
  const contentId = useId();

  useEffect(() => {
    if (!isStreaming) setIsOpen(false);
  }, [isStreaming]);

  if (!steps.length) {
    return isStreaming ? (
      <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold text-muted">
        <ThinkingDots />
        Thinking
      </div>
    ) : null;
  }

  const completed = steps.filter((step) => step.status === "complete").length;
  const confidence = typeof confidenceScore === "number"
    ? Math.max(0, Math.min(100, Math.round(confidenceScore * 100)))
    : null;

  return (
    <section className="mb-3 overflow-hidden rounded-xl border border-primary/10 bg-primary/[0.035]">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className="flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left"
      >
        {isStreaming ? (
          <LoaderCircle className="h-4 w-4 shrink-0 animate-spin text-secondary" aria-hidden="true" />
        ) : (
          <Check className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-bold text-primary">
            {isStreaming ? "Thinking" : "Thinking complete"}
          </span>
          <span className="block truncate text-[10px] text-muted">
            {completed || steps.length} completed steps
            {confidence === null ? "" : ` · ${confidence}% confidence`}
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 text-primary transition ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {isOpen ? (
        <div id={contentId} className="space-y-2 border-t border-primary/10 px-3 py-3">
          {steps.map((step, index) => (
            <div key={`${step.node}-${step.step}-${index}`} className="flex gap-2.5 text-[11px] leading-4 text-content">
              <span className="mt-0.5 shrink-0">
                {step.status === "complete" ? (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-success text-white">
                    <Check className="h-2.5 w-2.5" aria-hidden="true" />
                  </span>
                ) : step.status === "error" ? (
                  <Circle className="h-4 w-4 text-danger" aria-hidden="true" />
                ) : (
                  <LoaderCircle className="h-4 w-4 animate-spin text-secondary" aria-hidden="true" />
                )}
              </span>
              <span>
                <span className="font-semibold">{stepLabel(step)}</span>
                {step.detail && step.detail !== step.message ? (
                  <span className="mt-0.5 block text-muted">{step.detail}</span>
                ) : null}
              </span>
            </div>
          ))}

          {!isStreaming && confidence !== null ? (
            <div className="mt-3 rounded-lg bg-surface px-3 py-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-content">
                <span>Answer confidence</span>
                <span className="text-primary">{confidence}%</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-primary/10">
                <div className="h-full rounded-full bg-secondary" style={{ width: `${confidence}%` }} />
              </div>
              {confidenceReason ? <p className="mt-2 text-[10px] leading-4 text-muted">{confidenceReason}</p> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
