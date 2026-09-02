export type SegmentGroup = "ascvd" | "ppt2d" | "ppno";
export type AssumptionStatus = "On Track" | "Watch" | "Off Track";
export type AssumptionUnit = "percent" | "months";

export type MarketPoint = {
  year: number;
  forecast: number;
  actual: number;
};

export type PatientSegment = {
  name: string;
  forecast: number;
  latest: number;
  change: number;
  group: SegmentGroup;
};

export type ComparisonPoint = {
  label: string;
  forecast: number;
  actual: number;
};

export type TrendPoint = {
  label: string;
  value: number;
};

export type InflowPoint = {
  label: string;
  newlyIntensified: number;
  switchFromAdvanced: number;
  other: number;
};

export type Assumption = {
  name: string;
  plan: number;
  current: number;
  variance: number;
  unit: AssumptionUnit;
  sourceStatus: string;
  status: AssumptionStatus;
  planDigits: number;
  currentDigits: number;
};

export type DashboardData = {
  meta: {
    productName: string;
  };
  market: MarketPoint[];
  segments: PatientSegment[];
  npsShare: ComparisonPoint[];
  advancedPool: TrendPoint[];
  activeHcp: TrendPoint[];
  inflow: InflowPoint[];
  demand: ComparisonPoint[];
  persistency: ComparisonPoint[];
  assumptions: Assumption[];
};
