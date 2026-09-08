"use client";

import { BarChart3, ChevronDown, Download, Presentation } from "lucide-react";
import * as echarts from "echarts";
import type { LabelLayoutOptionCallbackParams } from "echarts";
import { useEffect, useId, useMemo, useRef, useState, type RefObject } from "react";
import { downloadChartPng, downloadChartPptx, getChartPngDataUrl } from "@/utils/chat/chart-downloads";
import {
  BAR_LABEL_DISTANCE_PX,
  CHART_GRID_BOTTOM_PX,
  CHART_GRID_LEFT_PX,
  CHART_GRID_TOP_PX,
  barLabelLayout,
  categoryAxisLabelLayout,
  niceValueAxisMaximum,
  type ChartViewport,
} from "@/utils/chat/chart-label-layout";
import type { ChartGroup, ChartPayload } from "@/utils/chat/types";

type ChartLabelParams = {
  name?: string;
  seriesName?: string;
  value?: unknown;
  data?: unknown;
  encode?: Record<string, number[]>;
  dimensionNames?: string[];
};

function formatLabelValue(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
  }
  if (typeof value === "string") return value;
  return "";
}

function encodedValue(params: ChartLabelParams): unknown {
  const value = params.value;
  if (typeof value === "number" || typeof value === "string") return value;

  if (Array.isArray(value)) {
    const encodedIndexes = [
      ...(params.encode?.y || []),
      ...(params.encode?.x || []),
      ...(params.encode?.value || []),
    ];
    for (const index of encodedIndexes) {
      const candidate = value[index];
      if (typeof candidate === "number") return candidate;
    }
    return [...value].reverse().find((candidate) => typeof candidate === "number") ?? value.at(-1);
  }

  const record = (value && typeof value === "object" ? value : params.data) as Record<string, unknown> | undefined;
  if (!record) return "";
  const encodedDimensions = [
    ...(params.encode?.y || []),
    ...(params.encode?.x || []),
    ...(params.encode?.value || []),
  ];
  for (const index of encodedDimensions) {
    const dimension = params.dimensionNames?.[index];
    const candidate = dimension ? record[dimension] : undefined;
    if (typeof candidate === "number") return candidate;
  }
  return Object.values(record).find((candidate) => typeof candidate === "number") ?? "";
}

function isHorizontalBar(option: echarts.EChartsOption) {
  const firstAxis = (axis: unknown) => Array.isArray(axis) ? axis[0] : axis;
  const xAxis = firstAxis(option.xAxis) as { type?: string } | undefined;
  const yAxis = firstAxis(option.yAxis) as { type?: string } | undefined;
  return xAxis?.type === "value" && yAxis?.type === "category";
}

function normalizeSeriesLabels(
  series: echarts.EChartsOption["series"],
  horizontalBar: boolean,
  viewport: ChartViewport,
) {
  if (!series) return series;
  const normalizeItem = (item: unknown) => {
    const seriesItem = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const type = String(seriesItem.type || "").toLowerCase();
    const existingLabel = (seriesItem.label && typeof seriesItem.label === "object"
      ? seriesItem.label
      : {}) as Record<string, unknown>;
    const isStacked = Boolean(seriesItem.stack);
    const supported = ["bar", "line", "scatter", "pie", "funnel", "treemap"].includes(type);
    if (!supported) return seriesItem;

    const position = type === "bar"
      ? isStacked ? "inside" : horizontalBar ? "right" : "top"
      : type === "pie" ? "outside"
        : type === "funnel" || type === "treemap" ? "inside"
          : "top";

    return {
      ...seriesItem,
      label: {
        ...existingLabel,
        show: true,
        position,
        distance: isStacked ? 0 : BAR_LABEL_DISTANCE_PX,
        color: isStacked || type === "treemap" ? "#ffffff" : "#4b5563",
        fontSize: 9,
        lineHeight: 12,
        padding: type === "bar" && !isStacked ? [4, 4] : existingLabel.padding,
        formatter: (params: ChartLabelParams) => isStacked
          ? formatLabelValue(encodedValue(params))
          : formatLabelValue(encodedValue(params)),
      },
      labelLayout: type === "bar" && !isStacked
        ? (params: LabelLayoutOptionCallbackParams) => barLabelLayout({ params, horizontal: horizontalBar, viewport })
        : {
            ...(seriesItem.labelLayout && typeof seriesItem.labelLayout === "object" ? seriesItem.labelLayout : {}),
            hideOverlap: true,
          },
    };
  };

  return (Array.isArray(series) ? series.map(normalizeItem) : normalizeItem(series)) as echarts.EChartsOption["series"];
}

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
    yAxis: { type: "value", nameGap: 72, axisLabel: { fontSize: 10 }, splitLine: { show: false } },
    series: valueKeys.map((key) => ({
      name: key,
      type,
      smooth: type === "line",
      data: chart.data.map((row) => row[key] as number),
    })),
  };
}

function normalizeChartOption(option: echarts.EChartsOption, viewport: ChartViewport): echarts.EChartsOption {
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

  const singleGrid = (!Array.isArray(option.grid) && option.grid ? option.grid : {}) as {
    left?: unknown;
    top?: unknown;
    bottom?: unknown;
  };
  const grid = Array.isArray(option.grid)
    ? option.grid.map((item) => ({
        ...item,
        left: Math.max(typeof item.left === "number" ? item.left : 0, CHART_GRID_LEFT_PX),
        top: Math.max(typeof item.top === "number" ? item.top : 0, CHART_GRID_TOP_PX),
        bottom: Math.max(typeof item.bottom === "number" ? item.bottom : 0, CHART_GRID_BOTTOM_PX),
        containLabel: true,
      }))
    : {
        ...(option.grid || {}),
        left: Math.max(typeof singleGrid.left === "number" ? singleGrid.left : 0, CHART_GRID_LEFT_PX),
        top: Math.max(typeof singleGrid.top === "number" ? singleGrid.top : 0, CHART_GRID_TOP_PX),
        bottom: Math.max(
          typeof singleGrid.bottom === "number" ? singleGrid.bottom : 0,
          CHART_GRID_BOTTOM_PX,
        ),
        containLabel: true,
      };

  const normalizeAxis = (axis: unknown, isYAxis: boolean, isValueAxis: boolean): unknown => {
    if (!axis) return axis;

    const normalizeItem = (item: unknown) => {
      const axisItem = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
      const splitLine = (axisItem.splitLine && typeof axisItem.splitLine === "object"
        ? axisItem.splitLine
        : {}) as Record<string, unknown>;
      const axisLabel = (axisItem.axisLabel && typeof axisItem.axisLabel === "object"
        ? axisItem.axisLabel
        : {}) as Record<string, unknown>;
      const existingNameGap = typeof axisItem.nameGap === "number" ? axisItem.nameGap : 0;
      const axisData = Array.isArray(axisItem.data) ? axisItem.data : undefined;
      const dataset = Array.isArray(option.dataset) ? option.dataset[0] : option.dataset;
      const datasetSource = dataset && typeof dataset === "object" && "source" in dataset
        ? dataset.source
        : undefined;
      const categoryCount = axisData?.length
        || (Array.isArray(datasetSource) ? datasetSource.length : 0);
      const categoryLabelPolicy = !isValueAxis && !isYAxis
        ? categoryAxisLabelLayout(categoryCount, viewport.width)
        : {};

      return {
        ...axisItem,
        splitLine: { ...splitLine, show: false },
        axisLabel: {
          ...axisLabel,
          ...categoryLabelPolicy,
          margin: 9,
          ...(isValueAxis && axisLabel.formatter == null
            ? { formatter: (value: unknown) => formatLabelValue(value) }
            : {}),
        },
        ...(isValueAxis && axisItem.max == null
          ? { max: ({ max }: { max: number }) => niceValueAxisMaximum(max) }
          : {}),
        ...(isYAxis && axisItem.name
          ? {
              nameLocation: "middle",
              nameGap: Math.min(Math.max(existingNameGap, 48), 58),
              nameTextStyle: {
                ...((axisItem.nameTextStyle && typeof axisItem.nameTextStyle === "object"
                  ? axisItem.nameTextStyle
                  : {}) as Record<string, unknown>),
                fontSize: 10,
              },
            }
          : {}),
      };
    };

    return Array.isArray(axis) ? axis.map(normalizeItem) : normalizeItem(axis);
  };

  const horizontalBar = isHorizontalBar(option);

  return {
    ...option,
    title,
    legend,
    grid,
    series: normalizeSeriesLabels(option.series, horizontalBar, viewport),
    xAxis: normalizeAxis(option.xAxis, false, horizontalBar) as echarts.EChartsOption["xAxis"],
    yAxis: normalizeAxis(option.yAxis, true, !horizontalBar) as echarts.EChartsOption["yAxis"],
  };
}

function ChartCanvas({ chart, containerRef }: { chart: ChartPayload; containerRef: RefObject<HTMLDivElement | null> }) {
  useEffect(() => {
    if (!containerRef.current) return;
    const instance = echarts.init(containerRef.current);
    const viewport = {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    };
    const option = normalizeChartOption(
      (chart.echartsOption || fallbackOption(chart)) as echarts.EChartsOption,
      viewport,
    );
    instance.setOption({
      ...option,
      animationDuration: 550,
      textStyle: {
        fontFamily: "Segoe UI, Arial, sans-serif",
        color: "#26303a",
        ...((option.textStyle || {}) as object),
      },
    });

    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        viewport.width = containerRef.current.clientWidth;
        viewport.height = containerRef.current.clientHeight;
      }
      instance.resize();
    });
    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      instance.dispose();
    };
  }, [chart, containerRef]);

  return <div ref={containerRef} className="h-[290px] w-full" role="img" aria-label={chart.title || `${chart.kind} chart`} />;
}

export function ChatChartGroup({
  group,
  messageId,
  groupIndex = 0,
}: {
  group: ChartGroup;
  messageId?: number;
  groupIndex?: number;
}) {
  const [selectedIndex, setSelectedIndex] = useState(
    Math.min(Math.max(group.recommendedIndex, 0), group.variants.length - 1),
  );
  const chart = group.variants[selectedIndex];
  const selectId = useId();
  const chartElementRef = useRef<HTMLDivElement>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isDownloadingPptx, setIsDownloadingPptx] = useState(false);
  const options = useMemo(
    () => group.variants.map((item, index) => item.optionLabel || `${item.kind} ${index + 1}`),
    [group.variants],
  );

  if (!chart) return null;

  const chartTitle = group.title || chart.title || "Chart";

  const handlePngDownload = () => {
    setDownloadError(null);
    try {
      downloadChartPng(chartElementRef.current, chartTitle);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "Unable to download the chart image.");
    }
  };

  const handlePptxDownload = async () => {
    if (!messageId) return;
    setDownloadError(null);
    setIsDownloadingPptx(true);
    try {
      const chartImageDataUrl = getChartPngDataUrl(chartElementRef.current, 3);
      await downloadChartPptx({
        messageId,
        chartGroupIndex: groupIndex,
        chartIndex: selectedIndex,
        chart,
        chartImageDataUrl,
      });
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "Unable to download PowerPoint.");
    } finally {
      setIsDownloadingPptx(false);
    }
  };

  return (
    <section className="mt-3 overflow-hidden rounded-xl border border-primary/10 bg-surface shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-primary/10 px-3 py-2.5">
        <BarChart3 className="h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-primary">{chartTitle}</p>
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
        <button
          type="button"
          onClick={handlePngDownload}
          className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg border border-primary/15 bg-page px-2 text-[10px] font-semibold text-primary transition hover:border-secondary/40 hover:bg-secondary/5"
          aria-label={`Download ${chartTitle} as PNG`}
          title="Download PNG"
        >
          <Download className="h-3 w-3" aria-hidden="true" />
          PNG
        </button>
        {messageId ? (
          <button
            type="button"
            disabled={isDownloadingPptx}
            onClick={() => void handlePptxDownload()}
            className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg border border-primary/15 bg-page px-2 text-[10px] font-semibold text-primary transition hover:border-secondary/40 hover:bg-secondary/5 disabled:cursor-wait disabled:opacity-60"
            aria-label={`Download ${chartTitle} as PowerPoint`}
            title="Download PowerPoint"
          >
            <Presentation className="h-3 w-3" aria-hidden="true" />
            {isDownloadingPptx ? "PPTX..." : "PPTX"}
          </button>
        ) : null}
      </div>
      <div className="px-1 py-2"><ChartCanvas chart={chart} containerRef={chartElementRef} /></div>
      {downloadError ? (
        <p className="border-t border-danger/15 bg-danger/5 px-3 py-2 text-[10px] font-medium text-danger" role="alert">
          {downloadError}
        </p>
      ) : null}
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
