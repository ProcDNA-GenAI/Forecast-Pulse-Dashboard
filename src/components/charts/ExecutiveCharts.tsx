"use client";

import { Bar, Line } from "react-chartjs-2";
import type { ChartData, ChartOptions, TooltipItem } from "chart.js";
import { rgba, useChartColors } from "./chartSetup";
import type { MarketPoint } from "@/lib/dashboard/types";
import type { SegmentMovement } from "@/lib/dashboard/selectors";

export function MarketTrajectoryChart({ points }: { points: MarketPoint[] }) {
  const colors = useChartColors();

  const data: ChartData<"line", number[], number> = {
    labels: points.map((point) => point.year),
    datasets: [
      {
        label: "Observed",
        data: points.map((point) => point.actual / 1_000_000),
        borderColor: colors.tertiary,
        backgroundColor: rgba(colors.tertiary, 0.1),
        fill: { target: 1 },
        borderWidth: 2.4,
        pointRadius: 0,
        tension: 0.3,
      },
      {
        label: "Plan",
        data: points.map((point) => point.forecast / 1_000_000),
        borderColor: colors.muted,
        borderDash: [5, 4],
        borderWidth: 1.8,
        pointRadius: 0,
        tension: 0.3,
        fill: false,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${Number(context.parsed.y).toFixed(1)}M`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 9 }, maxTicksLimit: 10 },
      },
      y: {
        grid: { color: colors.grid },
        ticks: { font: { size: 9 }, callback: (value) => `${value}M` },
      },
    },
  };

  return <Line data={data} options={options} />;
}

export function SegmentMovementChart({ rows }: { rows: SegmentMovement[] }) {
  const colors = useChartColors();
  const sortedRows = [...rows].sort((a, b) => b.change - a.change);

  const data: ChartData<"bar", [number, number][], string> = {
    labels: sortedRows.map((row) => row.name),
    datasets: [
      {
        label: "Movement",
        data: sortedRows.map((row) => [row.forecast * 100, row.latest * 100]),
        backgroundColor: sortedRows.map((row) =>
          rgba(row.change >= 0 ? colors.success : colors.danger, 0.85),
        ),
        borderRadius: 3,
        barPercentage: 0.7,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<"bar">) => {
            const range = context.raw as [number, number];
            const change = range[1] - range[0];
            const prefix = change > 0 ? "+" : "";
            return `Forecast ${range[0].toFixed(1)}% → Latest ${range[1].toFixed(1)}% (${prefix}${change.toFixed(1)}pp)`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: colors.grid },
        ticks: { font: { size: 9 }, callback: (value) => `${value}%` },
      },
      y: {
        grid: { display: false },
        ticks: { font: { size: sortedRows.length > 3 ? 8.5 : 11 } },
      },
    },
  };

  return <Bar data={data} options={options} />;
}
