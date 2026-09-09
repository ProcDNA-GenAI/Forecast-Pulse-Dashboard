import assert from "node:assert/strict";
import test from "node:test";
import * as echarts from "echarts";
import type { LabelLayoutOptionCallbackParams } from "echarts";
import {
  BAR_LABEL_COLLISION_GAP_PX,
  BAR_LABEL_DISTANCE_PX,
  CHART_GRID_BOTTOM_PX,
  CHART_GRID_LEFT_PX,
  CHART_GRID_TOP_PX,
  barLabelLayout,
  categoryAxisLabelLayout,
  horizontalBarLabelPosition,
  niceValueAxisMaximum,
} from "./chart-label-layout.ts";

function params(value: number, maxValue: number, seriesIndex: number): LabelLayoutOptionCallbackParams {
  const plotHeight = 200;
  const height = maxValue ? (value / maxValue) * plotHeight : 0;
  return {
    dataIndex: 0,
    seriesIndex,
    text: value.toLocaleString("en-US"),
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

test("positive value axes use clean tick ceilings", () => {
  assert.equal(niceValueAxisMaximum(19.24), 20);
  assert.equal(niceValueAxisMaximum(44.44), 50);
  assert.equal(niceValueAxisMaximum(54_500), 60_000);
  assert.equal(niceValueAxisMaximum(1), 1);
  assert.equal(niceValueAxisMaximum(0), 0);
});

test("horizontal bar labels follow the exposed end of negative bars", () => {
  assert.equal(horizontalBarLabelPosition([-2.2, -1.2, -0.7]), "left");
  assert.equal(horizontalBarLabelPosition([2.2, 1.2, 0.7]), "right");
  assert.equal(horizontalBarLabelPosition([-2.2, 1.2]), "right");
});

test("compact category axes show every label within its available band", () => {
  const layout = categoryAxisLabelLayout(4, 510);
  assert.equal(layout.interval, 0);
  assert.equal(layout.hideOverlap, false);
  assert.ok(Number(layout.width) <= (510 - CHART_GRID_LEFT_PX - 24) / 4);
  assert.deepEqual(categoryAxisLabelLayout(12, 510), { hideOverlap: true });
});

test("competitor chart keeps all categories and its Y-axis title inside the canvas", () => {
  const viewport = { width: 510, height: 290 };
  const categories = ["Ezetimibe", "Bempedoic Acid", "Repatha", "Leqvio"];
  const chart = echarts.init(null, undefined, { renderer: "svg", ssr: true, ...viewport });
  chart.setOption({
    animation: false,
    grid: {
      left: CHART_GRID_LEFT_PX,
      right: 18,
      top: 40,
      bottom: CHART_GRID_BOTTOM_PX,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      name: "Competitor",
      data: categories,
      axisLabel: categoryAxisLabelLayout(categories.length, viewport.width),
    },
    yAxis: {
      type: "value",
      name: "Competitor Share Change (percentage points)",
      nameLocation: "middle",
      nameGap: 58,
      nameTextStyle: { fontSize: 10 },
    },
    series: [{ type: "bar", data: [-3, -1, -1, 0] }],
  });
  const svg = chart.renderToSVGString();
  categories.forEach((category) => assert.ok(svg.includes(category)));

  const axisTitle = chart.getZr().storage.getDisplayList().find((element) => {
    const text = (element as unknown as { style?: { text?: unknown } }).style?.text;
    return text === "Competitor Share Change (percentage points)";
  });
  assert.ok(axisTitle);
  const titleRect = axisTitle.getBoundingRect().clone();
  const transform = axisTitle.getComputedTransform();
  if (transform) titleRect.applyTransform(transform);
  assert.ok(titleRect.x >= 0 && titleRect.x + titleRect.width <= viewport.width);
  chart.dispose();
});

test("negative horizontal competitor bars keep titles, categories, and values visible", () => {
  const viewport = { width: 466, height: 290 };
  const categories = ["Ezetimibe", "Repatha", "Bempedoic", "Leqvio"];
  const values = [-2.2, -1.2, -0.7, 0];
  const chart = echarts.init(null, undefined, { renderer: "svg", ssr: true, ...viewport });
  chart.setOption({
    animation: false,
    grid: { left: 84, right: 44, top: 40, bottom: CHART_GRID_BOTTOM_PX, containLabel: true },
    xAxis: {
      type: "value",
      name: "Competitor Share Change Pp",
      nameLocation: "middle",
      nameGap: 48,
      boundaryGap: ["12%", "12%"],
    },
    yAxis: {
      type: "category",
      name: "Competitor",
      nameLocation: "middle",
      nameGap: 104,
      data: categories,
      axisLabel: { hideOverlap: false, interval: 0, fontSize: 10 },
    },
    series: [{
      type: "bar",
      data: values,
      label: {
        show: true,
        position: horizontalBarLabelPosition(values),
        distance: BAR_LABEL_DISTANCE_PX,
        formatter: ({ value }: { value: number }) => String(value),
      },
    }],
  });

  const displayList = chart.getZr().storage.getDisplayList();
  [...categories, "Competitor", "Competitor Share Change Pp", "-2.2", "-1.2", "-0.7"].forEach((text) => {
    const element = displayList.find((item) => (
      item as unknown as { style?: { text?: unknown } }
    ).style?.text === text);
    assert.ok(element, `missing ${text}`);
    const rect = element.getBoundingRect().clone();
    const transform = element.getComputedTransform();
    if (transform) rect.applyTransform(transform);
    assert.ok(rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= viewport.width && rect.y + rect.height <= viewport.height, `${text} is clipped`);
  });
  chart.dispose();
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
      yAxis: { type: "value", max: ({ max }: { max: number }) => niceValueAxisMaximum(max) },
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
          formatter: value.toLocaleString("en-US"),
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
      assert.ok(svg.includes(value.toLocaleString("en-US")));
    });

    const labelRects = values.map((_value, seriesIndex) => {
      const bar = chart.getModel().getSeriesByIndex(seriesIndex).getData().getItemGraphicEl(0);
      assert.ok(bar);
      const element = bar.getTextContent();
      assert.ok(element);
      const rect = element.getBoundingRect().clone();
      const transform = element.getComputedTransform();
      if (transform) rect.applyTransform(transform);
      return rect;
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
