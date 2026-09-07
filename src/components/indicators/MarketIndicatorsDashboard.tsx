"use client";

import { useState } from "react";
import { BarChart3, Rocket } from "lucide-react";
import { AiSummaryPanel } from "@/components/dashboard/AiSummaryPanel";
import { PageIntro } from "@/components/dashboard/PageIntro";
import {
  ComplianceCard,
  NpsMarketShareCard,
  PatientInflowCard,
  PersistencyCard,
  PrescriberCard,
  ProductMixCard,
  TrendCard,
} from "./MarketIndicatorCards";
import { formatPercent, latestComparison, latestPoint } from "@/utils/dashboard/formatters";
import type { DashboardData } from "@/utils/dashboard/types";
import { FORECAST_LABEL } from "@/utils/dashboard/periods";

type IndicatorView = "market" | "launch";

function IndicatorsSummary({ data, activeView }: { data: DashboardData; activeView: IndicatorView }) {
  const share = latestComparison(data.npsShare);
  const firstMix = data.productMix[0];
  const lastMix = data.productMix.at(-1);
  const firstHcp = data.activeHcp[0];
  const lastHcp = latestPoint(data.activeHcp);
  const lastInflow = data.inflow.at(-1);
  const persistency = latestComparison(data.persistency);
  const compliance = latestComparison(data.compliance);

  if (!firstMix || !lastMix || !firstHcp || !lastInflow) {
    throw new Error("Market indicator data is required for Key Insights.");
  }

  return (
    <AiSummaryPanel
      summary={
        <ul className="m-0 list-disc space-y-2 pl-5">
          {activeView === "market" ? (
            <>
              <li>
                The advanced LLT patient pool changed from {firstMix.totalPatientsMillions.toFixed(2)}M in {firstMix.label} to {lastMix.totalPatientsMillions.toFixed(2)}M in {lastMix.label}.
              </li>
              <li>
                The active HCP universe increased from {firstHcp.value.toLocaleString()} in {firstHcp.label} to {lastHcp.value.toLocaleString()} in {lastHcp.label}.
              </li>
            </>
          ) : (
            <>
              <li>
                {data.meta.productName}&apos;s NPS market share is {formatPercent(share.actual, 1)} compared with {formatPercent(share.forecast, 1)} in the {FORECAST_LABEL} at {share.label}.
              </li>
              <li>
                At {lastInflow.label}, {formatPercent(lastInflow.switchFromAdvanced, 0)} of starts are switches from other advanced brands and {formatPercent(lastInflow.newlyIntensified, 0)} are newly intensified.
              </li>
              <li>
                Persistency is {formatPercent(persistency.actual, 0)} compared with {formatPercent(persistency.forecast, 0)} in the {FORECAST_LABEL} at {persistency.label}. Compliance is {formatPercent(compliance.actual, 0)} compared with {formatPercent(compliance.forecast, 0)} at {compliance.label}.
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
        title="Market Intelligence Detail"
        description={`Explore market-level trends and ${data.meta.productName} launch performance in two focused views.`}
      />

      <div className="mb-4 rounded-[18px] border border-[#dfe5ee] bg-white p-1.5 shadow-[0_5px_20px_rgba(47,84,149,0.06)]">
        <div className="grid grid-cols-2 gap-1.5 rounded-[14px] bg-[#f0f3f7] p-1" role="tablist" aria-label="Market intelligence views">
          {[
            { id: "market" as const, label: "Market Intelligence", description: "Market-level trends", icon: BarChart3 },
            { id: "launch" as const, label: `${data.meta.productName} launch tracking`, description: "Product performance", icon: Rocket },
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
        <IndicatorsSummary data={data} activeView={activeView} />
      </div>

      <section className="mt-5 rounded-[18px] border border-border bg-white p-4 sm:p-5">
        <h2 className="mb-4 text-xl font-bold text-primary">Key Market Indicators</h2>

        {activeView === "market" ? (
          <div role="tabpanel" aria-label="Market Intelligence" className="grid gap-4 lg:grid-cols-2">
            <ProductMixCard points={data.productMix} />
            <TrendCard
              title="Active HCP universe"
              points={data.activeHcp}
              colorToken="teal"
              valueLabel={(value) => `${Math.round(value).toLocaleString()} HCPs`}
              tickLabel={(value) => `${(value / 1000).toFixed(1)}k`}
              yAxisLabel="Active HCPs"
            />
          </div>
        ) : (
          <div role="tabpanel" aria-label={`${data.meta.productName} launch tracking`} className="space-y-4">
            <PatientInflowCard points={data.inflow} productName={data.meta.productName} />
            <div className="grid gap-4 lg:grid-cols-2">
              <PersistencyCard points={data.persistency} productName={data.meta.productName} />
              <ComplianceCard points={data.compliance} productName={data.meta.productName} />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <NpsMarketShareCard points={data.npsShare} productName={data.meta.productName} />
              <PrescriberCard points={data.prescribers} />
            </div>
          </div>
        )}
      </section>
    </>
  );
}
