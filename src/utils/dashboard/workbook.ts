import "server-only";

import { stat } from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";
import type {
  Assumption,
  AssumptionStatus,
  AssumptionUnit,
  ComparisonPoint,
  DashboardData,
  InflowPoint,
  MarketPoint,
  PatientSegment,
  SegmentGroup,
  TrendPoint,
} from "./types";

const workbookPath = path.join(process.cwd(), "NAP mock data.xlsx");

let cachedModifiedTime = -1;
let cachedDashboardData: Promise<DashboardData> | null = null;

function unwrapCellValue(value: ExcelJS.CellValue): unknown {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;

  if (typeof value === "object") {
    if ("result" in value) return value.result ?? null;
    if ("richText" in value) return value.richText.map((part) => part.text).join("");
    if ("text" in value) return value.text;
  }

  return value;
}

function cellValue(worksheet: ExcelJS.Worksheet, row: number, column: number): unknown {
  return unwrapCellValue(worksheet.getCell(row, column).value);
}

function textValue(value: unknown, context: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Expected text in ${context}.`);
  }

  return value;
}

function numberValue(value: unknown, context: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Expected a number in ${context}.`);
  }

  return value;
}

function optionalNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function requireWorksheet(workbook: ExcelJS.Workbook, name: string): ExcelJS.Worksheet {
  const worksheet = workbook.getWorksheet(name);

  if (!worksheet) {
    throw new Error(`Workbook sheet "${name}" was not found.`);
  }

  return worksheet;
}

function findWorksheet(
  workbook: ExcelJS.Workbook,
  predicate: (worksheet: ExcelJS.Worksheet) => boolean,
  description: string,
): ExcelJS.Worksheet {
  const worksheet = workbook.worksheets.find(predicate);

  if (!worksheet) {
    throw new Error(`Workbook sheet for ${description} was not found.`);
  }

  return worksheet;
}

function findHeaderRow(
  worksheet: ExcelJS.Worksheet,
  expectedByColumn: Array<[number, string]>,
): number {
  for (let rowNumber = 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const matches = expectedByColumn.every(([column, expected]) => {
      return cellValue(worksheet, rowNumber, column) === expected;
    });

    if (matches) return rowNumber;
  }

  const expected = expectedByColumn.map((item) => item[1]).join(", ");
  throw new Error(`Could not find headers "${expected}" in sheet "${worksheet.name}".`);
}

function excelDateLabel(value: unknown, context: string): string {
  let date: Date;

  if (value instanceof Date) {
    date = value;
  } else {
    const serial = numberValue(value, context);
    date = new Date(Date.UTC(1899, 11, 30) + serial * 86_400_000);
  }

  return date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
}

function launchMonthLabel(value: unknown, context: string): string {
  const label = textValue(value, context);

  if (!label.startsWith("M")) return label;

  const monthNumber = Number(label.slice(1));
  return Number.isFinite(monthNumber) ? `M${monthNumber}` : label;
}

function parseMillions(value: unknown, context: string): number {
  if (typeof value === "number") return value;

  const label = textValue(value, context);
  if (!label.endsWith("M")) {
    throw new Error(`Expected a value ending in M in ${context}.`);
  }

  return numberValue(Number(label.slice(0, -1)), context);
}

function parseNumberFromLabel(value: unknown, context: string): number {
  if (typeof value === "number") return value;

  const label = textValue(value, context);
  const separatorIndex = label.indexOf(" ");
  const numericLabel = separatorIndex === -1 ? label : label.slice(0, separatorIndex);
  return numberValue(Number(numericLabel), context);
}

function readProductName(sourceWorksheet: ExcelJS.Worksheet): string {
  const prefix = "Source of ";
  const suffix = " starts";

  if (!sourceWorksheet.name.startsWith(prefix) || !sourceWorksheet.name.endsWith(suffix)) {
    throw new Error("The product name could not be read from the source worksheet name.");
  }

  return sourceWorksheet.name.slice(prefix.length, sourceWorksheet.name.length - suffix.length);
}

function readMarket(worksheet: ExcelJS.Worksheet): MarketPoint[] {
  const headerRow = findHeaderRow(worksheet, [[2, "Year"], [3, "Forecast"], [4, "Actuals"]]);
  const result: MarketPoint[] = [];

  for (let row = headerRow + 1; row <= worksheet.rowCount; row += 1) {
    const year = optionalNumber(cellValue(worksheet, row, 2));
    if (year === null) break;

    result.push({
      year,
      forecast: numberValue(cellValue(worksheet, row, 3), `${worksheet.name}!C${row}`),
      actual: numberValue(cellValue(worksheet, row, 4), `${worksheet.name}!D${row}`),
    });
  }

  return result;
}

function segmentGroup(name: string): SegmentGroup {
  if (name.startsWith("ASCVD")) return "ascvd";
  if (name.startsWith("PP w/T2D")) return "ppt2d";
  return "ppno";
}

function readSegments(worksheet: ExcelJS.Worksheet): PatientSegment[] {
  const headerRow = findHeaderRow(worksheet, [[2, "Patient Segment"], [3, "Patient Split - Forecast"]]);
  const result: PatientSegment[] = [];

  for (let row = headerRow + 1; row <= worksheet.rowCount; row += 1) {
    const rawName = cellValue(worksheet, row, 2);
    if (typeof rawName !== "string" || rawName.startsWith("Total")) break;

    const forecast = numberValue(cellValue(worksheet, row, 3), `${worksheet.name}!C${row}`);
    const latest = numberValue(cellValue(worksheet, row, 4), `${worksheet.name}!D${row}`);

    result.push({
      name: rawName,
      forecast,
      latest,
      change: latest - forecast,
      group: segmentGroup(rawName),
    });
  }

  return result;
}

function readNpsShare(worksheet: ExcelJS.Worksheet): ComparisonPoint[] {
  const headerRow = findHeaderRow(worksheet, [[2, "Month"], [10, "Modelled Curve"]]);
  const result: ComparisonPoint[] = [];

  for (let row = headerRow + 1; row <= worksheet.rowCount; row += 1) {
    const actual = optionalNumber(cellValue(worksheet, row, 11));
    if (actual === null) break;

    result.push({
      label: launchMonthLabel(cellValue(worksheet, row, 2), `${worksheet.name}!B${row}`),
      forecast: numberValue(cellValue(worksheet, row, 10), `${worksheet.name}!J${row}`),
      actual,
    });
  }

  return result;
}

function readInflow(worksheet: ExcelJS.Worksheet): InflowPoint[] {
  const headerRow = findHeaderRow(worksheet, [[2, "Month"], [3, "Newly intensified from conventional LLT"]]);
  const result: InflowPoint[] = [];

  for (let row = headerRow + 1; row <= worksheet.rowCount; row += 1) {
    if (cellValue(worksheet, row, 2) === null) break;

    result.push({
      label: excelDateLabel(cellValue(worksheet, row, 2), `${worksheet.name}!B${row}`),
      newlyIntensified: numberValue(cellValue(worksheet, row, 3), `${worksheet.name}!C${row}`),
      switchFromAdvanced: numberValue(cellValue(worksheet, row, 4), `${worksheet.name}!D${row}`),
      other: numberValue(cellValue(worksheet, row, 5), `${worksheet.name}!E${row}`),
    });
  }

  return result;
}

function readPoolAndHcp(worksheet: ExcelJS.Worksheet): { advancedPool: TrendPoint[]; activeHcp: TrendPoint[] } {
  const headerRow = findHeaderRow(worksheet, [[2, "Month"], [3, "Total advanced LLT patients*"]]);
  const advancedPool: TrendPoint[] = [];
  const activeHcp: TrendPoint[] = [];

  for (let row = headerRow + 1; row <= worksheet.rowCount; row += 1) {
    if (cellValue(worksheet, row, 2) === null) break;
    const label = excelDateLabel(cellValue(worksheet, row, 2), `${worksheet.name}!B${row}`);

    advancedPool.push({
      label,
      value: parseMillions(cellValue(worksheet, row, 3), `${worksheet.name}!C${row}`),
    });
    activeHcp.push({
      label,
      value: numberValue(cellValue(worksheet, row, 5), `${worksheet.name}!E${row}`),
    });
  }

  return { advancedPool, activeHcp };
}

function readDemandAndPersistency(worksheet: ExcelJS.Worksheet): {
  demand: ComparisonPoint[];
  persistency: ComparisonPoint[];
} {
  const headerRow = findHeaderRow(worksheet, [[2, "Month"], [3, "Forecasted NPS"], [7, "Month"]]);
  const demand: ComparisonPoint[] = [];
  const persistency: ComparisonPoint[] = [];

  for (let row = headerRow + 1; row <= worksheet.rowCount; row += 1) {
    const demandActual = optionalNumber(cellValue(worksheet, row, 4));
    const persistencyActual = optionalNumber(cellValue(worksheet, row, 9));
    if (demandActual === null && persistencyActual === null) break;

    if (demandActual !== null) {
      demand.push({
        label: excelDateLabel(cellValue(worksheet, row, 2), `${worksheet.name}!B${row}`),
        forecast: numberValue(cellValue(worksheet, row, 3), `${worksheet.name}!C${row}`),
        actual: demandActual,
      });
    }

    if (persistencyActual !== null) {
      persistency.push({
        label: launchMonthLabel(cellValue(worksheet, row, 7), `${worksheet.name}!G${row}`),
        forecast: numberValue(cellValue(worksheet, row, 8), `${worksheet.name}!H${row}`),
        actual: persistencyActual,
      });
    }
  }

  return { demand, persistency };
}

function mapAssumptionStatus(sourceStatus: string): AssumptionStatus {
  if (sourceStatus === "Monitor") return "Watch";
  if (sourceStatus === "Revalidate") return "Off Track";
  return "On Track";
}

function assumptionUnit(name: string): AssumptionUnit {
  return name.toLowerCase().includes("escalation") ? "months" : "percent";
}

function assumptionDigits(name: string, isPlan: boolean): number {
  if (name === "Market CAGR") return isPlan ? 2 : 1;
  if (name === "Diagnosis rate" || name === "Treatment rate") return 1;
  if (name.toLowerCase().includes("escalation")) return 1;
  return 0;
}

function latestEvidence(worksheet: ExcelJS.Worksheet, row: number): unknown {
  for (const column of [6, 5, 4]) {
    const value = cellValue(worksheet, row, column);
    if (value !== null && value !== "—") return value;
  }

  throw new Error(`No current evidence was found in ${worksheet.name} row ${row}.`);
}

function readAssumptions(worksheet: ExcelJS.Worksheet): Assumption[] {
  const headerRow = findHeaderRow(worksheet, [[2, "Assumption"], [3, "Base Forecast"], [7, "Status"]]);
  const result: Assumption[] = [];

  for (let row = headerRow + 1; row <= worksheet.rowCount; row += 1) {
    const rawName = cellValue(worksheet, row, 2);
    if (typeof rawName !== "string" || rawName.length === 0) break;

    const unit = assumptionUnit(rawName);
    const plan = parseNumberFromLabel(cellValue(worksheet, row, 3), `${worksheet.name}!C${row}`);
    const current = parseNumberFromLabel(latestEvidence(worksheet, row), `${worksheet.name} row ${row}`);
    const sourceStatus = textValue(cellValue(worksheet, row, 7), `${worksheet.name}!G${row}`);

    result.push({
      name: rawName,
      plan,
      current,
      variance: current - plan,
      unit,
      sourceStatus,
      status: mapAssumptionStatus(sourceStatus),
      planDigits: assumptionDigits(rawName, true),
      currentDigits: assumptionDigits(rawName, false),
    });
  }

  return result;
}

async function readDashboardData(): Promise<DashboardData> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(workbookPath);

  const sourceWorksheet = findWorksheet(
    workbook,
    (worksheet) => worksheet.name.startsWith("Source of ") && worksheet.name.endsWith(" starts"),
    "patient starts",
  );
  const demandWorksheet = findWorksheet(
    workbook,
    (worksheet) => worksheet.name.endsWith(" NPS and Persistency"),
    "NPS and persistency",
  );
  const { advancedPool, activeHcp } = readPoolAndHcp(sourceWorksheet);
  const { demand, persistency } = readDemandAndPersistency(demandWorksheet);

  const data: DashboardData = {
    meta: { productName: readProductName(sourceWorksheet) },
    market: readMarket(requireWorksheet(workbook, "Market growth")),
    segments: readSegments(requireWorksheet(workbook, "Patient split")),
    npsShare: readNpsShare(requireWorksheet(workbook, "Product Uptake")),
    advancedPool,
    activeHcp,
    inflow: readInflow(sourceWorksheet),
    demand,
    persistency,
    assumptions: readAssumptions(requireWorksheet(workbook, "Assumption Monitor")),
  };

  validateDashboardData(data);
  return data;
}

function validateDashboardData(data: DashboardData): void {
  const requiredCollections = [
    ["market", data.market.length],
    ["patient segments", data.segments.length],
    ["NPS share", data.npsShare.length],
    ["advanced-LLT pool", data.advancedPool.length],
    ["active HCP universe", data.activeHcp.length],
    ["patient inflow", data.inflow.length],
    ["new-patient demand", data.demand.length],
    ["persistency", data.persistency.length],
    ["assumptions", data.assumptions.length],
  ] as const;

  for (const [label, count] of requiredCollections) {
    if (count === 0) {
      throw new Error(`The workbook did not provide any ${label} data.`);
    }
  }

  const forecastTotal = data.segments.reduce((total, segment) => total + segment.forecast, 0);
  const latestTotal = data.segments.reduce((total, segment) => total + segment.latest, 0);

  if (Math.abs(forecastTotal - 1) > 0.001 || Math.abs(latestTotal - 1) > 0.001) {
    throw new Error("Patient segment percentages must total 100% for both forecast and latest claims.");
  }

  for (const point of data.inflow) {
    const total = point.newlyIntensified + point.switchFromAdvanced + point.other;
    if (Math.abs(total - 1) > 0.001) {
      throw new Error(`Patient inflow percentages for ${point.label} must total 100%.`);
    }
  }
}

export async function loadDashboardData(): Promise<DashboardData> {
  const fileStats = await stat(workbookPath);

  if (!cachedDashboardData || fileStats.mtimeMs !== cachedModifiedTime) {
    cachedModifiedTime = fileStats.mtimeMs;
    cachedDashboardData = readDashboardData().catch((error) => {
      cachedDashboardData = null;
      throw error;
    });
  }

  return cachedDashboardData;
}
