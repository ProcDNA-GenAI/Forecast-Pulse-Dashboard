"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDashboard, type TimeBucket } from "./DashboardProvider";

const tabs = [
  { href: "/", label: "Executive Summary" },
  { href: "/key-market-indicators", label: "Key Market Indicators" },
];

const buckets: TimeBucket[] = ["QYD", "YTD", "LTD"];

export function DashboardHeader() {
  const pathname = usePathname();
  const { bucket, setBucket } = useDashboard();

  return (
    <header className="sticky top-0 z-50 text-white shadow-[0_1px_0_rgba(0,0,0,0.08)]">
      <div className="bg-primary px-4 pt-3 sm:px-6">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-[17px] font-semibold">
            NewAmsterdam Pharma · Pre-Launch Market Intelligence
            <span className="ml-2 text-xs font-normal text-[#b9d0e8]">
              Obicetrapib (Obi) | LDL-C
            </span>
          </span>
          <span className="ml-auto text-xs text-[#b9d0e8]">
            Data as of 18 Aug 2026 · vs. Launch Plan
          </span>
        </div>

        <nav aria-label="Dashboard sections" className="mt-3 flex flex-wrap gap-0.5">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-t-lg px-4 py-2.5 text-[13px] font-medium transition-colors sm:px-[18px] ${
                  isActive
                    ? "bg-page font-semibold text-primary"
                    : "text-[#c7dcf0] hover:text-white"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-[#0a3a6b] px-4 py-2.5 text-xs text-[#cfe0f2] sm:px-6">
        <span>Time bucket</span>
        <div className="inline-flex gap-0.5 rounded-full bg-[#083260] p-[3px]" aria-label="Time bucket">
          {buckets.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setBucket(item)}
              aria-pressed={bucket === item}
              className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                bucket === item ? "bg-accent text-[#3a2e00]" : "text-[#9fc0e0] hover:text-white"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <span className="ml-auto hidden text-right lg:block">
          QYD quarter-to-date · YTD year-to-date · LTD launch-to-date · applies to time-series tiles only
        </span>
      </div>
    </header>
  );
}
