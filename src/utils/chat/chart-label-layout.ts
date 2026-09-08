import type { LabelLayoutOptionCallback, LabelLayoutOptionCallbackParams } from "echarts";

export const BAR_LABEL_DISTANCE_PX = 10;
export const BAR_LABEL_COLLISION_GAP_PX = 8;
export const CHART_GRID_TOP_PX = 82;
export const CHART_GRID_BOTTOM_PX = 66;
export const VALUE_AXIS_HEADROOM_RATIO = 1.2;

export type ChartViewport = {
  width: number;
  height: number;
};

type BarLabelLayoutInput = {
  params: LabelLayoutOptionCallbackParams;
  horizontal: boolean;
  viewport: ChartViewport;
};

/** Add enough value-axis space for a two-line label above the tallest positive bar. */
export function paddedValueAxisMaximum(maxValue: number): number {
  if (!Number.isFinite(maxValue) || maxValue <= 0) return maxValue;
  return maxValue * VALUE_AXIS_HEADROOM_RATIO;
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
