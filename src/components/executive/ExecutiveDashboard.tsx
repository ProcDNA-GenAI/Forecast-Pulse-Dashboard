"use client";

import { useMemo, useState } from "react";
import { MarketTrajectoryChart, SegmentMovementChart } from "@/components/charts/ExecutiveCharts";
import { AiSummaryPanel, SummaryColumn, SummaryFlag, SummarySignal } from "@/components/dashboard/AiSummaryPanel";
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
} from "@/lib/dashboard/formatters";
import {
  aggregateSegmentMovements,
  assumptionCounts,
  calculateCagr,
  largestSegmentMovers,
  marketPointForYear,
  type SegmentMovement,
} from "@/lib/dashboard/selectors";
import type { Assumption, DashboardData, SegmentGroup } from "@/lib/dashboard/types";

type SegmentFilter = "all" | SegmentGroup;
type MovementMode = "sub" | "grp";

const segmentOptions = [
  { value: "all", label: "All" },
  { value: "ascvd", label: "ASCVD" },
  { value: "ppt2d", label: "PP w/ T2D" },
  { value: "ppno", label: "PP no T2D" },
] satisfies Array<{ value: SegmentFilter; label: string }>;

const movementOptions = [
  { value: "sub", label: "Sub-segments" },
  { value: "grp", label: "Groups" },
] satisfies Array<{ value: MovementMode; label: string }>;

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
  detail: string;
  detailClassName: string;
}) {
  return (
    <section className="rounded-[14px] border border-border bg-surface px-4 py-[15px] shadow-[0_1px_2px_rgba(38,48,58,0.02)]">
      <div className="text-xs text-muted">{label}</div>
      <div className="my-1 text-[28px] font-bold leading-none text-primary">
        {value}
        {valueSuffix ? <span className="text-[15px] font-semibold text-muted"> {valueSuffix}</span> : null}
      </div>
      <div className={`text-[12.5px] font-semibold ${detailClassName}`}>{detail}</div>
    </section>
  );
}

function MarketSection({ data }: { data: DashboardData }) {
  const actualCagr = calculateCagr(data.market, "actual");
  const planCagr = calculateCagr(data.market, "forecast");
  const varianceYears = [2026, 2030, 2035, 2043];

  return (
    <>
      <SectionHeading title="Market" question="is it evolving as expected?" />
      <DashboardCard>
        <CardHeader title="Treated LLT market — actual vs plan" action={<DataTag>time n/a · annual</DataTag>} />
        <Legend>
          <LegendItem
            color="var(--color-muted)"
            kind="line"
            dashed
            label={`Plan · CAGR ${formatPercent(planCagr, 1)}`}
          />
          <LegendItem
            color="var(--color-tertiary)"
            kind="line"
            label={`Actual · CAGR ${formatPercent(actualCagr, 1)}`}
          />
        </Legend>
        <div className="relative mt-2.5 h-[230px]">
          <MarketTrajectoryChart points={data.market} />
        </div>
        <p className="mt-2 text-[11.5px] text-muted">
          Forecast trend is fitted on actuals through <strong>Dec &apos;25</strong>; the observed line reflects
          actuals through <strong>Dec &apos;26</strong>. The lines nearly overlap in 2024–26 — but as the observed
          variance persists, the gap compounds into a large market-size deviation over time.
        </p>
        <div className="overflow-x-auto">
          <table className="mt-2.5 w-full min-w-[520px] border-collapse text-xs tabular-nums">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.03em] text-muted">
                <th className="border-b border-[#f0efe9] px-2 py-1.5 text-left">Year</th>
                <th className="border-b border-[#f0efe9] px-2 py-1.5 text-right">Plan</th>
                <th className="border-b border-[#f0efe9] px-2 py-1.5 text-right">Observed</th>
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
  const [movementMode, setMovementMode] = useState<MovementMode>("sub");
  const topMovers = useMemo(() => largestSegmentMovers(data.segments), [data.segments]);
  const topMoverNames = useMemo(() => new Set(topMovers.map((segment) => segment.name)), [topMovers]);
  const visibleSegments = filter === "all" ? data.segments : data.segments.filter((segment) => segment.group === filter);
  const movementRows: SegmentMovement[] =
    movementMode === "sub"
      ? data.segments.map((segment) => ({
          name: segment.name,
          forecast: segment.forecast,
          latest: segment.latest,
          change: segment.change,
        }))
      : aggregateSegmentMovements(data.segments);

  return (
    <>
      <SectionHeading title="Patients" question="are they evolving as expected?" />
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <DashboardCard>
          <CardHeader
            title={
              <>
                Forecast segments vs latest claims{" "}
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
            <table className="w-full min-w-[580px] border-separate border-spacing-0 text-xs tabular-nums">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.03em] text-muted">
                  <th className="border-b border-border px-2 py-[7px] text-left">Patient segment</th>
                  <th className="border-b border-border px-2 py-[7px] text-right">Forecast</th>
                  <th className="border-b border-border px-2 py-[7px] text-right">Latest</th>
                  <th className="border-b border-border px-2 py-[7px] text-right">Change</th>
                </tr>
              </thead>
              <tbody>
                {visibleSegments.map((segment) => {
                  const isMover = topMoverNames.has(segment.name);

                  return (
                    <tr key={segment.name} className={isMover ? "bg-[#fff7e6]" : undefined}>
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
        </DashboardCard>

        <DashboardCard>
          <CardHeader
            title="Segment movement — forecast → latest"
            subtitle="bar spans each segment's forecast to latest share"
            action={
              <SegmentedControl
                value={movementMode}
                options={movementOptions}
                onChange={setMovementMode}
                label="Movement grouping"
              />
            }
          />
          <div className="relative mt-2.5 h-[330px]">
            <SegmentMovementChart rows={movementRows} />
          </div>
        </DashboardCard>
      </div>
    </>
  );
}

function statusDotClass(status: Assumption["status"]): string {
  if (status === "Watch") return "bg-warning";
  if (status === "Off Track") return "bg-danger";
  return "bg-success";
}

function AssumptionSection({ data }: { data: DashboardData }) {
  const counts = assumptionCounts(data.assumptions);
  const attentionCount = counts.Watch + counts["Off Track"];

  return (
    <>
      <SectionHeading title="Assumptions" question="are our launch assumptions holding?" />
      <DashboardCard>
        <CardHeader title="Base forecast vs observed" action={<DataTag>time n/a · snapshot</DataTag>} />
        <div className="overflow-x-auto">
          <table className="mt-1.5 w-full min-w-[640px] border-separate border-spacing-0 text-[12.5px] tabular-nums">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.03em] text-muted">
                <th className="border-b border-border px-[9px] py-[7px] text-left">Assumption</th>
                <th className="border-b border-border px-[9px] py-[7px] text-right">Plan</th>
                <th className="border-b border-border px-[9px] py-[7px] text-right">Current</th>
                <th className="border-b border-border px-[9px] py-[7px] text-right">Variance</th>
                <th className="border-b border-border px-[9px] py-[7px] text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.assumptions.map((assumption) => (
                <tr key={assumption.name}>
                  <td className="border-b border-[#f0efe9] px-[9px] py-2 text-left font-semibold">{assumption.name}</td>
                  <td className="border-b border-[#f0efe9] px-[9px] py-2 text-right">
                    {formatAssumptionValue(assumption, assumption.plan, assumption.planDigits)}
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
                  <td className="border-b border-[#f0efe9] px-[9px] py-2 text-center">
                    <span
                      title={`${assumption.status} (${assumption.sourceStatus})`}
                      aria-label={assumption.status}
                      className={`inline-block h-[11px] w-[11px] rounded-full ${statusDotClass(assumption.status)}`}
                    />
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
            <strong className="text-[15px]">{counts["Off Track"]}</strong> Off Track
          </span>
          <span className="ml-auto text-[12.5px] font-semibold text-violet">↑ {attentionCount} assumptions need attention</span>
        </div>
      </DashboardCard>
    </>
  );
}

function ExecutiveSummaryPanel({ data }: { data: DashboardData }) {
  const actualCagr = calculateCagr(data.market, "actual");
  const planCagr = calculateCagr(data.market, "forecast");
  const poolGrowth = latestPoint(data.advancedPool).value / data.advancedPool[0].value - 1;
  const counts = assumptionCounts(data.assumptions);
  const escalation = data.assumptions.find((item) => item.name.toLowerCase().includes("escalation"));
  const access = data.assumptions.find((item) => item.name === "Access");
  const flagged = data.assumptions.filter((item) => item.status !== "On Track");

  if (!escalation || !access) {
    throw new Error("The assumption summary requires escalation and access rows.");
  }

  return (
    <AiSummaryPanel
      title="What the latest evidence shows"
      subtitle="Auto-generated synthesis of the metrics above — observations only, drawn from the reported figures."
      summary={
        <p className="m-0">
          The advanced-LLT market is tracking above plan — CAGR {formatPercent(actualCagr, 1)} vs{" "}
          {formatPercent(planCagr, 1)}, with the treated pool up ~{formatPercent(poolGrowth, 0)} over six months — and
          patients are escalating to advanced therapy sooner than assumed ({escalation.current.toFixed(1)} vs{" "}
          {escalation.plan.toFixed(1)} months). Access is running below plan ({formatPercent(access.current, 0)} vs{" "}
          {formatPercent(access.plan, 0)}). Of seven monitored assumptions, {counts["Off Track"]} is off-track and{" "}
          {counts.Watch} are on watch.
        </p>
      }
    >
      <SummaryColumn label="Top signals vs plan">
        <SummarySignal
          direction="up"
          title="Advanced-LLT growth accelerating"
          description={`Market CAGR ${formatPercent(actualCagr, 1)} vs ${formatPercent(planCagr, 1)} plan; pool +${formatPercent(poolGrowth, 0)} in six months.`}
          value={`+${((actualCagr - planCagr) * 100).toFixed(1)} pt`}
          valueClassName="text-success"
        />
        <SummarySignal
          direction="up"
          title="Escalation to advanced LLT faster"
          description={`Time-to-escalation shortening ${escalation.plan.toFixed(1)} → ${escalation.current.toFixed(1)} months.`}
          value={formatAssumptionVariance(escalation)}
          valueClassName="text-success"
        />
        <SummarySignal
          direction="down"
          title="Access below plan"
          description="Formulary access tracking under the assumption."
          value={formatAssumptionVariance(access)}
          valueClassName="text-danger"
        />
      </SummaryColumn>
      <SummaryColumn label="Assumptions flagged for review">
        {flagged.map((assumption) => (
          <SummaryFlag
            key={assumption.name}
            name={assumption.name}
            value={formatAssumptionVariance(assumption)}
            dotClassName={statusDotClass(assumption.status)}
            valueClassName={assumption.variance >= 0 ? "text-success" : "text-danger"}
          />
        ))}
      </SummaryColumn>
    </AiSummaryPanel>
  );
}

export function ExecutiveDashboard({ data }: { data: DashboardData }) {
  const market2026 = marketPointForYear(data.market, 2026);
  const actualCagr = calculateCagr(data.market, "actual");
  const planCagr = calculateCagr(data.market, "forecast");
  const latestPool = latestPoint(data.advancedPool);
  const poolGrowth = latestPool.value / data.advancedPool[0].value - 1;
  const counts = assumptionCounts(data.assumptions);
  const attentionCount = counts.Watch + counts["Off Track"];

  return (
    <>
      <PageIntro
        title="Executive Summary"
        description="A real-time view of how the LDL-C market and patient dynamics are evolving versus our launch assumptions."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Treated LLT market (2026)"
          value={formatMillions(market2026.actual)}
          detail={`▲ ${formatSignedPercent((market2026.actual - market2026.forecast) / market2026.forecast, 1)} vs plan`}
          detailClassName="text-success"
        />
        <MetricCard
          label="Market CAGR · 2024–43"
          value={formatPercent(actualCagr, 1)}
          detail={`▲ +${((actualCagr - planCagr) * 100).toFixed(1)} pt vs ${formatPercent(planCagr, 1)} plan`}
          detailClassName="text-success"
        />
        <MetricCard
          label="Advanced-LLT pool · 6 mo"
          value={`${latestPool.value.toFixed(2)}M`}
          detail={`▲ +${formatPercent(poolGrowth, 0)}`}
          detailClassName="text-success"
        />
        <MetricCard
          label="Assumptions to action"
          value={String(attentionCount)}
          valueSuffix={`of ${data.assumptions.length}`}
          detail={`${counts["Off Track"]} off-track · ${counts.Watch} to watch`}
          detailClassName="text-warning"
        />
      </div>

      <MarketSection data={data} />
      <PatientSection data={data} />
      <AssumptionSection data={data} />
      <ExecutiveSummaryPanel data={data} />
    </>
  );
}
