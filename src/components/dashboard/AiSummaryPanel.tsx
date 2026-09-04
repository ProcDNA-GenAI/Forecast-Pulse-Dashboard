import type { ReactNode } from "react";

export function AiSummaryPanel({ summary }: { summary: ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#e2e0ee] bg-[linear-gradient(180deg,#eef2fb,#f6f4fb)] px-5 py-[18px]">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="m-0 text-base font-bold text-content">Key Insights</h2>
        <span className="rounded-full border border-[#d9dde5] bg-[#eef0f3] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.04em] text-muted">
          AI generated
        </span>
      </div>
      <div className="text-[13.5px] leading-[1.55] text-[#3a434b]">{summary}</div>
    </section>
  );
}
