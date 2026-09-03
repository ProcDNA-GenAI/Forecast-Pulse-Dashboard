export type ChatRole = "assistant" | "user";
export type RoutingDecision = "COMPASS" | "DAE" | "BR" | "UNKNOWN";
export type MessageStatus = "complete" | "error" | "streaming";

export type DiseaseAreaOption = {
  diseasearea_id: string;
  diseasearea_name: string;
};

export type DatasourceOption = {
  id: string;
  name: string;
};

export type KnowledgeBaseStudyDocument = {
  document_id: string;
  document_name: string;
  file_type?: string;
};

export type KnowledgeBaseRespondent = {
  respondent_id: string;
  respondent_type: string;
  tags_attributes?: Record<string, unknown> | unknown[];
};

export type KnowledgeBaseStudy = {
  study_id: string;
  study_name: string;
  documents: KnowledgeBaseStudyDocument[];
  respondents: KnowledgeBaseRespondent[];
};

export type KnowledgeBaseLiteratureDocument = {
  document_id: string;
  document_name: string;
  document_description?: string;
  file_type?: string;
};

export type KnowledgeBaseLiteratureType = {
  literature_type_id: string;
  literature_type: string;
  documents: KnowledgeBaseLiteratureDocument[];
};

export type KnowledgeBaseCatalog = {
  study_selection: KnowledgeBaseStudy[];
  market_knowledge: KnowledgeBaseLiteratureType[];
};

export type DaeChunk = {
  chunk_id: string;
  chunk_text: string | null;
  document_id: string;
  chunk_type: string;
  document_name: string;
  file_type?: string;
  s3_url?: string;
  study_id: string | null;
  study_name: string;
};

export type DaeMetadata = {
  chat_id: string;
  QA_id: string;
  chatbot_response: string;
  chnk2id_map: Record<string, string>;
  chunk_mapping: Record<string, string>;
  Chunks: DaeChunk[];
};

export type ProcessingStep = {
  stage: string;
  message: string;
  title?: string;
  detail?: string;
  status: "active" | "complete" | "error";
  node: string;
  step: number;
  timestamp: number;
};

export type ChartPayload = {
  kind: string;
  data: Record<string, unknown>[];
  title?: string;
  description?: string;
  echartsOption?: Record<string, unknown>;
  optionLabel?: string;
  warnings?: string[];
};

export type ChartGroup = {
  title?: string;
  recommendedIndex: number;
  variants: ChartPayload[];
};

export type ResultTablePayload = {
  columns: string[];
  rows: Record<string, unknown>[];
  totalRowCount: number;
  incompleteNote?: string;
};

export type AnswerDataSource = {
  table?: string;
  full_path?: string;
  full_name?: string;
  database?: string;
  catalog?: string;
  schema?: string;
  source?: string;
  columns?: string[];
};

export type RequestCost = {
  total_usd: number;
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  llm_calls?: number;
  currency?: string;
};

export type AssistantMessageMeta = {
  failed?: boolean;
  route?: RoutingDecision;
  sql?: string;
  charts?: ChartPayload[];
  chartGroups?: ChartGroup[];
  streamingChart?: ChartPayload;
  resultTable?: ResultTablePayload;
  processingSteps?: ProcessingStep[];
  confidenceScore?: number | null;
  confidenceReason?: string | null;
  classification?: string;
  dataSources?: AnswerDataSource[];
  insights?: string[];
  tableReadingNotes?: string[];
  clarificationNeeded?: string | null;
  cost?: RequestCost;
  dae?: {
    threadId: string;
    qaId?: string;
    diseaseAreaId: string;
    chunks: DaeChunk[];
    chunkIdMap: Record<string, string>;
    chunkMapping: Record<string, string>;
  };
};

export type ChatMessage = {
  id: string;
  backendId?: number;
  role: ChatRole;
  content: string;
  status: MessageStatus;
  meta?: AssistantMessageMeta;
};

export type OrchestrateResponse = {
  trace_id: string;
  routed_to: RoutingDecision;
  routing_stage: "structural" | "classifier" | "default";
  confidence: "high" | "medium" | "low";
  sanitizer_triggered: boolean;
};

export type ChatBootstrapData = {
  diseaseArea: DiseaseAreaOption;
  datasource: DatasourceOption;
  catalog: KnowledgeBaseCatalog;
  studyCount: number;
  literatureDocumentCount: number;
};

export function createChatMessageId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()}`;
}
