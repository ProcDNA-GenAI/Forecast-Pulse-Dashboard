"use client";

import { useState } from "react";
import { AiSummaryPanel, SummaryColumn, SummaryFlag, SummarySignal } from "@/components/dashboard/AiSummaryPanel";
import { PageIntro } from "@/components/dashboard/PageIntro";
import {
  ComplianceCard,
  DemandCard,
  NpsMarketShareCard,
  PatientInflowCard,
  PersistencyCard,
  PrescriberCard,
  ProductMixCard,
  TrendCard,
} from "./MarketIndicatorCards";
import { formatPercent, latestComparison, latestPoint } from "@/utils/dashboard/formatters";
import type { DashboardData } from "@/utils/dashboard/types";
import { FORECAST_LABEL, FORECAST_REFRESH_PERIOD } from "@/utils/dashboard/periods";

function IndicatorsSummary({ data }: { data: DashboardData }) {
  const share = latestComparison(data.npsShare);
  const shareVariance = share.actual - share.forecast;
  const firstHcp = data.activeHcp[0];
  const lastHcp = latestPoint(data.activeHcp);
  const hcpGrowth = lastHcp.value / firstHcp.value - 1;
  const demand = latestComparison(data.demand);
  const demandGrowth = demand.actual / demand.forecast - 1;
  const firstInflow = data.inflow[0];
  const lastInflow = data.inflow.at(-1);
  const persistency = latestComparison(data.persistency);

  if (!firstInflow || !lastInflow) {
    throw new Error("Patient inflow data is required for the indicator summary.");
  }

  return (
    <AiSummaryPanel
      title="What the market indicators show"
      subtitle="Auto-generated synthesis of the tiles above — observations only."
      summary={
        <p className="m-0">
          {data.meta.productName}&apos;s NPS market share is running slightly above the {FORECAST_LABEL.toLowerCase()} curve ({formatPercent(share.actual, 1)} actual
          vs {formatPercent(share.forecast, 1)} forecast at {share.label}). The advanced-LLT patient pool is expanding and the
          active HCP universe is broadening ({firstHcp.value.toLocaleString()} → {lastHcp.value.toLocaleString()}). Most
          new starts are switches from other advanced brands (~{formatPercent(lastInflow.switchFromAdvanced, 0)}), while
          newly-intensified starts are rising ({formatPercent(firstInflow.newlyIntensified, 0)} →{" "}
          {formatPercent(lastInflow.newlyIntensified, 0)}). Persistency and new-patient demand are tracking ahead of forecast.
        </p>
      }
    >
      <SummaryColumn label="Top signals">
        <SummarySignal
          direction="up"
          title="NPS share ahead of forecast"
          description={`Actuals above ${FORECAST_LABEL.toLowerCase()} through ${share.label}.`}
          value={`+${(shareVariance * 100).toFixed(1)} pp`}
          valueClassName="text-success"
        />
        <SummarySignal
          direction="up"
          title="Prescriber base broadening"
          description={`Active HCP universe ${firstHcp.value.toLocaleString()} → ${lastHcp.value.toLocaleString()} in six months.`}
          value={`+${formatPercent(hcpGrowth, 0)}`}
          valueClassName="text-success"
        />
        <SummarySignal
          direction="up"
          title="Demand ahead of forecast"
          description="New-patient starts running above the forecast line."
          value={`~+${formatPercent(demandGrowth, 0)}`}
          valueClassName="text-success"
        />
      </SummaryColumn>
      <SummaryColumn label="Notes">
        <SummaryFlag name="Switch-heavy inflow" value={`~${formatPercent(lastInflow.switchFromAdvanced, 0)} from advanced brands`} />
        <SummaryFlag
          name="Newly-intensified rising"
          value={`${formatPercent(firstInflow.newlyIntensified, 0)} → ${formatPercent(lastInflow.newlyIntensified, 0)}`}
        />
        <SummaryFlag
          name="Persistency vs forecast"
          value={`+${((persistency.actual - persistency.forecast) * 100).toFixed(0)} pt at ${persistency.label}`}
          valueClassName="text-success"
        />
      </SummaryColumn>
    </AiSummaryPanel>
  );
}

export function MarketIndicatorsDashboard({ data }: { data: DashboardData }) {
  const [activeView, setActiveView] = useState<"market" | "launch">("market");

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

      {activeView === "market" ? (
        <section role="tabpanel" aria-label="Market Intelligence" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <ProductMixCard points={data.productMix} />
            <NpsMarketShareCard points={data.npsShare} productName={data.meta.productName} />
          </div>
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
            <DemandCard points={data.demand} />
            <PrescriberCard points={data.prescribers} />
          </div>
        </section>
      )}

      <IndicatorsSummary data={data} />

      <footer className="mt-5 border-t border-border pt-3 text-[11.5px] text-muted">
        Data as of 18 Aug 2026 · all comparisons vs. Forecast ({FORECAST_REFRESH_PERIOD}) · next refresh 25 Aug 2026 ·
        illustrative mock data
      </footer>
    </>
  );
}
