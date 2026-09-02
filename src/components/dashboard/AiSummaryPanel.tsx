import type { ReactNode } from "react";

export function AiSummaryPanel({
  title,
  subtitle,
  summary,
  children,
}: {
  title: string;
  subtitle: string;
  summary: ReactNode;
  children: ReactNode;
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
      <div className="mb-4 text-[13.5px] leading-[1.55] text-[#3a434b]">{summary}</div>
      <div className="grid gap-[22px] lg:grid-cols-[1.3fr_1fr]">{children}</div>
    </section>
  );
}

export function SummaryColumn({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.05em] text-muted">{label}</div>
      {children}
    </div>
  );
}

export function SummarySignal({
  direction,
  title,
  description,
  value,
  valueClassName,
}: {
  direction: "up" | "down";
  title: string;
  description: string;
  value: string;
  valueClassName: string;
}) {
  return (
    <div className="flex gap-3 border-b border-[#e6e4ee] py-2.5 last:border-b-0">
      <span
        aria-hidden="true"
        className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-[15px] font-extrabold ${
          direction === "up" ? "bg-[#e4f4ea] text-[#1d7a4d]" : "bg-[#fbe6e2] text-[#b23b2c]"
        }`}
      >
        {direction === "up" ? "↑" : "↓"}
      </span>
      <div className="min-w-0">
        <div className="text-[13.5px] font-semibold">{title}</div>
        <div className="text-xs text-[#5a636b]">{description}</div>
      </div>
      <div className={`ml-auto whitespace-nowrap text-[12.5px] font-bold ${valueClassName}`}>{value}</div>
    </div>
  );
}

export function SummaryFlag({
  name,
  value,
  dotClassName,
  valueClassName = "",
}: {
  name: string;
  value: string;
  dotClassName?: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-[#e6e4ee] py-2 text-[13px] last:border-b-0">
      {dotClassName ? <span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClassName}`} /> : null}
      <span className="font-semibold">{name}</span>
      <span className={`ml-auto text-right text-[12.5px] font-bold ${valueClassName}`}>{value}</span>
    </div>
  );
}
