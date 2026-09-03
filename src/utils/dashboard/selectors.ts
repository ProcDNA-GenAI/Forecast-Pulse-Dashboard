import type {
  Assumption,
  AssumptionStatus,
  MarketPoint,
  PatientSegment,
  SegmentGroup,
} from "./types";

export function calculateCagr(
  points: MarketPoint[],
  key: "forecast" | "actual",
  startYear?: number,
): number {
  const first = startYear === undefined ? points[0] : points.find((point) => point.year === startYear);
  const last = points.at(-1);

  if (!first || !last || first[key] <= 0 || last.year <= first.year) {
    throw new Error("Market data is not sufficient to calculate CAGR.");
  }

  return Math.pow(last[key] / first[key], 1 / (last.year - first.year)) - 1;
}

export function marketPointForYear(points: MarketPoint[], year: number): MarketPoint {
  const point = points.find((item) => item.year === year);

  if (!point) {
    throw new Error(`Market data for ${year} was not found.`);
  }

  return point;
}

export function largestSegmentMovers(segments: PatientSegment[], count = 3): PatientSegment[] {
  return [...segments]
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, count);
}

export function assumptionCounts(assumptions: Assumption[]): Record<AssumptionStatus, number> {
  return assumptions.reduce<Record<AssumptionStatus, number>>(
    (counts, assumption) => {
      counts[assumption.status] += 1;
      return counts;
    },
    { "On Track": 0, Watch: 0, "Take Action": 0 },
  );
}

export function segmentGroupLabel(group: SegmentGroup): string {
  const labels: Record<SegmentGroup, string> = {
    ascvd: "ASCVD",
    ppt2d: "PP w/ T2D",
    ppno: "PP w/o T2D",
  };

  return labels[group];
}
