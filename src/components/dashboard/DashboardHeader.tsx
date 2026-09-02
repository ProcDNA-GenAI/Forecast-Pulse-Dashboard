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
    <header className="sticky top-0 z-50 isolate text-white shadow-[0_5px_18px_rgba(8,50,96,0.14)]">
      <div className="bg-gradient-to-r from-primary via-primary to-secondary px-4 pt-3 sm:px-6">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-[17px] font-semibold">
            NewAmsterdam Pharma · Pre-Launch Market Intelligence
            <span className="ml-2 text-xs font-normal text-primary-soft">
              Obicetrapib (Obi) | LDL-C
            </span>
          </span>
          <span className="ml-auto text-xs text-primary-soft">
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
                    : "text-primary-soft hover:text-white"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-white/10 bg-primary-deep px-4 py-2.5 text-xs text-primary-soft sm:px-6">
        <span>Time bucket</span>
        <div className="inline-flex gap-0.5 rounded-full bg-black/10 p-[3px] shadow-inner" aria-label="Time bucket">
          {buckets.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setBucket(item)}
              aria-pressed={bucket === item}
              className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                bucket === item ? "bg-accent text-[#3a2e00] shadow-sm" : "text-primary-soft hover:text-white"
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
