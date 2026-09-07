"use client";

import Image from "next/image";
import { useMemo, useState, type ReactNode } from "react";
import { MarketTrajectoryChart } from "@/components/charts/ExecutiveCharts";
import { AiSummaryPanel } from "@/components/dashboard/AiSummaryPanel";
import { CardHeader, DashboardCard } from "@/components/dashboard/DashboardCard";
import { DataTag, Legend, LegendItem, SegmentedControl } from "@/components/dashboard/DashboardControls";
import { PageIntro, SectionHeading } from "@/components/dashboard/PageIntro";
import {
  formatAssumptionValue,
  formatAssumptionVariance,
  formatMillions,
  formatPercent,
  formatPercentPoints,
  formatSignedPercent,
  latestPoint,
} from "@/utils/dashboard/formatters";
import {
  assumptionCounts,
  calculateCagr,
  largestSegmentMovers,
  marketPointForYear,
  segmentGroupLabel,
} from "@/utils/dashboard/selectors";
import type { Assumption, DashboardData, SegmentGroup } from "@/utils/dashboard/types";
import {
  ACTUALS_LABEL,
  ACTUALS_PERIOD,
  FORECAST_LABEL,
  FORECAST_REFRESH_PERIOD,
} from "@/utils/dashboard/periods";

type SegmentFilter = "all" | SegmentGroup;

const segmentOptions = [
  { value: "all", label: "All" },
  { value: "ascvd", label: "ASCVD" },
  { value: "ppt2d", label: "PP w/ T2D" },
  { value: "ppno", label: "PP w/o T2D" },
] satisfies Array<{ value: SegmentFilter; label: string }>;

const segmentGroupOrder: Record<SegmentGroup, number> = {
  ascvd: 0,
  ppt2d: 1,
  ppno: 2,
};

function MetricCard({
  label,
  value,
  valueSuffix,
  detail,
  detailClassName,
}: {
  label: string;
  value: string;
  valueSuffix?: string;
  detail?: ReactNode;
  detailClassName?: string;
}) {
  return (
    <section className="min-h-[118px] rounded-[16px] border border-white/70 bg-white/95 px-4 py-[15px] shadow-[0_5px_18px_rgba(47,84,149,0.055)] backdrop-blur-sm">
      <div className="text-xs text-muted">{label}</div>
      <div className="my-1.5 flex flex-wrap items-baseline gap-x-1.5 text-[27px] font-bold leading-none text-orange">
        {value}
        {valueSuffix ? <span className="text-[12px] font-semibold text-muted">{valueSuffix}</span> : null}
      </div>
      {detail ? (
        <div className="mt-2 border-t border-[#ededed] pt-2">
          <div className={`inline-flex w-fit max-w-full items-start gap-1 rounded-full bg-success/10 px-2 py-1 text-[11px] font-semibold leading-tight ${detailClassName || "text-success"}`}>
            <Image src="/UpArrowGreen.svg" alt="" width={11} height={11} className="mt-px h-[11px] w-[11px] shrink-0" />
            <span className="min-w-0 whitespace-normal break-words">{detail}</span>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function MarketSection({ data }: { data: DashboardData }) {
  const actualCagr = calculateCagr(data.market, "actual", 2027);
  const forecastCagr = calculateCagr(data.market, "forecast", 2027);
  const varianceYears = [2027, 2030, 2035, 2043];

  return (
    <>
      <SectionHeading emphasis="Is market evolving as expected?" />
      <DashboardCard>
        <CardHeader
          title={`Treated LLT market: ${ACTUALS_LABEL} vs ${FORECAST_LABEL}`}
          action={<DataTag>forecast refreshed {FORECAST_REFRESH_PERIOD}</DataTag>}
        />
        <Legend>
          <LegendItem
            color="var(--color-chart-grey)"
            kind="line"
            dashed
            label={`${FORECAST_LABEL} · CAGR ${formatPercent(forecastCagr, 1)}`}
          />
          <LegendItem
            color="var(--color-primary)"
            kind="line"
            label={`${ACTUALS_LABEL} · CAGR ${formatPercent(actualCagr, 1)}`}
          />
        </Legend>
        <div className="relative mt-2.5 h-[230px]">
          <MarketTrajectoryChart points={data.market} />
        </div>
        {/* <p className="mt-2 text-[11.5px] text-muted">
          The forecast was refreshed in <strong>{FORECAST_REFRESH_PERIOD}</strong>, while the latest outlook
          incorporates actuals through <strong>{ACTUALS_PERIOD}</strong>. The current variance compounds into a
          larger market-size deviation over the 2027-43 outlook.
        </p> */}
        <div className="overflow-x-auto">
          <table className="mt-2.5 w-full min-w-[520px] border-collapse text-xs tabular-nums">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.03em] text-muted">
                <th className="border-b border-[#f0efe9] px-2 py-1.5 text-left">Year</th>
                <th className="border-b border-[#f0efe9] px-2 py-1.5 text-right">{FORECAST_LABEL}</th>
                <th className="border-b border-[#f0efe9] px-2 py-1.5 text-right">{ACTUALS_LABEL}</th>
                <th className="border-b border-[#f0efe9] px-2 py-1.5 text-right">Variance</th>
              </tr>
            </thead>
            <tbody>
              {varianceYears.map((year) => {
                const point = marketPointForYear(data.market, year);
                const difference = point.actual - point.forecast;
                const relativeDifference = difference / point.forecast;

                return (
                  <tr key={year}>
                    <td className="border-b border-[#f0efe9] px-2 py-1.5 text-left last:border-0">{year}</td>
                    <td className="border-b border-[#f0efe9] px-2 py-1.5 text-right">{formatMillions(point.forecast)}</td>
                    <td className="border-b border-[#f0efe9] px-2 py-1.5 text-right">{formatMillions(point.actual)}</td>
                    <td className="border-b border-[#f0efe9] px-2 py-1.5 text-right font-semibold text-success">
                      +{formatMillions(difference)} · {formatSignedPercent(relativeDifference, 1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </>
  );
}

function PatientSection({ data }: { data: DashboardData }) {
  const [filter, setFilter] = useState<SegmentFilter>("all");
  const topMovers = useMemo(() => largestSegmentMovers(data.segments), [data.segments]);
  const topMoverNames = useMemo(() => new Set(topMovers.map((segment) => segment.name)), [topMovers]);
  const visibleSegments = useMemo(() => {
    const matchingSegments = filter === "all"
      ? data.segments
      : data.segments.filter((segment) => segment.group === filter);

    return [...matchingSegments].sort((first, second) => {
      const groupDifference = segmentGroupOrder[first.group] - segmentGroupOrder[second.group];
      return groupDifference !== 0 ? groupDifference : second.change - first.change;
    });
  }, [data.segments, filter]);

  return (
    <>
      <SectionHeading emphasis="Are patients evolving as expected?" />
      <DashboardCard>
        <CardHeader
          title={
            <>
              {FORECAST_LABEL} segments vs actual claims ({ACTUALS_PERIOD}){" "}
              <span className="whitespace-nowrap text-[11px] font-semibold text-accent">
                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                biggest movers flagged
              </span>
            </>
          }
          action={
            <SegmentedControl value={filter} options={segmentOptions} onChange={setFilter} label="Patient segment" />
          }
        />
        <div className="mt-1.5 overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-0 text-xs tabular-nums">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.03em] text-muted">
                <th className="border-b border-border px-2 py-[7px] text-left">Category</th>
                <th className="border-b border-border px-2 py-[7px] text-left">Patient segment</th>
                <th className="border-b border-border px-2 py-[7px] text-right">{FORECAST_LABEL}</th>
                <th className="border-b border-border px-2 py-[7px] text-right">{ACTUALS_LABEL}</th>
                <th className="border-b border-border px-2 py-[7px] text-right">Change</th>
              </tr>
            </thead>
            <tbody>
              {visibleSegments.map((segment) => {
                const isMover = topMoverNames.has(segment.name);

                return (
                  <tr key={segment.name} className={isMover ? "bg-[#fff7e6]" : undefined}>
                    <td className="border-b border-[#f0efe9] px-2 py-1.5 text-left font-semibold text-secondary">
                      {segmentGroupLabel(segment.group)}
                    </td>
                    <td className={`border-b border-[#f0efe9] px-2 py-1.5 text-left ${isMover ? "font-semibold" : ""}`}>
                      {isMover ? <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-accent" /> : null}
                      {segment.name}
                    </td>
                    <td className="border-b border-[#f0efe9] px-2 py-1.5 text-right">{formatPercent(segment.forecast)}</td>
                    <td className="border-b border-[#f0efe9] px-2 py-1.5 text-right">{formatPercent(segment.latest)}</td>
                    <td
                      className={`border-b border-[#f0efe9] px-2 py-1.5 text-right font-semibold ${
                        segment.change >= 0 ? "text-success" : "text-danger"
                      }`}
                    >
                      {formatPercentPoints(segment.change)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[10.5px] text-muted">
          Source: Hybrid approach _data requirement_vf.02 (Forian Data - Qral Outputs)
        </p>
      </DashboardCard>
    </>
  );
}

function statusDotClass(status: Assumption["status"]): string {
  if (status === "Watch") return "bg-warning";
  if (status === "Take Action") return "bg-danger";
  return "bg-success";
}

function AssumptionSection({ data }: { data: DashboardData }) {
  const counts = assumptionCounts(data.assumptions);
  const attentionCount = counts.Watch + counts["Take Action"];

  return (
    <>
      <SectionHeading emphasis="Are our launch assumptions holding?" />
      <DashboardCard>
        <CardHeader title={`${FORECAST_LABEL} vs ${ACTUALS_LABEL}`} action={<DataTag>latest evidence · Dec &apos;26</DataTag>} />
        <div className="overflow-x-auto">
          <table className="mt-1.5 w-full min-w-[860px] border-separate border-spacing-0 text-[12.5px] tabular-nums">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.03em] text-muted">
                <th className="border-b border-border px-[9px] py-[7px] text-left">Assumption</th>
                <th className="border-b border-border px-[9px] py-[7px] text-right">{FORECAST_LABEL}</th>
                <th className="border-b border-border px-[9px] py-[7px] text-right">Actuals (Dec &apos;26)</th>
                <th className="border-b border-border px-[9px] py-[7px] text-right">Variance</th>
                <th className="border-b border-border px-[9px] py-[7px] text-left">Source</th>
                <th className="border-b border-border px-[9px] py-[7px] text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.assumptions.map((assumption) => (
                <tr key={assumption.name}>
                  <td className="border-b border-[#f0efe9] px-[9px] py-2 text-left font-semibold">{assumption.name}</td>
                  <td className="border-b border-[#f0efe9] px-[9px] py-2 text-right">
                    {formatAssumptionValue(assumption, assumption.forecast, assumption.forecastDigits)}
                  </td>
                  <td className="border-b border-[#f0efe9] px-[9px] py-2 text-right">
                    {formatAssumptionValue(assumption, assumption.current, assumption.currentDigits)}
                  </td>
                  <td
                    className={`border-b border-[#f0efe9] px-[9px] py-2 text-right font-semibold ${
                      assumption.variance >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {formatAssumptionVariance(assumption)}
                  </td>
                  <td className="border-b border-[#f0efe9] px-[9px] py-2 text-left text-[11px] text-muted">
                    {assumption.source}
                  </td>
                  <td className="border-b border-[#f0efe9] px-[9px] py-2 text-center">
                    <span
                      title={`${assumption.status} (${assumption.sourceStatus})`}
                      aria-label={assumption.status}
                      className="inline-flex items-center justify-center"
                    >
                      <span className={`inline-block h-3.5 w-3.5 rounded-full ring-2 ring-white shadow-sm ${statusDotClass(assumption.status)}`} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#e4f4ea] px-3 py-1.5 text-[12.5px] font-semibold text-[#1d7a4d]">
            <strong className="text-[15px]">{counts["On Track"]}</strong> On Track
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#fdf3e0] px-3 py-1.5 text-[12.5px] font-semibold text-[#9a6a12]">
            <strong className="text-[15px]">{counts.Watch}</strong> Watch
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#fbe6e2] px-3 py-1.5 text-[12.5px] font-semibold text-[#b23b2c]">
            <strong className="text-[15px]">{counts["Take Action"]}</strong> Take Action
          </span>
          <span className="ml-auto text-[12.5px] font-semibold text-violet">↑ {attentionCount} assumptions need attention</span>
        </div>
      </DashboardCard>
    </>
  );
}

function ExecutiveSummaryPanel() {
  return (
    <AiSummaryPanel
      summary={
        <ul className="m-0 list-disc space-y-3 pl-5">
          <li>
            <p className="m-0 font-semibold text-[#2C7358]">LDL-C market is tracking ahead of expectations</p>
            <p className="m-0 mt-1 text-content">
              Market growth is running at 2.1% CAGR vs. 1.6% forecast, while the advanced-LLT pool has increased ~8% over
              six months. <strong>The addressable opportunity may be expanding faster than anticipated.</strong>
            </p>
          </li>
          <li>
            <p className="m-0 font-semibold text-[#2C7358]">Patients are escalating faster than expected</p>
            <p className="m-0 mt-1 text-content">
              Time to advanced therapy is currently 7.3 months vs. 8.4 months forecast.{" "}
              <strong>Earlier escalation could increase the near-term treatment opportunity if access can support the increased demand.</strong>
            </p>
          </li>
          <li>
            <p className="m-0 font-semibold text-[#9a6a12]">Patient mix is beginning to shift across key target segments</p>
            <p className="m-0 mt-1 text-content">
              Three of 14 segments have moved meaningfully, led by <em>PP without T2D - Other Risk Factors</em>.{" "}
              <strong>
                The composition of patients reaching treatment may be changing, potentially affecting the size and mix of Obi&apos;s
                addressable population.
              </strong>
            </p>
          </li>
          <li>
            <p className="m-0 font-semibold text-[#b23b2c]">Access is not keeping pace with the opportunity</p>
            <p className="m-0 mt-1 text-content">
              Access is currently 39% vs. 41% forecast while several other market indicators are tracking ahead.{" "}
              <strong>This assumption warrants review as part of the next launch outlook refresh.</strong>
            </p>
          </li>
        </ul>
      }
    />
  );
}

export function ExecutiveDashboard({ data }: { data: DashboardData }) {
  const market2026 = marketPointForYear(data.market, 2026);
  const actualCagr = calculateCagr(data.market, "actual", 2027);
  const forecastCagr = calculateCagr(data.market, "forecast", 2027);
  const latestPool = latestPoint(data.advancedPool);
  const poolGrowth = latestPool.value / data.advancedPool[0].value - 1;
  const topMovers = largestSegmentMovers(data.segments);

  return (
    <>
      <PageIntro
        title="Executive Summary"
        description="A real-time view of how the LDL-C market and patient dynamics are evolving versus our launch assumptions."
      />

      <div className="mb-4">
        <ExecutiveSummaryPanel />
      </div>

      <section className="dashboard-hero rounded-[18px] border border-[#f2e8e1] p-4 shadow-[0_4px_14px_rgba(47,84,149,0.025)]">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Treated LLT market"
            value={formatMillions(market2026.actual)}
            valueSuffix={`(${ACTUALS_PERIOD})`}
            detail={`${formatSignedPercent((market2026.actual - market2026.forecast) / market2026.forecast, 1)} vs ${formatMillions(market2026.forecast)} ${FORECAST_LABEL}`}
            detailClassName="text-success"
          />
          <MetricCard
            label="Market CAGR"
            value={formatPercent(actualCagr, 1)}
            valueSuffix="(2027-43)"
            detail={`+${((actualCagr - forecastCagr) * 100).toFixed(1)} pt vs ${formatPercent(forecastCagr, 1)} ${FORECAST_LABEL}`}
            detailClassName="text-success"
          />
          <MetricCard
            label="Advanced-LLT pool · 6 mo"
            value={`${latestPool.value.toFixed(2)}M`}
            valueSuffix={`(${latestPool.label})`}
            detail={`${formatSignedPercent(poolGrowth, 0)} vs ${data.advancedPool[0].value.toFixed(2)}M ${FORECAST_LABEL}`}
            detailClassName="text-success"
          />
          <MetricCard
            label="Segments showing meaningful movement"
            value={`${topMovers.length}/${data.segments.length}`}
            valueSuffix={`(${ACTUALS_PERIOD})`}
          />
        </div>
      </section>

      <MarketSection data={data} />
      <PatientSection data={data} />
      <AssumptionSection data={data} />
    </>
  );
}
