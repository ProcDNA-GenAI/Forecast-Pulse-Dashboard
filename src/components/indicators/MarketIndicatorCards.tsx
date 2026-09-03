"use client";

import { useMemo, useState } from "react";
import { Bar, Chart, Doughnut, Line } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import { useDashboard } from "@/components/dashboard/DashboardProvider";
import { CardHeader, DashboardCard } from "@/components/dashboard/DashboardCard";
import { DataTag, Legend, LegendItem, MiniButton } from "@/components/dashboard/DashboardControls";
import { rgba, useChartColors, type ChartColors } from "@/components/charts/chartSetup";
import { takeForBucket } from "@/utils/dashboard/formatters";
import type {
  ComparisonPoint,
  InflowPoint,
  NpsPoint,
  PrescriberPoint,
  ProductMixPoint,
  TrendPoint,
} from "@/utils/dashboard/types";
import { ACTUALS_PERIOD, FORECAST_LABEL, FORECAST_REFRESH_PERIOD } from "@/utils/dashboard/periods";

function colorFromToken(colors: ChartColors, token: keyof ChartColors): string {
  return colors[token];
}

function cssVariableForToken(token: string): string {
  return `var(--color-${token})`;
}

const productColorTokens = ["accent", "pink", "teal", "violet", "orange"] as const;

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
          return mode === "pct" ? share * 100 : Number((share * point.totalPatientsMillions).toFixed(3));
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
            const value = Number(context.parsed.y);
            return `${context.dataset.label}: ${mode === "pct" ? `${value.toFixed(1)}%` : `${value.toFixed(2)}M`}`;
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
        grid: { color: colors.grid },
        ticks: {
          font: { size: 9 },
          callback: (value) => (mode === "pct" ? `${value}%` : `${Number(value).toFixed(2)}M`),
        },
      },
    },
  };

  return (
    <DashboardCard>
      <CardHeader
        title="LLT product mix"
        subtitle="monthly share of the non-statin add-on class"
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
  const firstPeriod = visible[0]?.label ?? ACTUALS_PERIOD;
  const lastPeriod = visible.at(-1)?.label ?? ACTUALS_PERIOD;
  const actualsLabel = `Actuals (${firstPeriod}–${lastPeriod})`;

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
        borderColor: colors.muted,
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
            return `${context.dataset.label}: ${mode === "share" ? `${value.toFixed(1)}% share` : `${Math.round(value).toLocaleString()} NPS`}`;
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 9 } } },
      y: {
        grid: { color: colors.grid },
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
        title={`${productName} NPS ${mode === "share" ? "market share" : "counts"}`}
        subtitle="Actual calendar months"
        action={
          <MiniButton onClick={() => setMode((current) => (current === "share" ? "count" : "share"))}>
            {mode === "share" ? "Show NPS counts" : "Show NPS share"}
          </MiniButton>
        }
      />
      <Legend>
        <LegendItem color="var(--color-orange)" kind="line" label={actualsLabel} />
        <LegendItem color="var(--color-muted)" kind="line" dashed label={FORECAST_LABEL} />
      </Legend>
      <div className="relative mt-2.5 h-[210px]">
        <Line data={data} options={options} />
      </div>
      <p className="mt-1.5 text-[10.5px] text-muted">
        Market basket: {productName}, Ezetimibe, Repatha, Praluent, Leqvio, Nexletol.
      </p>
    </DashboardCard>
  );
}

type TrendCardProps = {
  title: string;
  points: TrendPoint[];
  colorToken: "tertiary" | "teal";
  valueLabel: (value: number) => string;
  tickLabel: (value: number) => string;
};

export function TrendCard({ title, points, colorToken, valueLabel, tickLabel }: TrendCardProps) {
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
      y: { grid: { color: colors.grid }, ticks: { font: { size: 8 }, callback: (value) => tickLabel(Number(value)) } },
    },
  };

  return (
    <DashboardCard>
      <CardHeader title={title} />
      <div className="relative mt-2.5 h-[190px]">
        <Line data={data} options={options} />
      </div>
    </DashboardCard>
  );
}

export function PatientInflowCard({ points, productName }: { points: InflowPoint[]; productName: string }) {
  const { bucket } = useDashboard();
  const colors = useChartColors();
  const visible = takeForBucket(points, bucket);
  const periodLabel = `${visible[0]?.label ?? ACTUALS_PERIOD}–${visible.at(-1)?.label ?? ACTUALS_PERIOD}`;

  const data: ChartData<"line", number[], string> = {
    labels: visible.map((point) => point.label),
    datasets: [
      {
        label: "Newly intensified",
        data: visible.map((point) => point.newlyIntensified * 100),
        borderColor: colors.teal,
        backgroundColor: rgba(colors.teal, 0.85),
        fill: true,
        stack: "source",
        pointRadius: 0,
        tension: 0.25,
      },
      {
        label: "Switch from advanced",
        data: visible.map((point) => point.switchFromAdvanced * 100),
        borderColor: colors.secondary,
        backgroundColor: rgba(colors.secondary, 0.85),
        fill: true,
        stack: "source",
        pointRadius: 0,
        tension: 0.25,
      },
      {
        label: "Other",
        data: visible.map((point) => point.other * 100),
        borderColor: colors.muted,
        backgroundColor: rgba(colors.muted, 0.7),
        fill: true,
        stack: "source",
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
      tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${Number(context.parsed.y).toFixed(0)}%` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 9 } } },
      y: {
        stacked: true,
        max: 100,
        grid: { color: colors.grid },
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
        backgroundColor: [rgba(colors.teal, 0.9), rgba(colors.secondary, 0.9), rgba(colors.muted, 0.75)],
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
      tooltip: { callbacks: { label: (context) => `${context.label}: ${Number(context.parsed).toFixed(0)}%` } },
    },
  };

  return (
    <DashboardCard>
      <CardHeader title={`${productName} patient inflow source`} action={<DataTag>{periodLabel}</DataTag>} />
      <Legend>
        <LegendItem color="var(--color-teal)" label="Newly intensified" />
        <LegendItem color="var(--color-secondary)" label="Switch from advanced" />
        <LegendItem color="var(--color-muted)" label="Other" />
      </Legend>
      <div className="mt-2.5 grid gap-5 lg:grid-cols-[minmax(0,1.75fr)_minmax(220px,0.7fr)] lg:items-center">
        <div className="relative h-[220px]">
          <Line data={data} options={options} />
        </div>
        <div className="rounded-xl border border-border bg-page/60 px-3 py-3">
          <p className="mb-1 text-center text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">
            Overall mix ({periodLabel})
          </p>
          <div className="relative mx-auto h-[170px] max-w-[230px]">
            <Doughnut data={overallData} options={overallOptions} />
          </div>
          <div className="mt-1 grid grid-cols-3 gap-1 text-center">
            {overallShares.map((value, index) => (
              <div key={overallData.labels?.[index] as string}>
                <div className="text-sm font-bold text-primary">{(value * 100).toFixed(0)}%</div>
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

export function PersistencyCard({ points, productName }: { points: ComparisonPoint[]; productName: string }) {
  const { bucket } = useDashboard();
  const colors = useChartColors();
  const visible = takeForBucket(points, bucket);

  const data: ChartData<"line", number[], string> = {
    labels: visible.map((point) => point.label),
    datasets: [
      {
        label: `${productName} persistency`,
        data: visible.map((point) => point.actual * 100),
        borderColor: colors.orange,
        borderWidth: 2.6,
        pointRadius: 3,
        tension: 0.2,
      },
      {
        label: `Blended forecast curve (${FORECAST_REFRESH_PERIOD})`,
        data: visible.map((point) => point.forecast * 100),
        borderColor: colors.muted,
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
      tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${Number(context.parsed.y).toFixed(0)}%` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 9 } } },
      y: {
        min: 50,
        max: 100,
        grid: { color: colors.grid },
        ticks: { font: { size: 9 }, callback: (value) => `${value}%` },
      },
    },
  };

  return (
    <DashboardCard>
      <CardHeader title="Persistency" />
      <Legend>
        <LegendItem color="var(--color-orange)" kind="line" label={`${productName} persistency`} />
        <LegendItem color="var(--color-muted)" kind="line" dashed label={`Blended forecast curve (${FORECAST_REFRESH_PERIOD})`} />
      </Legend>
      <div className="relative mt-2.5 h-[200px]">
        <Line data={data} options={options} />
      </div>
    </DashboardCard>
  );
}

export function ComplianceCard({ points, productName }: { points: ComparisonPoint[]; productName: string }) {
  const { bucket } = useDashboard();
  const colors = useChartColors();
  const visible = takeForBucket(points, bucket);
  const actualsLabel = `${productName} compliance (${visible[0]?.label ?? ACTUALS_PERIOD}–${visible.at(-1)?.label ?? ACTUALS_PERIOD})`;

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
        borderColor: colors.muted,
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
      tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${Number(context.parsed.y).toFixed(0)}%` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 9 } } },
      y: {
        min: 70,
        max: 90,
        grid: { color: colors.grid },
        ticks: { font: { size: 9 }, callback: (value) => `${value}%` },
      },
    },
  };

  return (
    <DashboardCard>
      <CardHeader title="Compliance" subtitle="claims-based medication adherence" />
      <Legend>
        <LegendItem color="var(--color-teal)" kind="line" label={actualsLabel} />
        <LegendItem color="var(--color-muted)" kind="line" dashed label={FORECAST_LABEL} />
      </Legend>
      <div className="relative mt-2.5 h-[200px]">
        <Line data={data} options={options} />
      </div>
      <p className="mt-1.5 text-[10.5px] text-muted">Illustrative claims data; replace with the ongoing claims feed when available.</p>
    </DashboardCard>
  );
}

export function DemandCard({ points }: { points: ComparisonPoint[] }) {
  const { bucket } = useDashboard();
  const colors = useChartColors();
  const visible = takeForBucket(points, bucket);

  const data: ChartData<"bar", number[], string> = {
    labels: visible.map((point) => point.label),
    datasets: [
      {
        label: `Forecast NPS (${FORECAST_REFRESH_PERIOD})`,
        data: visible.map((point) => point.forecast),
        backgroundColor: rgba(colors.muted, 0.55),
        borderRadius: 3,
      },
      {
        label: `Actual NPS (through ${visible.at(-1)?.label ?? ACTUALS_PERIOD})`,
        data: visible.map((point) => point.actual),
        backgroundColor: rgba(colors.orange, 0.9),
        borderRadius: 3,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${Math.round(Number(context.parsed.y)).toLocaleString()}`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 9 } } },
      y: {
        grid: { color: colors.grid },
        ticks: { font: { size: 9 }, callback: (value) => `${Number(value) / 1000}k` },
      },
    },
  };

  return (
    <DashboardCard>
      <CardHeader title={`New-patient demand (NPS) — vs ${FORECAST_LABEL.toLowerCase()}`} />
      <Legend>
        <LegendItem color="var(--color-orange)" label={`Actual NPS (through ${visible.at(-1)?.label ?? ACTUALS_PERIOD})`} />
        <LegendItem color="var(--color-muted)" label={`Forecast NPS (${FORECAST_REFRESH_PERIOD})`} />
      </Legend>
      <div className="relative mt-2.5 h-[200px]">
        <Bar data={data} options={options} />
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
        backgroundColor: rgba(colors.secondary, 0.85),
        yAxisID: "y",
        borderRadius: 4,
        order: 2,
      },
      {
        type: "line",
        label: "TRx / writer",
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
      legend: { display: true, labels: { font: { size: 11 }, boxWidth: 12 } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: {
        position: "left",
        grid: { color: colors.grid },
        title: { display: true, text: "Writers", font: { size: 9 } },
        ticks: { font: { size: 9 } },
      },
      y2: {
        position: "right",
        grid: { display: false },
        title: { display: true, text: "TRx/writer", font: { size: 9 } },
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
        backgroundColor: colors.secondary,
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
      x: { grid: { color: colors.grid }, ticks: { font: { size: 9 } } },
      y: { grid: { display: false }, ticks: { font: { size: 11 } } },
    },
  };

  return (
    <DashboardCard>
      <CardHeader
        title="Prescriber breadth vs depth"
        action={
          <div className="flex items-center gap-1.5">
            <DataTag>time n/a</DataTag>
            <MiniButton onClick={() => setSimple((current) => !current)}>
              {simple ? "Combo view" : "Simple view"}
            </MiniButton>
          </div>
        }
      />
      <div className="relative mt-2.5 h-[200px]">
        {simple ? <Bar data={simpleData} options={simpleOptions} /> : <Chart type="bar" data={comboData} options={comboOptions} />}
      </div>
    </DashboardCard>
  );
}
