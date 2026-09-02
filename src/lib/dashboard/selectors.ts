import type {
  Assumption,
  AssumptionStatus,
  MarketPoint,
  PatientSegment,
  SegmentGroup,
} from "./types";

export type SegmentMovement = {
  name: string;
  forecast: number;
  latest: number;
  change: number;
};

export function calculateCagr(points: MarketPoint[], key: "forecast" | "actual"): number {
  const first = points[0];
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

export function aggregateSegmentMovements(segments: PatientSegment[]): SegmentMovement[] {
  const labels: Record<SegmentGroup, string> = {
    ascvd: "ASCVD",
    ppt2d: "Primary Prevention with T2D",
    ppno: "Primary Prevention (no T2D)",
  };
  const groups: SegmentGroup[] = ["ascvd", "ppt2d", "ppno"];

  return groups.map((group) => {
    const groupSegments = segments.filter((segment) => segment.group === group);
    const forecast = groupSegments.reduce((total, segment) => total + segment.forecast, 0);
    const latest = groupSegments.reduce((total, segment) => total + segment.latest, 0);

    return {
      name: labels[group],
      forecast,
      latest,
      change: latest - forecast,
    };
  });
}

export function assumptionCounts(assumptions: Assumption[]): Record<AssumptionStatus, number> {
  return assumptions.reduce<Record<AssumptionStatus, number>>(
    (counts, assumption) => {
      counts[assumption.status] += 1;
      return counts;
    },
    { "On Track": 0, Watch: 0, "Off Track": 0 },
  );
}
