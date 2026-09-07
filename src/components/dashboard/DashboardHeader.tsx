"use client";

import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DATA_AS_OF_PERIOD, FORECAST_LABEL } from "@/utils/dashboard/periods";
import { useDashboard, type TimeBucket } from "./DashboardProvider";

const buckets: TimeBucket[] = ["QTD", "YTD", "LTD"];

export function DashboardHeader() {
  const pathname = usePathname();
  const { bucket, setBucket } = useDashboard();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const showTimeBucket = pathname !== "/";

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-page/95 backdrop-blur-md">
      <div className="mx-auto flex min-h-[66px] max-w-[1540px] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-6 lg:px-7">
        <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <h1 className="m-0 text-lg font-bold leading-tight text-content sm:text-[23px]">
            Pre-Launch Market Intelligence
          </h1>
          <span className="hidden text-xs text-[#5f626a] md:inline sm:text-sm">(Obicetrapib (Obi) | LDL-C)</span>
        </div>
        <span className="hidden text-[10px] text-muted xl:inline">
          Data as of {DATA_AS_OF_PERIOD} · vs. {FORECAST_LABEL}
        </span>
        {showTimeBucket ? <div className="flex shrink-0 items-center gap-2.5 text-[11px] font-semibold text-content">
          <span className="hidden lg:inline">Time Bucket</span>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsOpen((current) => !current)}
              aria-haspopup="listbox"
              aria-expanded={isOpen}
              aria-label="Time bucket"
              className={`flex h-9 min-w-[92px] cursor-pointer items-center justify-between gap-3 rounded-lg border bg-white py-1 pl-3 pr-2.5 text-left text-xs font-semibold text-content shadow-[0_8px_22px_rgba(47,84,149,0.07)] outline-none transition sm:min-w-[118px] ${
                isOpen ? "border-primary ring-2 ring-primary/12" : "border-border hover:border-primary/40"
              }`}
            >
              <span>{bucket}</span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-primary transition-transform ${isOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
            {isOpen ? (
              <div
                role="listbox"
                aria-label="Time bucket"
                className="absolute right-0 top-[calc(100%+8px)] z-50 w-[132px] overflow-hidden rounded-xl border border-border bg-white p-1.5 shadow-[0_18px_42px_rgba(24,33,59,0.16)]"
              >
                {buckets.map((item) => (
                  <button
                    key={item}
                    type="button"
                    role="option"
                    aria-selected={bucket === item}
                    onClick={() => {
                      setBucket(item);
                      setIsOpen(false);
                    }}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold transition ${
                      bucket === item
                        ? "bg-primary text-white shadow-sm"
                        : "text-content hover:bg-primary-soft hover:text-primary"
                    }`}
                  >
                    {item}
                    {bucket === item ? <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" /> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div> : null}
      </div>
    </header>
  );
}
