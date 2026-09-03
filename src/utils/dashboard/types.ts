export type SegmentGroup = "ascvd" | "ppt2d" | "ppno";
export type AssumptionStatus = "On Track" | "Watch" | "Take Action";
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

export type NpsPoint = ComparisonPoint & {
  forecastCount: number;
  actualCount: number;
};

export type ProductMixShare = {
  product: string;
  share: number;
};

export type ProductMixPoint = {
  label: string;
  totalPatientsMillions: number;
  shares: ProductMixShare[];
};

export type PrescriberPoint = {
  specialty: string;
  writers: number;
  prescriptionsPerWriter: number;
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
  forecast: number;
  current: number;
  variance: number;
  unit: AssumptionUnit;
  source: string;
  sourceStatus: string;
  status: AssumptionStatus;
  forecastDigits: number;
  currentDigits: number;
};

export type DashboardData = {
  meta: {
    productName: string;
  };
  market: MarketPoint[];
  segments: PatientSegment[];
  npsShare: NpsPoint[];
  productMix: ProductMixPoint[];
  advancedPool: TrendPoint[];
  activeHcp: TrendPoint[];
  inflow: InflowPoint[];
  demand: ComparisonPoint[];
  persistency: ComparisonPoint[];
  compliance: ComparisonPoint[];
  prescribers: PrescriberPoint[];
  assumptions: Assumption[];
};
