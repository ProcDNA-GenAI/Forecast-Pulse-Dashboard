"use client";

import { AiSummaryPanel, SummaryColumn, SummaryFlag, SummarySignal } from "@/components/dashboard/AiSummaryPanel";
import { PageIntro } from "@/components/dashboard/PageIntro";
import {
  DemandCard,
  NpsMarketShareCard,
  PatientInflowCard,
  PersistencyCard,
  PrescriberCard,
  ProductMixCard,
  TrendCard,
} from "./MarketIndicatorCards";
import { formatPercent, latestComparison, latestPoint } from "@/lib/dashboard/formatters";
import type { DashboardData } from "@/lib/dashboard/types";

function IndicatorBand({
  title,
  subtitle,
  variant = "market",
}: {
  title: string;
  subtitle: string;
  variant?: "market" | "launch";
}) {
  return (
    <div
      className={`mb-3 mt-6 flex items-baseline gap-3 rounded-lg border-l-4 px-4 py-[11px] ${
        variant === "market" ? "border-secondary bg-[#eaf1fb]" : "border-orange bg-[#fdf1e8]"
      }`}
    >
      <h2 className={`m-0 text-[15px] font-bold ${variant === "market" ? "text-primary" : "text-[#a54420]"}`}>
        {title}
      </h2>
      <span className="text-xs text-muted">{subtitle}</span>
    </div>
  );
}

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
          {data.meta.productName}&apos;s NPS market share is running above the forecast curve ({formatPercent(share.actual, 0)} observed
          vs {formatPercent(share.forecast, 0)} assumed at {share.label}). The advanced-LLT pool is expanding and the
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
          description={`Observed above the assumed curve through ${share.label}.`}
          value={`+${(shareVariance * 100).toFixed(0)} pt`}
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
  return (
    <>
      <PageIntro
        title="Market Intelligence Detail"
        description="Underlying market trends and launch tracking behind the executive summary."
      />

      <IndicatorBand title="Key Market Indicators" subtitle="market-level trends" />
      <div className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <ProductMixCard productName={data.meta.productName} />
          <NpsMarketShareCard points={data.npsShare} productName={data.meta.productName} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <TrendCard
            title="Advanced-LLT pool"
            points={data.advancedPool}
            colorToken="tertiary"
            valueLabel={(value) => `${value.toFixed(2)}M`}
            tickLabel={(value) => `${value.toFixed(2)}M`}
          />
          <TrendCard
            title="Active HCP universe"
            points={data.activeHcp}
            colorToken="teal"
            valueLabel={(value) => `${Math.round(value).toLocaleString()} HCPs`}
            tickLabel={(value) => `${(value / 1000).toFixed(1)}k`}
          />
        </div>
      </div>

      <IndicatorBand title="Launch Tracking" subtitle={`${data.meta.productName} as the live analog`} variant="launch" />
      <div className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <PatientInflowCard points={data.inflow} productName={data.meta.productName} />
          <PersistencyCard points={data.persistency} productName={data.meta.productName} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <DemandCard points={data.demand} />
          <PrescriberCard />
        </div>
      </div>

      <IndicatorsSummary data={data} />

      <footer className="mt-5 border-t border-border pt-3 text-[11.5px] text-muted">
        Data as of 18 Aug 2026 · all comparisons vs. approved Launch Plan (May 2026) · next refresh 25 Aug 2026 ·
        illustrative mock data
      </footer>
    </>
  );
}
