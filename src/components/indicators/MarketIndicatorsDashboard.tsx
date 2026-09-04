"use client";

import { useState } from "react";
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
import { DATA_AS_OF_PERIOD, FORECAST_LABEL } from "@/utils/dashboard/periods";

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
        title="Market Intelligence"
        description={`Explore market-level trends and ${data.meta.productName} launch performance in two focused views.`}
      />

      <div className="mb-4 rounded-2xl border border-border bg-surface p-1.5 shadow-[0_4px_18px_rgba(8,50,96,0.06)]">
        <div className="grid grid-cols-2 gap-1" role="tablist" aria-label="Market intelligence views">
          {[
            { id: "market" as const, label: "Market Intelligence", description: "Market-level trends" },
            { id: "launch" as const, label: `${data.meta.productName} launch tracking`, description: "Product performance" },
          ].map((view) => (
            <button
              key={view.id}
              type="button"
              role="tab"
              aria-selected={activeView === view.id}
              onClick={() => setActiveView(view.id)}
              className={`cursor-pointer rounded-xl px-3 py-2.5 text-left transition-all sm:px-5 ${
                activeView === view.id
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted hover:bg-page hover:text-primary"
              }`}
            >
              <span className="block text-[13px] font-bold sm:text-sm">{view.label}</span>
              <span className={`mt-0.5 hidden text-[10px] sm:block ${activeView === view.id ? "text-primary-soft" : "text-muted"}`}>
                {view.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <IndicatorsSummary data={data} activeView={activeView} />
      </div>

      {activeView === "market" ? (
        <section role="tabpanel" aria-label="Market Intelligence" className="grid gap-4 lg:grid-cols-2">
          <ProductMixCard points={data.productMix} />
          <TrendCard
            title="Active HCP universe"
            points={data.activeHcp}
            colorToken="teal"
            valueLabel={(value) => `${Math.round(value).toLocaleString()} HCPs`}
            tickLabel={(value) => `${(value / 1000).toFixed(1)}k`}
          />
        </section>
      ) : (
        <section role="tabpanel" aria-label={`${data.meta.productName} launch tracking`} className="space-y-4">
          <PatientInflowCard points={data.inflow} productName={data.meta.productName} />
          <div className="grid gap-4 lg:grid-cols-2">
            <PersistencyCard points={data.persistency} productName={data.meta.productName} />
            <ComplianceCard points={data.compliance} productName={data.meta.productName} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <NpsMarketShareCard points={data.npsShare} productName={data.meta.productName} />
            <PrescriberCard points={data.prescribers} />
          </div>
        </section>
      )}

      <footer className="mt-5 border-t border-border pt-3 text-[11.5px] text-muted">
        Data as of {DATA_AS_OF_PERIOD} · all comparisons vs. {FORECAST_LABEL}
      </footer>
    </>
  );
}
