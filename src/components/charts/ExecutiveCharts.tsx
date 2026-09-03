"use client";

import { Line } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import { rgba, useChartColors } from "./chartSetup";
import type { MarketPoint } from "@/utils/dashboard/types";
import { ACTUALS_LABEL, FORECAST_LABEL } from "@/utils/dashboard/periods";

export function MarketTrajectoryChart({ points }: { points: MarketPoint[] }) {
  const colors = useChartColors();

  const data: ChartData<"line", number[], number> = {
    labels: points.map((point) => point.year),
    datasets: [
      {
        label: ACTUALS_LABEL,
        data: points.map((point) => point.actual / 1_000_000),
        borderColor: colors.tertiary,
        backgroundColor: rgba(colors.tertiary, 0.1),
        fill: { target: 1 },
        borderWidth: 2.4,
        pointRadius: 0,
        tension: 0.3,
      },
      {
        label: FORECAST_LABEL,
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
