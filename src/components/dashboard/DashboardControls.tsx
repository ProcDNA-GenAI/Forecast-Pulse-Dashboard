import type { ReactNode } from "react";

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
  label: string;
};

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  label,
}: SegmentedControlProps<T>) {
  return (
    <div className="inline-flex shrink-0 gap-0.5 rounded-full bg-[#eef0f0] p-[3px]" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={`cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
            value === option.value ? "bg-secondary text-white" : "text-[#6b6a64] hover:text-content"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function MiniButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer whitespace-nowrap rounded-full border border-border bg-page px-[11px] py-1 text-[11px] text-[#5f5e5a] transition-colors hover:border-secondary hover:text-secondary"
    >
      {children}
    </button>
  );
}

export function DataTag({ children }: { children: ReactNode }) {
  return (
    <span className="whitespace-nowrap rounded-full border border-border px-[7px] py-0.5 text-[9px] font-bold uppercase tracking-[0.04em] text-[#b0aea5]">
      {children}
    </span>
  );
}

export function LegendItem({
  label,
  color,
  kind = "swatch",
  dashed = false,
}: {
  label: ReactNode;
  color: string;
  kind?: "swatch" | "line";
  dashed?: boolean;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className={kind === "line" ? "w-4 border-t-2" : "h-[11px] w-[11px] rounded-sm"}
        style={
          kind === "line"
            ? { borderColor: color, borderTopStyle: dashed ? "dashed" : "solid" }
            : { backgroundColor: color }
        }
      />
      {label}
    </span>
  );
}

export function Legend({ children }: { children: ReactNode }) {
  return <div className="mb-0.5 mt-2 flex flex-wrap gap-x-3.5 gap-y-1.5 text-xs text-muted">{children}</div>;
}
