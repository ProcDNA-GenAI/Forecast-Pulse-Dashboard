import type { ReactNode } from "react";

export function AiSummaryPanel({
  title,
  subtitle,
  summary,
}: {
  title: string;
  subtitle: string;
  summary: ReactNode;
}) {
  return (
    <section className="mt-4 rounded-2xl border border-[#e2e0ee] bg-[linear-gradient(180deg,#eef2fb,#f6f4fb)] px-5 py-[18px]">
      <div className="mb-1 flex items-center gap-2.5">
        <span className="rounded-[7px] bg-violet px-2.5 py-1 text-[10px] font-bold tracking-[0.05em] text-white">
          AI SUMMARY
        </span>
        <h2 className="m-0 text-base font-bold text-content">{title}</h2>
      </div>
      <p className="mb-3 mt-0 text-[12.5px] text-muted">{subtitle}</p>
      <div className="text-[13.5px] leading-[1.55] text-[#3a434b]">{summary}</div>
    </section>
  );
}
