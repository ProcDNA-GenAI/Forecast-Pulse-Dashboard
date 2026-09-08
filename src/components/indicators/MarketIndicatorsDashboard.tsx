"use client";

import { useState } from "react";
import { BarChart3, Rocket } from "lucide-react";
import { AiSummaryPanel } from "@/components/dashboard/AiSummaryPanel";
import { PageIntro } from "@/components/dashboard/PageIntro";
import {
  ComplianceCard,
  EscalationTimeCard,
  NpsMarketShareCard,
  PatientInflowCard,
  PersistencyCard,
  PrescriberCard,
  PrescriberGrowthCard,
  ProductMixCard,
  TrendCard,
} from "./MarketIndicatorCards";
import type { DashboardData } from "@/utils/dashboard/types";
import { formatDecimal } from "@/utils/dashboard/formatters";

type IndicatorView = "market" | "launch";

function IndicatorsSummary({ activeView }: { activeView: IndicatorView }) {
  return (
    <AiSummaryPanel
      summary={
        <ul className="m-0 list-disc space-y-2 pl-5">
          {activeView === "market" ? (
            <>
              <li>
                The advanced LLT pool has expanded steadily, increasing the population potentially eligible for Obi ahead of launch.
                <span className="mt-1 block">+23% since Jan &apos;25 | 1.11M patients | +8% vs. Sep &apos;26 forecast</span>
              </li>
              <li>
                The active prescriber universe is expanding, suggesting a broader pool of HCPs to engage ahead of launch.
              </li>
              <li>
                Lipfendra is gaining share slightly faster than expected, indicating early competitive momentum ahead of Obi&apos;s launch.
              </li>
            </>
          ) : (
            <>
              <li>
                Lipfendra is gaining share ahead of plan, reaching 10.4% in December versus 10.0% forecast.
              </li>
              <li>
                Early patient retention is stronger than expected, with M6 persistence 7pp above forecast, supporting sustained uptake.
              </li>
              <li>
                Patient acquisition remains heavily dependent on switching from existing advanced therapies, highlighting competitive conversion as a critical launch lever.
              </li>
              <li>
                Prescriber breadth is expanding, but depth remains concentrated, suggesting an opportunity to convert broader HCP engagement into repeat prescribing.
              </li>
            </>
          )}
        </ul>
      }
    />
  );
}

export function MarketIndicatorsDashboard({ data }: { data: DashboardData }) {
  const [activeView, setActiveView] = useState<IndicatorView>("market");

  return (
    <>
      <PageIntro
        title="Key Market Indicators"
        description="Explore market-level dynamics and Lipfendra launch performance through key patient, prescriber, and product indicators."
      />

      <div className="mb-4 rounded-[18px] border border-[#dfe5ee] bg-white p-1.5 shadow-[0_5px_20px_rgba(47,84,149,0.06)]">
        <div className="grid grid-cols-2 gap-1.5 rounded-[14px] bg-[#f0f3f7] p-1" role="tablist" aria-label="Market intelligence views">
          {[
            { id: "market" as const, label: "Market Intelligence", description: "Market-Level Trends", icon: BarChart3 },
            { id: "launch" as const, label: `${data.meta.productName} Launch Tracking`, description: "Product Performance", icon: Rocket },
          ].map((view) => {
            const ViewIcon = view.icon;

            return (
              <button
              key={view.id}
              type="button"
              role="tab"
              aria-selected={activeView === view.id}
              onClick={() => setActiveView(view.id)}
              className={`group relative flex cursor-pointer items-center gap-3 overflow-hidden rounded-[11px] px-3 py-2.5 text-left transition-all duration-200 sm:px-5 ${
                activeView === view.id
                  ? "bg-primary text-white shadow-[0_5px_14px_rgba(47,84,149,0.2)]"
                  : "bg-transparent text-muted hover:bg-white hover:text-primary"
              }`}
            >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${activeView === view.id ? "bg-white/14 text-white" : "bg-white text-primary shadow-sm"}`}>
                  <ViewIcon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-bold sm:text-sm">{view.label}</span>
                  <span className={`mt-0.5 hidden text-[10px] sm:block ${activeView === view.id ? "text-white/75" : "text-muted"}`}>
                    {view.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-4">
        <IndicatorsSummary activeView={activeView} />
      </div>

      <section className="mt-5 rounded-[18px] border border-border bg-white p-4 sm:p-5">
        <h2 className="mb-4 text-xl font-bold text-primary">
          {activeView === "market" ? "Market Intelligence" : `${data.meta.productName} Launch Tracking`}
        </h2>

        {activeView === "market" ? (
          <div role="tabpanel" aria-label="Market Intelligence" className="grid gap-4 lg:grid-cols-2">
            <ProductMixCard points={data.productMix} />
            <TrendCard
              title="Active HCP Universe"
              points={data.activeHcp}
              colorToken="teal"
              valueLabel={(value) => `${Math.round(value).toLocaleString()} HCPs`}
              tickLabel={(value) => `${formatDecimal(value / 1000, 1)}k`}
              yAxisLabel="Active HCPs"
              yAxisMin={5000}
              yAxisMax={10000}
              yAxisStep={1000}
              chartHeightClassName="h-[242px]"
            />
          </div>
        ) : (
          <div role="tabpanel" aria-label={`${data.meta.productName} launch tracking`} className="space-y-4">
            <PatientInflowCard points={data.inflow} productName={data.meta.productName} />
            <div className="grid gap-4 lg:grid-cols-2">
              <PersistencyCard points={data.persistency} />
              <ComplianceCard points={data.compliance} productName={data.meta.productName} />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <NpsMarketShareCard points={data.npsShare} productName={data.meta.productName} />
              <PrescriberCard points={data.prescribers} />
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <PrescriberGrowthCard points={data.prescriberMonthly} />
              <EscalationTimeCard points={data.escalationTime} />
            </div>
            <p className="pt-1 text-[10.5px] text-muted">Forian Data as of 2026; IQVIA, NPA, Xponent as of Dec &apos;26</p>
          </div>
        )}
      </section>
    </>
  );
}
