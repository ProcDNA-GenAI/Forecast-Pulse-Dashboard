import {
  apiRequestUrl,
  apiUrl,
  fetchWithSession,
  readApiError,
  requestSignal,
} from "@/utils/api/client";
import type {
  AnswerDataSource,
  ChartGroup,
  ChartPayload,
  DaeMetadata,
  DatasourceOption,
  DiseaseAreaOption,
  KnowledgeBaseCatalog,
  OrchestrateResponse,
  ProcessingStep,
  ResultTablePayload,
  RoutingDecision,
} from "./types";

type BackendChartConfig = {
  should_chart?: boolean;
  reason?: string;
  chart_type?: string;
  type?: string;
  title?: string;
  description?: string;
  data?: Record<string, unknown>[];
  preview_data?: Record<string, unknown>[];
  full_data?: Record<string, unknown>[];
  echarts_option?: Record<string, unknown>;
  preview_echarts_option?: Record<string, unknown>;
  full_echarts_option?: Record<string, unknown>;
  option_label?: string;
  warnings?: string[];
  charts?: BackendChartConfig[];
};

type BackendChartGroup = {
  title?: string;
  recommended_index?: number;
  variants?: BackendChartConfig[];
};

type BackendCompassComplete = {
  chat_id: string;
  message_id?: number;
  answer: string;
  sql?: string | null;
  rows?: Record<string, unknown>[];
  chart_config?: BackendChartConfig | BackendChartConfig[] | null;
  chart_options?: BackendChartConfig[] | null;
  chart_groups?: BackendChartGroup[] | null;
  metadata?: Record<string, unknown>;
};

export type CompassStreamResult = {
  ok: boolean;
  error?: string;
  messageId?: number;
  answer: string;
  sql?: string;
  charts: ChartPayload[];
  chartGroups: ChartGroup[];
  resultTable?: ResultTablePayload;
  processingSteps: ProcessingStep[];
  confidenceScore?: number | null;
  confidenceReason?: string | null;
  classification?: string;
  dataSources?: AnswerDataSource[];
  insights?: string[];
  tableReadingNotes?: string[];
  clarificationNeeded?: string | null;
  cost?: Record<string, unknown>;
};

export type DaeStreamResult = {
  ok: boolean;
  answer: string;
  metadata: DaeMetadata | null;
  error?: string;
};

const jsonHeaders = {
  accept: "application/json",
  "Content-Type": "application/json",
};

export async function getDiseaseAreas(signal?: AbortSignal) {
  const response = await fetchWithSession(apiUrl("/dae/diseaseareas"), {
    method: "GET",
    headers: { accept: "application/json" },
    signal: requestSignal(signal, 60_000),
  });
  const bodyText = await response.text();
  if (!response.ok) {
    throw new Error(readApiError(bodyText, "Failed to load disease areas."));
  }
  const items = JSON.parse(bodyText) as Array<{ id: string; name: string }>;
  return items.map<DiseaseAreaOption>((item) => ({
    diseasearea_id: item.id,
    diseasearea_name: item.name,
  }));
}

export async function getDatasources(signal?: AbortSignal) {
  const response = await fetchWithSession(apiUrl("/dae/datasources"), {
    method: "GET",
    headers: { accept: "application/json" },
    signal: requestSignal(signal, 60_000),
  });
  const bodyText = await response.text();
  if (!response.ok) {
    throw new Error(readApiError(bodyText, "Failed to load datasources."));
  }
  return JSON.parse(bodyText) as DatasourceOption[];
}

export async function getKnowledgeBaseCatalog(diseaseAreaId: string, signal?: AbortSignal) {
  const url = apiRequestUrl("/dae/chat/diseasearea_documents");
  url.searchParams.set("diseasearea_id", diseaseAreaId);
  const response = await fetchWithSession(url, {
    method: "GET",
    headers: { accept: "application/json" },
    signal: requestSignal(signal, 60_000),
  });
  const bodyText = await response.text();
  if (!response.ok) {
    throw new Error(readApiError(bodyText, "Failed to load the document catalog."));
  }
  return JSON.parse(bodyText) as KnowledgeBaseCatalog;
}

export async function classifyQuestion(
  question: string,
  diseaseAreaId: string,
  datasourceId: string,
  signal?: AbortSignal,
) {
  const response = await fetchWithSession(apiUrl("/orchestrate/classify"), {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({
      user_query: question,
      disease_area_id: diseaseAreaId,
      datasource_id: datasourceId,
    }),
    signal: requestSignal(signal, 60_000),
  });
  const bodyText = await response.text();
  if (!response.ok) {
    throw new Error(readApiError(bodyText, "The question classifier is unavailable."));
  }
  return JSON.parse(bodyText) as OrchestrateResponse;
}

export async function createCompassChat(signal?: AbortSignal) {
  const response = await fetchWithSession(apiUrl("/chat/create-chat"), {
    method: "POST",
    headers: jsonHeaders,
    signal: requestSignal(signal, 60_000),
  });
  const bodyText = await response.text();
  if (!response.ok) {
    throw new Error(readApiError(bodyText, "Failed to create a chat session."));
  }
  return JSON.parse(bodyText) as { chat_id: string; greeting: string };
}

function normalizeStepStatus(value: unknown): ProcessingStep["status"] {
  if (value === "complete" || value === "completed") return "complete";
  if (value === "error" || value === "failed") return "error";
  return "active";
}

function toChartPayload(config: BackendChartConfig | null | undefined): ChartPayload | null {
  if (!config) return null;
  if (config.should_chart === false) return null;
  const kind = (config.chart_type || config.type || "chart").toLowerCase();
  if (kind === "none" || kind === "table") return null;

  return {
    kind,
    data: config.full_data || config.data || config.preview_data || [],
    title: config.title,
    description: config.description,
    echartsOption: config.full_echarts_option || config.echarts_option || config.preview_echarts_option,
    optionLabel: config.option_label,
    warnings: config.warnings,
  };
}

function toChartPayloads(input: BackendChartConfig | BackendChartConfig[] | null | undefined): ChartPayload[] {
  if (!input) return [];
  const configs = Array.isArray(input) ? input : [input];
  return configs.flatMap((config) => {
    const ownChart = toChartPayload(config);
    const nested = config.charts?.flatMap((item) => toChartPayloads(item)) || [];
    return ownChart ? [ownChart, ...nested] : nested;
  });
}

function buildResultTable(rows: Record<string, unknown>[], metadata: Record<string, unknown>): ResultTablePayload | undefined {
  if (!rows.length) return undefined;
  const incomplete = metadata.incomplete_data;
  const incompleteNote = incomplete && typeof incomplete === "object" && typeof (incomplete as { note?: unknown }).note === "string"
    ? (incomplete as { note: string }).note
    : undefined;
  return {
    columns: Object.keys(rows[0]),
    rows,
    totalRowCount: typeof metadata.row_count === "number" ? Math.max(rows.length, metadata.row_count) : rows.length,
    incompleteNote,
  };
}

function parseCompassComplete(data: BackendCompassComplete, steps: ProcessingStep[]): CompassStreamResult {
  const metadata = data.metadata || {};
  const rows = Array.isArray(data.rows) ? data.rows : [];
  const chartOptions = Array.isArray(metadata.chart_options) ? metadata.chart_options as BackendChartConfig[] : data.chart_options;
  const charts = toChartPayloads(chartOptions?.length ? chartOptions : data.chart_config);
  const rawGroups = Array.isArray(metadata.chart_groups) ? metadata.chart_groups as BackendChartGroup[] : data.chart_groups;
  const parsedChartGroups = rawGroups?.flatMap<ChartGroup>((group) => {
    const variants = toChartPayloads(group.variants);
    return variants.length ? [{ title: group.title, recommendedIndex: group.recommended_index || 0, variants }] : [];
  }) || [];
  const chartGroups = parsedChartGroups.length
    ? parsedChartGroups
    : charts.length
      ? [{ recommendedIndex: 0, variants: charts }]
      : [];

  return {
    ok: true,
    messageId: data.message_id,
    answer: data.answer,
    sql: data.sql || undefined,
    charts,
    chartGroups,
    resultTable: buildResultTable(rows, metadata),
    processingSteps: steps.map((step) => ({ ...step, status: step.status === "active" ? "complete" : step.status })),
    confidenceScore: typeof metadata.confidence_score === "number" ? metadata.confidence_score : null,
    confidenceReason: typeof metadata.confidence_reason === "string" ? metadata.confidence_reason : null,
    classification: typeof metadata.classification === "string" ? metadata.classification : undefined,
    dataSources: Array.isArray(metadata.data_sources) ? metadata.data_sources as AnswerDataSource[] : undefined,
    insights: Array.isArray(metadata.insights) ? metadata.insights as string[] : undefined,
    tableReadingNotes: Array.isArray(metadata.table_reading_notes) ? metadata.table_reading_notes as string[] : undefined,
    clarificationNeeded: typeof metadata.clarification_needed === "string" ? metadata.clarification_needed : null,
    cost: metadata.cost && typeof metadata.cost === "object" ? metadata.cost as Record<string, unknown> : undefined,
  };
}

export async function streamCompassQuestion({
  chatId, question, signal, onToken, onStep, onChart,
}: {
  chatId: string;
  question: string;
  signal?: AbortSignal;
  onToken?: (token: string) => void;
  onStep?: (step: ProcessingStep) => void;
  onChart?: (chart: ChartPayload | null) => void;
}): Promise<CompassStreamResult> {
  const response = await fetchWithSession(apiUrl("/chat/continue-chat-stream"), {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ chat_id: chatId, message: question }),
    signal: requestSignal(signal),
  });
  if (!response.ok) {
    const bodyText = await response.text();
    return { ok: false, error: readApiError(bodyText, "The chat request failed."), answer: "", charts: [], chartGroups: [], processingSteps: [] };
  }

  const reader = response.body?.getReader();
  if (!reader) return { ok: false, error: "The backend returned no response stream.", answer: "", charts: [], chartGroups: [], processingSteps: [] };

  const decoder = new TextDecoder();
  const steps: ProcessingStep[] = [];
  let buffer = "";
  let complete: BackendCompassComplete | null = null;
  let errorMessage = "";

  const processLine = (line: string) => {
    if (!line.startsWith("data: ")) return;
    try {
      const event = JSON.parse(line.slice(6)) as Record<string, unknown>;
      if (event.type === "token" && typeof event.text === "string") {
        onToken?.(event.text);
      } else if (event.type === "status" && typeof event.message === "string") {
        const step: ProcessingStep = {
          stage: typeof event.stage === "string" ? event.stage : "processing",
          message: event.message,
          title: typeof event.title === "string" ? event.title : undefined,
          detail: typeof event.detail === "string" ? event.detail : undefined,
          status: normalizeStepStatus(event.status),
          node: typeof event.node === "string" ? event.node : "",
          step: typeof event.step === "number" ? event.step : steps.length + 1,
          timestamp: Date.now(),
        };
        const index = steps.findIndex((item) => step.node ? item.node === step.node : item.step === step.step);
        if (index >= 0) steps[index] = { ...steps[index], ...step };
        else steps.push(step);
        onStep?.(step);
      } else if (event.type === "chart") {
        onChart?.(toChartPayload(event.chart_config as BackendChartConfig | null));
      } else if (event.type === "complete" && event.data && typeof event.data === "object") {
        complete = event.data as BackendCompassComplete;
      } else if (event.type === "error" && typeof event.message === "string") {
        errorMessage = event.message;
      }
    } catch (error) {
      console.error("Unable to read a chat stream event:", error);
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      lines.forEach(processLine);
    }
    if (buffer.trim()) processLine(buffer);
  } finally {
    reader.releaseLock();
  }

  if (errorMessage) return { ok: false, error: errorMessage, answer: "", charts: [], chartGroups: [], processingSteps: steps };
  if (!complete) return { ok: false, error: "The response stream ended before the answer was completed.", answer: "", charts: [], chartGroups: [], processingSteps: steps };
  return parseCompassComplete(complete, steps);
}

async function consumeDaeStream(response: Response, onToken?: (token: string) => void, onStatus?: (status: string) => void): Promise<DaeStreamResult> {
  if (!response.ok) {
    const bodyText = await response.text();
    return { ok: false, answer: "", metadata: null, error: readApiError(bodyText, "The document assistant request failed.") };
  }
  const reader = response.body?.getReader();
  if (!reader) return { ok: false, answer: "", metadata: null, error: "The backend returned no response stream." };

  const decoder = new TextDecoder();
  let buffer = "";
  let answer = "";
  let finalAnswer = "";
  let metadata: DaeMetadata | null = null;
  let errorMessage = "";

  const processLine = (line: string) => {
    if (!line.startsWith("data: ")) return;
    try {
      const event = JSON.parse(line.slice(6)) as Record<string, unknown>;
      if (event.type === "token" && typeof event.content === "string") {
        answer += event.content;
        onToken?.(event.content);
      } else if (event.type === "statement" && typeof event.content === "string") {
        onStatus?.(event.content);
      } else if (event.type === "metadata" && event.content && typeof event.content === "object") {
        metadata = event.content as DaeMetadata;
      } else if (event.type === "final" && typeof event.content === "string") {
        finalAnswer = event.content;
      } else if (event.type === "error" && typeof event.message === "string") {
        errorMessage = event.message;
      }
    } catch (error) {
      console.error("Unable to read a document stream event:", error);
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      lines.forEach(processLine);
    }
    if (buffer.trim()) processLine(buffer);
  } finally {
    reader.releaseLock();
  }

  if (errorMessage) return { ok: false, answer: "", metadata: null, error: errorMessage };
  return { ok: true, answer: finalAnswer || answer, metadata };
}

export async function initiateDocumentThread({
  question, diseaseAreaId, datasourceId, classification, signal, onToken, onStatus,
}: {
  question: string;
  diseaseAreaId: string;
  datasourceId: string;
  classification: "DAE" | "BR";
  signal?: AbortSignal;
  onToken?: (token: string) => void;
  onStatus?: (status: string) => void;
}) {
  const response = await fetchWithSession(apiUrl("/dae/chat/compass/initiate_thread"), {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ user_query: question, disease_area_id: diseaseAreaId, datasource_id: datasourceId, classification }),
    signal: requestSignal(signal),
  });
  return consumeDaeStream(response, onToken, onStatus);
}

export async function continueDocumentThread({
  threadId, question, classification, signal, onToken, onStatus,
}: {
  threadId: string;
  question: string;
  classification: "DAE" | "BR";
  signal?: AbortSignal;
  onToken?: (token: string) => void;
  onStatus?: (status: string) => void;
}) {
  const url = apiRequestUrl("/dae/chat/continue_chat");
  url.searchParams.set("thread_id", threadId);
  url.searchParams.set("user_query", question);
  url.searchParams.set("classification", classification);
  const response = await fetchWithSession(url, {
    method: "POST",
    headers: { accept: "application/json" },
    signal: requestSignal(signal),
  });
  return consumeDaeStream(response, onToken, onStatus);
}

export async function getDocumentDownloadUrl(documentId: string) {
  const response = await fetchWithSession(apiUrl(`/dae/study/documents/${documentId}/download`), {
    method: "GET",
    headers: { accept: "application/json" },
  });
  const bodyText = await response.text();
  if (!response.ok) throw new Error(readApiError(bodyText, "Failed to prepare the document download."));
  const data = JSON.parse(bodyText) as { download_url?: string };
  if (!data.download_url) throw new Error("The backend did not return a document download URL.");
  return data.download_url;
}

export function normalizeRoute(route: RoutingDecision): "COMPASS" | "DAE" | "BR" {
  return route === "DAE" || route === "BR" ? route : "COMPASS";
}
