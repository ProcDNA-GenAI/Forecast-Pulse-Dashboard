"use client";

import { BarChart3, ChevronDown } from "lucide-react";
import * as echarts from "echarts";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { ChartGroup, ChartPayload } from "@/utils/chat/types";

function fallbackOption(chart: ChartPayload): echarts.EChartsOption {
  const firstRow = chart.data[0];
  if (!firstRow) return {};
  const keys = Object.keys(firstRow);
  const categoryKey = keys.find((key) => typeof firstRow[key] === "string") || keys[0];
  const valueKeys = keys.filter((key) => key !== categoryKey && typeof firstRow[key] === "number");
  const requestedType = chart.kind.toLowerCase();
  const type = requestedType === "line" ? "line" : requestedType === "scatter" ? "scatter" : "bar";

  return {
    color: ["#185fa5", "#1baf7a", "#eb6834", "#4a3aa7", "#eda100"],
    tooltip: { trigger: "axis" },
    legend: { bottom: 0, textStyle: { fontSize: 10 } },
    grid: { left: 44, right: 18, top: 28, bottom: 54, containLabel: true },
    xAxis: {
      type: "category",
      data: chart.data.map((row) => String(row[categoryKey] ?? "")),
      axisLabel: { fontSize: 10, hideOverlap: true },
    },
    yAxis: { type: "value", axisLabel: { fontSize: 10 } },
    series: valueKeys.map((key) => ({
      name: key,
      type,
      smooth: type === "line",
      data: chart.data.map((row) => row[key] as number),
    })),
  };
}

function normalizeChartOption(option: echarts.EChartsOption): echarts.EChartsOption {
  const title = Array.isArray(option.title)
    ? option.title.map((item) => ({ ...item, show: false }))
    : option.title
      ? { ...option.title, show: false }
      : undefined;

  const legend = Array.isArray(option.legend)
    ? option.legend.map((item) => ({ ...item, top: 8, bottom: undefined }))
    : option.legend
      ? { ...option.legend, top: 8, bottom: undefined }
      : undefined;

  const grid = Array.isArray(option.grid)
    ? option.grid.map((item) => ({ ...item, top: 58 }))
    : { ...(option.grid || {}), top: 58 };

  return {
    ...option,
    title,
    legend,
    grid,
  };
}

function ChartCanvas({ chart }: { chart: ChartPayload }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const instance = echarts.init(containerRef.current);
    const option = normalizeChartOption((chart.echartsOption || fallbackOption(chart)) as echarts.EChartsOption);
    instance.setOption({
      ...option,
      animationDuration: 550,
      textStyle: {
        fontFamily: "Segoe UI, Arial, sans-serif",
        color: "#26303a",
        ...((option.textStyle || {}) as object),
      },
    });

    const observer = new ResizeObserver(() => instance.resize());
    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      instance.dispose();
    };
  }, [chart]);

  return <div ref={containerRef} className="h-[290px] w-full" role="img" aria-label={chart.title || `${chart.kind} chart`} />;
}

export function ChatChartGroup({ group }: { group: ChartGroup }) {
  const [selectedIndex, setSelectedIndex] = useState(
    Math.min(Math.max(group.recommendedIndex, 0), group.variants.length - 1),
  );
  const chart = group.variants[selectedIndex];
  const selectId = useId();
  const options = useMemo(
    () => group.variants.map((item, index) => item.optionLabel || `${item.kind} ${index + 1}`),
    [group.variants],
  );

  if (!chart) return null;

  return (
    <section className="mt-3 overflow-hidden rounded-xl border border-primary/10 bg-surface shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-primary/10 px-3 py-2.5">
        <BarChart3 className="h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-primary">{group.title || chart.title || "Chart"}</p>
          {chart.description ? <p className="truncate text-[10px] text-muted">{chart.description}</p> : null}
        </div>
        {group.variants.length > 1 ? (
          <label className="relative" htmlFor={selectId}>
            <span className="sr-only">Chart type</span>
            <select
              id={selectId}
              value={selectedIndex}
              onChange={(event) => setSelectedIndex(Number(event.target.value))}
              className="cursor-pointer appearance-none rounded-lg border border-primary/15 bg-page py-1.5 pl-2.5 pr-7 text-[10px] font-semibold text-primary outline-none focus:border-secondary"
            >
              {options.map((label, index) => <option key={`${label}-${index}`} value={index}>{label}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-primary" aria-hidden="true" />
          </label>
        ) : null}
      </div>
      <div className="px-1 py-2"><ChartCanvas chart={chart} /></div>
      {chart.warnings?.length ? (
        <div className="border-t border-warning/20 bg-warning/5 px-3 py-2 text-[10px] text-content">
          {chart.warnings.join(" ")}
        </div>
      ) : null}
    </section>
  );
}

export function StreamingChatChart({ chart }: { chart: ChartPayload }) {
  return <ChatChartGroup group={{ recommendedIndex: 0, variants: [chart] }} />;
}
