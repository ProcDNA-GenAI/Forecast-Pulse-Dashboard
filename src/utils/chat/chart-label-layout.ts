import type { LabelLayoutOptionCallback, LabelLayoutOptionCallbackParams } from "echarts";

export const BAR_LABEL_DISTANCE_PX = 10;
export const BAR_LABEL_COLLISION_GAP_PX = 8;
export const CHART_GRID_LEFT_PX = 64;
export const CHART_GRID_TOP_PX = 82;
export const CHART_GRID_BOTTOM_PX = 66;

export type ChartViewport = {
  width: number;
  height: number;
};

export type CategoryAxisLabelLayout = {
  hideOverlap: boolean;
  interval?: number;
  fontSize?: number;
  lineHeight?: number;
  overflow?: "break";
  width?: number;
};

/** Show every label for compact category sets and wrap it within its available band. */
export function categoryAxisLabelLayout(
  categoryCount: number,
  viewportWidth: number,
): CategoryAxisLabelLayout {
  if (!Number.isFinite(categoryCount) || categoryCount <= 0 || categoryCount > 8) {
    return { hideOverlap: true };
  }
  const availablePlotWidth = Math.max(160, viewportWidth - CHART_GRID_LEFT_PX - 24);
  return {
    hideOverlap: false,
    interval: 0,
    fontSize: 9,
    lineHeight: 11,
    overflow: "break",
    width: Math.max(48, Math.floor(availablePlotWidth / categoryCount) - 10),
  };
}

type BarLabelLayoutInput = {
  params: LabelLayoutOptionCallbackParams;
  horizontal: boolean;
  viewport: ChartViewport;
};

/** Round the value-axis ceiling to a clean tick without exposing floating-point headroom values. */
export function niceValueAxisMaximum(maxValue: number): number {
  if (!Number.isFinite(maxValue) || maxValue <= 0) return maxValue;
  const roughStep = maxValue / 5;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalizedStep = roughStep / magnitude;
  const niceStep = normalizedStep <= 1
    ? 1
    : normalizedStep <= 2
      ? 2
      : normalizedStep <= 2.5
        ? 2.5
        : normalizedStep <= 5
          ? 5
          : 10;
  const step = niceStep * magnitude;
  return Number((Math.ceil(maxValue / step) * step).toPrecision(12));
}

/**
 * Keep every bar label visible and let ECharts resolve collisions using the
 * measured label rectangles. Tiny bars receive deterministic, alternating
 * offsets before the collision pass, so adjacent labels do not start merged at
 * the baseline. The padding on the label itself supplies the requested gap.
 */
export function barLabelLayout({
  params,
  horizontal,
  viewport,
}: BarLabelLayoutInput): ReturnType<LabelLayoutOptionCallback> {
  const barSpan = horizontal ? params.rect.width : params.rect.height;
  const plotSpan = horizontal ? viewport.width : viewport.height;
  const smallBarThreshold = Math.max(12, plotSpan * 0.06);
  const isSmallBar = Math.abs(barSpan) < smallBarThreshold;
  const tier = ((params.seriesIndex || 0) + (params.dataIndex || 0)) % 3;
  const stagger = isSmallBar ? BAR_LABEL_COLLISION_GAP_PX + tier * 18 : 0;

  return {
    hideOverlap: false,
    moveOverlap: horizontal ? "shiftX" : "shiftY",
    dx: horizontal ? stagger : 0,
    dy: horizontal || stagger === 0 ? 0 : -stagger,
  };
}
