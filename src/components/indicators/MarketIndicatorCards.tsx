"use client";

import { useMemo, useState } from "react";
import { Bar, Chart, Doughnut, Line } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import { useDashboard } from "@/components/dashboard/DashboardProvider";
import { CardHeader, DashboardCard } from "@/components/dashboard/DashboardCard";
import { Legend, LegendItem, MiniButton } from "@/components/dashboard/DashboardControls";
import { rgba, useChartColors, type ChartColors } from "@/components/charts/chartSetup";
import { formatDecimal, takeForBucket } from "@/utils/dashboard/formatters";
import type {
  ComparisonPoint,
  EscalationPoint,
  InflowPoint,
  NpsPoint,
  PersistencyPoint,
  PrescriberMonthlyPoint,
  PrescriberPoint,
  ProductMixPoint,
  TrendPoint,
} from "@/utils/dashboard/types";
import { FORECAST_LABEL, FORECAST_REFRESH_PERIOD } from "@/utils/dashboard/periods";

function colorFromToken(colors: ChartColors, token: keyof ChartColors): string {
  return colors[token];
}

function cssVariableForToken(token: string): string {
  return token === "grey" ? "var(--color-chart-grey)" : `var(--color-${token})`;
}

const productColorTokens = ["orange", "primary", "success", "accent", "grey"] as const;

export function ProductMixCard({ points }: { points: ProductMixPoint[] }) {
  const { bucket } = useDashboard();
  const colors = useChartColors();
  const [mode, setMode] = useState<"pct" | "count">("pct");
  const visible = takeForBucket(points, bucket);
  const products = points[0]?.shares.map((item) => item.product) ?? [];

  const data: ChartData<"bar", number[], string> = {
    labels: visible.map((point) => point.label),
    datasets: products.map((product, productIndex) => {
      const colorToken = productColorTokens[productIndex] ?? "primary";
      return {
        label: product,
        data: visible.map((point) => {
          const share = point.shares.find((item) => item.product === product)?.share ?? 0;
          return mode === "pct" ? share * 100 : share * point.totalPatientsMillions;
        }),
        backgroundColor: rgba(colorFromToken(colors, colorToken), 0.92),
        borderWidth: 0,
        stack: "product-mix",
      };
    }),
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const point = visible[context.dataIndex];
            const share = point?.shares.find((item) => item.product === context.dataset.label)?.share ?? 0;
            const productPatients = share * (point?.totalPatientsMillions ?? 0);
            const totalPatients = point?.totalPatientsMillions ?? 0;

            return mode === "pct"
              ? `${context.dataset.label}: ${formatDecimal(share * 100, 1)}% · ${formatDecimal(productPatients, 2)}M of ${formatDecimal(totalPatients, 2)}M total`
              : `${context.dataset.label}: ${formatDecimal(productPatients, 2)}M · ${formatDecimal(share * 100, 1)}% of ${formatDecimal(totalPatients, 2)}M total`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { font: { size: 8 }, maxTicksLimit: 12, autoSkip: true },
      },
      y: {
        stacked: true,
        max: mode === "pct" ? 100 : undefined,
        grid: { display: false },
        title: {
          display: true,
          text: mode === "pct" ? "Patient Share (%)" : "Patients (M)",
          color: colors.muted,
          font: { size: 9, weight: 600 },
        },
        ticks: {
          font: { size: 9 },
          callback: (value) => (mode === "pct" ? `${value}%` : `${formatDecimal(Number(value), 2)}M`),
        },
      },
    },
  };

  return (
    <DashboardCard>
      <CardHeader
        title="LLT Patient Mix"
        action={
          <MiniButton onClick={() => setMode((current) => (current === "pct" ? "count" : "pct"))}>
            {mode === "pct" ? "Show patient count" : "Show % share"}
          </MiniButton>
        }
      />
      <Legend>
        {products.map((product, productIndex) => (
          <LegendItem
            key={product}
            label={product}
            color={cssVariableForToken(productColorTokens[productIndex] ?? "primary")}
          />
        ))}
      </Legend>
      <div className="relative mt-2.5 h-[210px]">
        <Bar data={data} options={options} />
      </div>
    </DashboardCard>
  );
}

export function NpsMarketShareCard({ points, productName }: { points: NpsPoint[]; productName: string }) {
  const { bucket } = useDashboard();
  const colors = useChartColors();
  const [mode, setMode] = useState<"share" | "count">("share");
  const visible = takeForBucket(points, bucket);
  const actualsLabel = "Actuals";

  const data: ChartData<"line", number[], string> = {
    labels: visible.map((point) => point.label),
    datasets: [
      {
        label: actualsLabel,
        data: visible.map((point) => (mode === "share" ? point.actual * 100 : point.actualCount)),
        borderColor: colors.orange,
        borderWidth: 2.6,
        pointRadius: 2,
        tension: 0.3,
      },
      {
        label: FORECAST_LABEL,
        data: visible.map((point) => (mode === "share" ? point.forecast * 100 : point.forecastCount)),
        borderColor: colors.grey,
        borderDash: [5, 4],
        borderWidth: 1.8,
        pointRadius: 0,
        tension: 0.3,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = Number(context.parsed.y);
            return `${context.dataset.label}: ${mode === "share" ? `${formatDecimal(value, 1)}% share` : `${Math.round(value).toLocaleString()} NPS`}`;
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 9 } } },
      y: {
        grid: { display: false },
        title: { display: true, text: mode === "share" ? "NPS Share" : "NPS Count", font: { size: 9 } },
        ticks: {
          font: { size: 9 },
          callback: (value) => mode === "share" ? `${value}%` : `${Math.round(Number(value) / 1000)}k`,
        },
      },
    },
  };

  return (
    <DashboardCard>
      <CardHeader
        title={`${productName} NPS ${mode === "share" ? "Market Share" : "Counts"}`}
        action={
          <MiniButton onClick={() => setMode((current) => (current === "share" ? "count" : "share"))}>
            {mode === "share" ? "Show NPS counts" : "Show NPS share"}
          </MiniButton>
        }
      />
      <Legend>
        <LegendItem color="var(--color-orange)" kind="line" label={actualsLabel} />
        <LegendItem color="var(--color-chart-grey)" kind="line" dashed label={FORECAST_LABEL} />
      </Legend>
      <div className="relative mt-2.5 h-[210px]">
        <Line data={data} options={options} />
      </div>
    </DashboardCard>
  );
}

type TrendCardProps = {
  title: string;
  points: TrendPoint[];
  colorToken: "tertiary" | "teal";
  valueLabel: (value: number) => string;
  tickLabel: (value: number) => string;
  yAxisLabel?: string;
  yAxisMin?: number;
  yAxisMax?: number;
  yAxisStep?: number;
  chartHeightClassName?: string;
};

export function TrendCard({
  title,
  points,
  colorToken,
  valueLabel,
  tickLabel,
  yAxisLabel,
  yAxisMin,
  yAxisMax,
  yAxisStep,
  chartHeightClassName = "h-[190px]",
}: TrendCardProps) {
  const { bucket } = useDashboard();
  const colors = useChartColors();
  const visible = takeForBucket(points, bucket);
  const color = colorFromToken(colors, colorToken);

  const data: ChartData<"line", number[], string> = {
    labels: visible.map((point) => point.label),
    datasets: [
      {
        label: title,
        data: visible.map((point) => point.value),
        borderColor: color,
        backgroundColor: rgba(color, 0.12),
        fill: true,
        borderWidth: 2,
        pointRadius: 2,
        tension: 0.3,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (context) => valueLabel(Number(context.parsed.y)) } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 9 } } },
      y: {
        min: yAxisMin,
        max: yAxisMax,
        grid: { display: false },
        title: yAxisLabel ? { display: true, text: yAxisLabel, color: colors.muted, font: { size: 9, weight: 600 } } : undefined,
        ticks: { font: { size: 9 }, stepSize: yAxisStep, callback: (value) => tickLabel(Number(value)) },
      },
    },
  };

  return (
    <DashboardCard>
      <CardHeader title={title} />
      <div className={`relative mt-2.5 ${chartHeightClassName}`}>
        <Line data={data} options={options} />
      </div>
    </DashboardCard>
  );
}

export function PatientInflowCard({ points, productName }: { points: InflowPoint[]; productName: string }) {
  const { bucket } = useDashboard();
  const colors = useChartColors();
  const visible = takeForBucket(points, bucket);

  const data: ChartData<"bar", number[], string> = {
    labels: visible.map((point) => point.label),
    datasets: [
      {
        label: "Newly intensified",
        data: visible.map((point) => point.newlyIntensified * 100),
        borderColor: colors.teal,
        backgroundColor: rgba(colors.teal, 0.85),
        stack: "source",
        borderRadius: 3,
      },
      {
        label: "Switch from advanced",
        data: visible.map((point) => point.switchFromAdvanced * 100),
        borderColor: colors.primary,
        backgroundColor: rgba(colors.primary, 0.85),
        stack: "source",
        borderRadius: 3,
      },
      {
        label: "Other",
        data: visible.map((point) => point.other * 100),
        borderColor: colors.grey,
        backgroundColor: rgba(colors.grey, 0.82),
        stack: "source",
        borderRadius: 3,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${formatDecimal(Number(context.parsed.y), 0)}%` } },
    },
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { font: { size: 9 } } },
      y: {
        stacked: true,
        max: 100,
        grid: { display: false },
        title: { display: true, text: "Patient Share (%)", color: colors.muted, font: { size: 9, weight: 600 } },
        ticks: { font: { size: 9 }, callback: (value) => `${value}%` },
      },
    },
  };

  const overallShares = useMemo(() => {
    const denominator = Math.max(visible.length, 1);
    return [
      visible.reduce((sum, point) => sum + point.newlyIntensified, 0) / denominator,
      visible.reduce((sum, point) => sum + point.switchFromAdvanced, 0) / denominator,
      visible.reduce((sum, point) => sum + point.other, 0) / denominator,
    ];
  }, [visible]);

  const overallData: ChartData<"doughnut", number[], string> = {
    labels: ["Newly intensified", "Switch from advanced", "Other"],
    datasets: [
      {
        data: overallShares.map((value) => value * 100),
        backgroundColor: [rgba(colors.teal, 0.9), rgba(colors.primary, 0.9), rgba(colors.grey, 0.9)],
        borderColor: "#ffffff",
        borderWidth: 2,
      },
    ],
  };

  const overallOptions: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "62%",
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (context) => `${context.label}: ${formatDecimal(Number(context.parsed), 0)}%` } },
    },
  };

  return (
    <DashboardCard>
      <CardHeader title={`${productName} Patient Inflow Source`} />
      <Legend>
        <LegendItem color="var(--color-teal)" label="Newly intensified" />
        <LegendItem color="var(--color-primary)" label="Switch from advanced" />
        <LegendItem color="var(--color-chart-grey)" label="Other" />
      </Legend>
      <div className="mt-2.5 grid gap-5 lg:grid-cols-2 lg:items-center">
        <div className="relative h-[220px]">
          <Bar data={data} options={options} />
        </div>
        <div className="rounded-xl border border-border bg-page/60 px-3 py-3">
          <p className="mb-1 text-center text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">
            Overall Mix
          </p>
          <div className="relative mx-auto h-[170px] max-w-[230px]">
            <Doughnut data={overallData} options={overallOptions} />
          </div>
          <div className="mt-1 grid grid-cols-3 gap-1 text-center">
            {overallShares.map((value, index) => (
              <div key={overallData.labels?.[index] as string}>
                <div className="text-sm font-bold text-primary">{formatDecimal(value * 100, 0)}%</div>
                <div className="text-[9px] leading-tight text-muted">{overallData.labels?.[index]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-1.5 text-[10.5px] text-muted">
        &quot;Switch from advanced&quot; = patients moving into {productName} from the other five brands: Ezetimibe,
        Repatha, Praluent, Leqvio, Nexletol.
      </p>
    </DashboardCard>
  );
}

export function PersistencyCard({ points }: { points: PersistencyPoint[] }) {
  const colors = useChartColors();
  const visible = points;
  const products = points[0]?.products.map((item) => item.product) ?? [];
  const productColors = [colors.orange, colors.primary, colors.teal, colors.accent, colors.grey];
  const lowestPersistency = Math.min(
    ...visible.flatMap((point) => [point.forecast, ...point.products.map((item) => item.value)]),
  ) * 100;
  const yAxisMinimum = Math.max(0, Math.floor((lowestPersistency - 5) / 10) * 10);

  const data: ChartData<"line", number[], string> = {
    labels: visible.map((point) => point.label),
    datasets: [
      ...products.map((product, index) => ({
        label: product,
        data: visible.map((point) => (point.products.find((item) => item.product === product)?.value ?? 0) * 100),
        borderColor: productColors[index] ?? colors.primary,
        borderWidth: product === products[0] ? 2.6 : 2.1,
        pointRadius: 2.5,
        tension: 0.2,
      })),
      {
        label: `Blended Forecast (${FORECAST_REFRESH_PERIOD})`,
        data: visible.map((point) => point.forecast * 100),
        borderColor: colors.grey,
        borderDash: [5, 4],
        borderWidth: 1.8,
        pointRadius: 0,
        tension: 0.2,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${formatDecimal(Number(context.parsed.y), 0)}%` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 9 } } },
      y: {
        min: yAxisMinimum,
        max: 100,
        grid: { display: false },
        title: { display: true, text: "Persistency (%)", color: colors.muted, font: { size: 9, weight: 600 } },
        ticks: { font: { size: 9 }, callback: (value) => `${value}%` },
      },
    },
  };

  return (
    <DashboardCard>
      <CardHeader title="Persistency" />
      <Legend>
        {products.map((product, index) => (
          <LegendItem key={product} color={productColors[index] ?? colors.primary} kind="line" label={product} />
        ))}
        <LegendItem color="var(--color-chart-grey)" kind="line" dashed label={`Blended Forecast (${FORECAST_REFRESH_PERIOD})`} />
      </Legend>
      <div className="relative mt-2.5 h-[200px]">
        <Line data={data} options={options} />
      </div>
    </DashboardCard>
  );
}

export function PrescriberGrowthCard({ points }: { points: PrescriberMonthlyPoint[] }) {
  const { bucket } = useDashboard();
  const visible = takeForBucket(points, bucket);

  return (
    <DashboardCard>
      <CardHeader title="Prescriber Adoption and Concentration" />
      <div className="mt-1.5 overflow-x-auto">
        <table className="w-full min-w-[840px] border-separate border-spacing-0 text-xs tabular-nums">
          <thead>
            <tr className="text-[12px] tracking-[0.03em] text-muted">
              <th className="border-b border-border px-2 py-[7px] text-left">Month</th>
              <th className="border-b border-border px-2 py-[7px] text-right">Active Lipfendra Writers</th>
              <th className="border-b border-border px-2 py-[7px] text-right">Rx From Top 10% Writers</th>
              <th className="border-b border-border px-2 py-[7px] text-right">Rx From Top 25% Writers</th>
              <th className="border-b border-border px-2 py-[7px] text-right">Avg. Rx Per Active Writer</th>
              <th className="border-b border-border px-2 py-[7px] text-right">New Writers Added</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((point) => (
              <tr key={point.label}>
                <td className="border-b border-[#f0efe9] px-2 py-2 text-left font-semibold">{point.label}</td>
                <td className="border-b border-[#f0efe9] px-2 py-2 text-right">{point.activeWriters.toLocaleString()}</td>
                <td className="border-b border-[#f0efe9] px-2 py-2 text-right">{formatDecimal(point.topTenPercentShare * 100, 0)}%</td>
                <td className="border-b border-[#f0efe9] px-2 py-2 text-right">{formatDecimal(point.topTwentyFivePercentShare * 100, 0)}%</td>
                <td className="border-b border-[#f0efe9] px-2 py-2 text-right">{formatDecimal(point.prescriptionsPerWriter, 1)}</td>
                <td className="border-b border-[#f0efe9] px-2 py-2 text-right">{point.newWritersAdded.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  );
}

export function EscalationTimeCard({ points }: { points: EscalationPoint[] }) {
  const { bucket } = useDashboard();
  const colors = useChartColors();
  const visible = takeForBucket(points, bucket);
  const minMonths = Math.floor((Math.min(...visible.map((point) => point.months)) - 0.3) * 2) / 2;
  const maxMonths = Math.ceil((Math.max(...visible.map((point) => point.months)) + 0.3) * 2) / 2;

  const data: ChartData<"line", number[], string> = {
    labels: visible.map((point) => point.label),
    datasets: [
      {
        label: "Median Time to Escalation",
        data: visible.map((point) => point.months),
        borderColor: colors.orange,
        backgroundColor: rgba(colors.orange, 0.1),
        fill: true,
        borderWidth: 2.6,
        pointRadius: 3,
        tension: 0.25,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${formatDecimal(Number(context.parsed.y), 1)} mo` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 9 } } },
      y: {
        min: minMonths,
        max: maxMonths,
        grid: { display: false },
        title: { display: true, text: "Months", color: colors.muted, font: { size: 9, weight: 600 } },
        ticks: { font: { size: 9 }, callback: (value) => `${value} mo` },
      },
    },
  };

  return (
    <DashboardCard>
      <CardHeader title="Median Time to Escalation" />
      <Legend>
        <LegendItem color="var(--color-orange)" kind="line" label="Median Time to Escalation" />
      </Legend>
      <div className="relative mt-2.5 h-[235px]">
        <Line data={data} options={options} />
      </div>
    </DashboardCard>
  );
}

export function ComplianceCard({ points, productName }: { points: ComparisonPoint[]; productName: string }) {
  const { bucket } = useDashboard();
  const colors = useChartColors();
  const visible = takeForBucket(points, bucket);
  const actualsLabel = `${productName} Compliance`;

  const data: ChartData<"line", number[], string> = {
    labels: visible.map((point) => point.label),
    datasets: [
      {
        label: actualsLabel,
        data: visible.map((point) => point.actual * 100),
        borderColor: colors.teal,
        backgroundColor: rgba(colors.teal, 0.08),
        fill: true,
        borderWidth: 2.6,
        pointRadius: 3,
        tension: 0.25,
      },
      {
        label: FORECAST_LABEL,
        data: visible.map((point) => point.forecast * 100),
        borderColor: colors.grey,
        borderDash: [5, 4],
        borderWidth: 1.8,
        pointRadius: 0,
        tension: 0.25,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${formatDecimal(Number(context.parsed.y), 0)}%` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 9 } } },
      y: {
        min: 70,
        max: 90,
        grid: { display: false },
        title: { display: true, text: "Compliance (%)", color: colors.muted, font: { size: 9, weight: 600 } },
        ticks: { font: { size: 9 }, callback: (value) => `${value}%` },
      },
    },
  };

  return (
    <DashboardCard>
      <CardHeader title="Compliance" />
      <Legend>
        <LegendItem color="var(--color-teal)" kind="line" label={actualsLabel} />
        <LegendItem color="var(--color-chart-grey)" kind="line" dashed label={FORECAST_LABEL} />
      </Legend>
      <div className="relative mt-2.5 h-[200px]">
        <Line data={data} options={options} />
      </div>
    </DashboardCard>
  );
}

export function PrescriberCard({ points }: { points: PrescriberPoint[] }) {
  const colors = useChartColors();
  const [simple, setSimple] = useState(false);

  const comboData: ChartData<"bar" | "line", number[], string> = {
    labels: points.map((item) => item.specialty),
    datasets: [
      {
        type: "bar",
        label: "Writers",
        data: points.map((item) => item.writers),
        backgroundColor: rgba(colors.primary, 0.9),
        yAxisID: "y",
        borderRadius: 4,
        order: 2,
      },
      {
        type: "line",
        label: "TRx/Writer",
        data: points.map((item) => item.prescriptionsPerWriter),
        borderColor: colors.orange,
        backgroundColor: colors.orange,
        yAxisID: "y2",
        pointRadius: 3,
        tension: 0.3,
        order: 1,
      },
    ],
  };

  const comboOptions: ChartOptions<"bar" | "line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, align: "end", labels: { font: { size: 11 }, boxWidth: 12 } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: {
        position: "left",
        grid: { display: false },
        title: { display: true, text: "Writers", font: { size: 9 } },
        ticks: { font: { size: 9 } },
      },
      y2: {
        position: "right",
        grid: { display: false },
        title: { display: true, text: "TRx/Writer", font: { size: 9 } },
        ticks: { font: { size: 9 } },
      },
    },
  };

  const simpleData: ChartData<"bar", number[], string> = {
    labels: points.map((item) => item.specialty),
    datasets: [
      {
        label: "Writers",
        data: points.map((item) => item.writers),
        backgroundColor: colors.primary,
        borderRadius: 4,
        barPercentage: 0.6,
      },
    ],
  };

  const simpleOptions: ChartOptions<"bar"> = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const item = points[context.dataIndex];
            return `${item.writers.toLocaleString()} writers · ${item.prescriptionsPerWriter} Rx/writer`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        title: { display: true, text: "Writers", color: colors.muted, font: { size: 9, weight: 600 } },
        ticks: { font: { size: 9 } },
      },
      y: { grid: { display: false }, ticks: { font: { size: 11 } } },
    },
  };

  return (
    <DashboardCard>
      <CardHeader
        title="Prescriber Breadth vs Depth"
        action={
          <MiniButton onClick={() => setSimple((current) => !current)}>
            {simple ? "Combo View" : "Simple View"}
          </MiniButton>
        }
      />
      <div className="relative mt-2.5 h-[200px]">
        {simple ? <Bar data={simpleData} options={simpleOptions} /> : <Chart type="bar" data={comboData} options={comboOptions} />}
      </div>
    </DashboardCard>
  );
}
