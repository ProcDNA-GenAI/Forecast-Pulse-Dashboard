"use client";

import { useMemo, useState } from "react";
import { Bar, Chart, Line } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import { useDashboard } from "@/components/dashboard/DashboardProvider";
import { CardHeader, DashboardCard } from "@/components/dashboard/DashboardCard";
import { DataTag, Legend, LegendItem, MiniButton } from "@/components/dashboard/DashboardControls";
import { rgba, useChartColors, type ChartColors } from "@/components/charts/chartSetup";
import { getProductMixSeries, prescriberBreadthDepth, productMixLabels, productMixPatientPool } from "@/utils/dashboard/hardcoded-series";
import { takeForBucket } from "@/utils/dashboard/formatters";
import type { ComparisonPoint, InflowPoint, TrendPoint } from "@/utils/dashboard/types";

function colorFromToken(colors: ChartColors, token: keyof ChartColors): string {
  return colors[token];
}

function cssVariableForToken(token: string): string {
  return `var(--color-${token})`;
}

export function ProductMixCard({ productName }: { productName: string }) {
  const { bucket } = useDashboard();
  const colors = useChartColors();
  const [mode, setMode] = useState<"pct" | "count">("pct");
  const labels = takeForBucket(productMixLabels, bucket);
  const visibleLength = labels.length;
  const patientPool = productMixPatientPool.slice(-visibleLength);
  const series = useMemo(() => getProductMixSeries(productName), [productName]);

  const data: ChartData<"bar", number[], string> = {
    labels,
    datasets: series.map((item) => {
      const shares = item.values.slice(-visibleLength);
      const values =
        mode === "pct"
          ? shares
          : shares.map((share, index) => Number(((share / 100) * patientPool[index]).toFixed(3)));

      return {
        label: item.label,
        data: values,
        backgroundColor: rgba(colorFromToken(colors, item.colorToken), 0.92),
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
        {series.map((item) => (
          <LegendItem key={item.label} label={item.label} color={cssVariableForToken(item.colorToken)} />
        ))}
      </Legend>
      <div className="relative mt-2.5 h-[210px]">
        <Bar data={data} options={options} />
      </div>
    </DashboardCard>
  );
}

export function NpsMarketShareCard({ points, productName }: { points: ComparisonPoint[]; productName: string }) {
  const { bucket } = useDashboard();
  const colors = useChartColors();
  const visible = takeForBucket(points, bucket);

  const data: ChartData<"line", number[], string> = {
    labels: visible.map((point) => point.label),
    datasets: [
      {
        label: "Observed",
        data: visible.map((point) => point.actual * 100),
        borderColor: colors.orange,
        borderWidth: 2.6,
        pointRadius: 2,
        tension: 0.3,
      },
      {
        label: "Forecast",
        data: visible.map((point) => point.forecast * 100),
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
          label: (context) => `${context.dataset.label}: ${Number(context.parsed.y).toFixed(1)}% NPS share`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 9 } } },
      y: {
        grid: { color: colors.grid },
        title: { display: true, text: "NPS Share", font: { size: 9 } },
        ticks: { font: { size: 9 }, callback: (value) => `${value}%` },
      },
    },
  };

  return (
    <DashboardCard>
      <CardHeader title="NPS Market Share" />
      <Legend>
        <LegendItem color="var(--color-orange)" kind="line" label="Observed" />
        <LegendItem color="var(--color-muted)" kind="line" dashed label="Forecast" />
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

  return (
    <DashboardCard>
      <CardHeader title="Patient Inflow Source" />
      <Legend>
        <LegendItem color="var(--color-teal)" label="Newly intensified" />
        <LegendItem color="var(--color-secondary)" label="Switch from advanced" />
        <LegendItem color="var(--color-muted)" label="Other" />
      </Legend>
      <div className="relative mt-2.5 h-[200px]">
        <Line data={data} options={options} />
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
        label: "Blended forecast curve",
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
        <LegendItem color="var(--color-muted)" kind="line" dashed label="Blended forecast curve" />
      </Legend>
      <div className="relative mt-2.5 h-[200px]">
        <Line data={data} options={options} />
      </div>
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
        label: "Forecast NPS",
        data: visible.map((point) => point.forecast),
        backgroundColor: rgba(colors.muted, 0.55),
        borderRadius: 3,
      },
      {
        label: "Actual NPS",
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
      <CardHeader title="New-patient demand (NPS) — vs forecast" />
      <Legend>
        <LegendItem color="var(--color-orange)" label="Actual NPS" />
        <LegendItem color="var(--color-muted)" label="Forecast NPS" />
      </Legend>
      <div className="relative mt-2.5 h-[200px]">
        <Bar data={data} options={options} />
      </div>
    </DashboardCard>
  );
}

export function PrescriberCard() {
  const colors = useChartColors();
  const [simple, setSimple] = useState(false);

  const comboData: ChartData<"bar" | "line", number[], string> = {
    labels: prescriberBreadthDepth.map((item) => item.specialty),
    datasets: [
      {
        type: "bar",
        label: "Writers",
        data: prescriberBreadthDepth.map((item) => item.writers),
        backgroundColor: rgba(colors.secondary, 0.85),
        yAxisID: "y",
        borderRadius: 4,
        order: 2,
      },
      {
        type: "line",
        label: "TRx / writer",
        data: prescriberBreadthDepth.map((item) => item.prescriptionsPerWriter),
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
    labels: prescriberBreadthDepth.map((item) => item.specialty),
    datasets: [
      {
        label: "Writers",
        data: prescriberBreadthDepth.map((item) => item.writers),
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
            const item = prescriberBreadthDepth[context.dataIndex];
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
