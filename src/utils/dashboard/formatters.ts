import type { Assumption, ComparisonPoint, TrendPoint } from "./types";
import type { TimeBucket } from "@/components/dashboard/DashboardProvider";

export function takeForBucket<T>(items: T[], bucket: TimeBucket): T[] {
  const requestedLength = bucket === "QTD" ? 3 : bucket === "YTD" ? 12 : items.length;
  return items.slice(-Math.min(requestedLength, items.length));
}

export function formatDecimal(value: number, digits = 1): string {
  return Number(value.toFixed(digits)).toLocaleString("en-US", {
    maximumFractionDigits: digits,
  });
}

export function formatMillions(value: number, digits = 1): string {
  return `${formatDecimal(value / 1_000_000, digits)}M`;
}

export function formatPercent(value: number, digits = 1): string {
  return `${formatDecimal(value * 100, digits)}%`;
}

export function formatPercentPoints(value: number, digits = 1): string {
  const prefix = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${prefix}${formatDecimal(Math.abs(value * 100), digits)}pp`;
}

export function formatSignedPercent(value: number, digits = 1): string {
  const prefix = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${prefix}${formatDecimal(Math.abs(value * 100), digits)}%`;
}

export function formatAssumptionValue(assumption: Assumption, value: number, digits: number): string {
  if (assumption.unit === "months") {
    return `${formatDecimal(value, digits)} mo`;
  }

  return formatPercent(value, digits);
}

export function formatAssumptionVariance(assumption: Assumption): string {
  const prefix = assumption.variance > 0 ? "+" : assumption.variance < 0 ? "−" : "";
  const absolute = Math.abs(assumption.variance);

  if (assumption.unit === "months") {
    return `${prefix}${formatDecimal(absolute, 1)} mo`;
  }

  return `${prefix}${formatDecimal(absolute * 100, 1)} pt`;
}

export function latestPoint(points: TrendPoint[]): TrendPoint {
  const point = points.at(-1);

  if (!point) {
    throw new Error("Expected at least one trend point.");
  }

  return point;
}

export function latestComparison(points: ComparisonPoint[]): ComparisonPoint {
  const point = points.at(-1);

  if (!point) {
    throw new Error("Expected at least one comparison point.");
  }

  return point;
}
