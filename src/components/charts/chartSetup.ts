"use client";

import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  DoughnutController,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { useEffect, useState } from "react";

ChartJS.register(
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  DoughnutController,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
);

export type ChartColors = {
  primary: string;
  secondary: string;
  tertiary: string;
  accent: string;
  success: string;
  danger: string;
  orange: string;
  teal: string;
  violet: string;
  pink: string;
  muted: string;
  grid: string;
};

const fallbackColors: ChartColors = {
  primary: "#0c447c",
  secondary: "#185fa5",
  tertiary: "#2a78d6",
  accent: "#eda100",
  success: "#1d9e5a",
  danger: "#d1523a",
  orange: "#eb6834",
  teal: "#1baf7a",
  violet: "#4a3aa7",
  pink: "#e87ba4",
  muted: "#9b9a92",
  grid: "#e9e8e1",
};

function cssColor(styles: CSSStyleDeclaration, variable: string, fallback: string): string {
  return styles.getPropertyValue(variable).trim() || fallback;
}

export function useChartColors(): ChartColors {
  const [colors, setColors] = useState(fallbackColors);

  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    setColors({
      primary: cssColor(styles, "--color-primary", fallbackColors.primary),
      secondary: cssColor(styles, "--color-secondary", fallbackColors.secondary),
      tertiary: cssColor(styles, "--color-tertiary", fallbackColors.tertiary),
      accent: cssColor(styles, "--color-accent", fallbackColors.accent),
      success: cssColor(styles, "--color-success", fallbackColors.success),
      danger: cssColor(styles, "--color-danger", fallbackColors.danger),
      orange: cssColor(styles, "--color-orange", fallbackColors.orange),
      teal: cssColor(styles, "--color-teal", fallbackColors.teal),
      violet: cssColor(styles, "--color-violet", fallbackColors.violet),
      pink: cssColor(styles, "--color-pink", fallbackColors.pink),
      muted: cssColor(styles, "--color-muted", fallbackColors.muted),
      grid: cssColor(styles, "--color-grid", fallbackColors.grid),
    });
  }, []);

  return colors;
}

export function rgba(hex: string, alpha: number): string {
  const numeric = Number.parseInt(hex.slice(1), 16);
  const red = (numeric >> 16) & 255;
  const green = (numeric >> 8) & 255;
  const blue = numeric & 255;
  return `rgba(${red},${green},${blue},${alpha})`;
}

export const chartFont = {
  family: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
};
