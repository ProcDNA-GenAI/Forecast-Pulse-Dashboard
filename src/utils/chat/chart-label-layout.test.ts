import assert from "node:assert/strict";
import test from "node:test";
import * as echarts from "echarts";
import type { LabelLayoutOptionCallbackParams } from "echarts";
import {
  BAR_LABEL_COLLISION_GAP_PX,
  BAR_LABEL_DISTANCE_PX,
  CHART_GRID_BOTTOM_PX,
  CHART_GRID_TOP_PX,
  VALUE_AXIS_HEADROOM_RATIO,
  barLabelLayout,
  paddedValueAxisMaximum,
} from "./chart-label-layout.ts";

function params(value: number, maxValue: number, seriesIndex: number): LabelLayoutOptionCallbackParams {
  const plotHeight = 200;
  const height = maxValue ? (value / maxValue) * plotHeight : 0;
  return {
    dataIndex: 0,
    seriesIndex,
    text: `Series ${seriesIndex}\nValue: ${value.toLocaleString("en-US")}`,
    align: "center",
    verticalAlign: "bottom",
    rect: { x: seriesIndex * 100, y: plotHeight - height, width: 70, height },
    labelRect: { x: seriesIndex * 100 - 55, y: plotHeight - height - 34, width: 110, height: 26 },
  };
}

const datasets = [
  [54_500, 2_600, 500],
  [54_500, 2_600, 100],
  [50_000, 500, 450],
  [10_000, 9_500, 9_000],
  [100, 50, 1],
  [100, 100, 100],
  [100, 0, 50],
  [9_000_000_000, 800_000_000, 1],
];

test("all requested value ranges keep overlap hiding disabled", () => {
  for (const values of datasets) {
    const maxValue = Math.max(...values);
    values.forEach((value, seriesIndex) => {
      const layout = barLabelLayout({
        params: params(value, maxValue, seriesIndex),
        horizontal: false,
        viewport: { width: 460, height: 290 },
      });
      assert.equal(layout.hideOverlap, false);
      assert.equal(layout.moveOverlap, "shiftY");
    });
  }
});

test("neighboring tiny bars start on separate vertical tiers", () => {
  const green = barLabelLayout({
    params: params(500, 50_000, 1),
    horizontal: false,
    viewport: { width: 460, height: 290 },
  });
  const orange = barLabelLayout({
    params: params(450, 50_000, 2),
    horizontal: false,
    viewport: { width: 460, height: 290 },
  });
  assert.ok(Number(green.dy) <= -BAR_LABEL_COLLISION_GAP_PX);
  assert.ok(Number(orange.dy) < Number(green.dy));
});

test("tall bars stay centered at their natural outside position", () => {
  const layout = barLabelLayout({
    params: params(9_500, 10_000, 1),
    horizontal: false,
    viewport: { width: 460, height: 290 },
  });
  assert.equal(layout.dy, 0);
});

test("positive value axes receive twenty percent label headroom", () => {
  assert.equal(paddedValueAxisMaximum(54_500), 54_500 * VALUE_AXIS_HEADROOM_RATIO);
  assert.equal(paddedValueAxisMaximum(1), 1.2);
  assert.equal(paddedValueAxisMaximum(0), 0);
});

test("ECharts SVG rendering retains every non-zero label for all requested datasets", () => {
  for (const values of datasets) {
    const viewport = { width: 466, height: 290 };
    const chart = echarts.init(null, undefined, { renderer: "svg", ssr: true, ...viewport });
    chart.setOption({
      animation: false,
      legend: { top: 8 },
      grid: {
        left: 44,
        right: 18,
        top: CHART_GRID_TOP_PX,
        bottom: CHART_GRID_BOTTOM_PX,
        containLabel: true,
      },
      xAxis: { type: "category", data: ["Share gain is the larger direct contributor"] },
      yAxis: { type: "value", max: ({ max }: { max: number }) => paddedValueAxisMaximum(max) },
      series: values.map((value, seriesIndex) => ({
        name: `Contribution ${seriesIndex + 1}`,
        type: "bar",
        data: [value],
        label: {
          show: true,
          position: "top",
          distance: BAR_LABEL_DISTANCE_PX,
          padding: [4, 4],
          fontSize: 9,
          lineHeight: 12,
          formatter: `Contribution ${seriesIndex + 1}\nValue: ${value.toLocaleString("en-US")}`,
        },
        labelLayout: (labelParams: LabelLayoutOptionCallbackParams) => barLabelLayout({
          params: labelParams,
          horizontal: false,
          viewport,
        }),
      })),
    });
    const svg = chart.renderToSVGString();
    values.forEach((value, seriesIndex) => {
      if (value === 0) return;
      assert.match(svg, new RegExp(`Contribution ${seriesIndex + 1}`));
      assert.ok(svg.includes(`Value: ${value.toLocaleString("en-US")}`));
    });

    const labelRects = chart.getZr().storage.getDisplayList().flatMap((element) => {
      const text = (element as unknown as { style?: { text?: unknown } }).style?.text;
      if (typeof text !== "string" || !text.startsWith("Value:")) return [];
      const rect = element.getBoundingRect().clone();
      const transform = element.getComputedTransform();
      if (transform) rect.applyTransform(transform);
      return [rect];
    });
    chart.dispose();
    assert.equal(labelRects.length, 3);
    for (let first = 0; first < labelRects.length; first += 1) {
      const a = labelRects[first];
      assert.ok(a.x >= 0 && a.y >= 0 && a.x + a.width <= viewport.width && a.y + a.height <= viewport.height);
      for (let second = first + 1; second < labelRects.length; second += 1) {
        const b = labelRects[second];
        const overlaps = a.x < b.x + b.width
          && a.x + a.width > b.x
          && a.y < b.y + b.height
          && a.y + a.height > b.y;
        assert.equal(overlaps, false);
      }
    }
  }
});
