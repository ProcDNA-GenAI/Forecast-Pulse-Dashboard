"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChatBootstrap } from "@/context/ChatBootstrapContext";
import {
  classifyQuestion,
  continueDocumentThread,
  createCompassChat,
  initiateDocumentThread,
  normalizeRoute,
  streamCompassQuestion,
} from "@/utils/chat/api";
import {
  createChatMessageId,
  type ChatMessage,
  type ProcessingStep,
  type RequestCost,
  type RoutingDecision,
} from "@/utils/chat/types";

const welcomeMessage: ChatMessage = {
  id: "forecast-pulse-chat-welcome",
  role: "assistant",
  content:
    "Hi! I’m your Forecast Pulse assistant. Ask me about market performance, claims data, business definitions, or the available market-research documents.",
  status: "complete",
};

function mergeStep(steps: ProcessingStep[], nextStep: ProcessingStep) {
  const existingIndex = steps.findIndex((step) =>
    nextStep.node ? step.node === nextStep.node : step.step === nextStep.step,
  );

  if (existingIndex < 0) {
    return [...steps, nextStep];
  }

  return steps.map((step, index) =>
    index === existingIndex ? { ...step, ...nextStep } : step,
  );
}

export function useChatAssistant() {
  const { data: bootstrapData, error: bootstrapError, reload, status: bootstrapStatus } = useChatBootstrap();
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [isSending, setIsSending] = useState(false);
  const [activeRoute, setActiveRoute] = useState<RoutingDecision | null>(null);
  const compassChatIdRef = useRef<string | null>(null);
  const documentThreadIdRef = useRef<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const sendingRef = useRef(false);

  useEffect(() => () => requestRef.current?.abort(), []);

  const updateAssistant = useCallback(
    (
      messageId: string,
      updater: (message: ChatMessage) => ChatMessage,
    ) => {
      setMessages((current) =>
        current.map((message) => (message.id === messageId ? updater(message) : message)),
      );
    },
    [],
  );

  const failMessage = useCallback(
    (messageId: string, error?: string) => {
      updateAssistant(messageId, (message) => ({
        ...message,
        content:
          error?.trim() ||
          "Sorry, I wasn’t able to process your question. Please try again.",
        status: "error",
        meta: { ...message.meta, failed: true },
      }));
    },
    [updateAssistant],
  );

  const sendMessage = useCallback(
    async (questionOverride?: string) => {
      const question = (questionOverride ?? inputValue).trim();
      if (!question || sendingRef.current) {
        return;
      }

      if (!bootstrapData) {
        setMessages((current) => [
          ...current,
          {
            id: createChatMessageId(),
            role: "assistant",
            content:
              bootstrapError ||
              "The Chat Assistant is still preparing its data sources. Please try again in a moment.",
            status: "error",
            meta: { failed: true },
          },
        ]);
        return;
      }

      sendingRef.current = true;
      setIsSending(true);
      setInputValue("");

      const userMessage: ChatMessage = {
        id: createChatMessageId(),
        role: "user",
        content: question,
        status: "complete",
      };
      const assistantMessageId = createChatMessageId();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        status: "streaming",
        meta: { processingSteps: [] },
      };

      setMessages((current) => [...current, userMessage, assistantMessage]);

      const controller = new AbortController();
      requestRef.current = controller;

      try {
        let route: "COMPASS" | "DAE" | "BR" = "COMPASS";
        try {
          const classification = await classifyQuestion(
            question,
            bootstrapData.diseaseArea.diseasearea_id,
            bootstrapData.datasource.id,
            controller.signal,
          );
          route = normalizeRoute(classification.routed_to);
        } catch (classificationError) {
          console.error("Question classification failed; using Compass:", classificationError);
        }

        setActiveRoute(route);
        updateAssistant(assistantMessageId, (message) => ({
          ...message,
          meta: { ...message.meta, route },
        }));

        let accumulated = "";
        const appendToken = (token: string) => {
          accumulated += token;
          updateAssistant(assistantMessageId, (message) => ({
            ...message,
            content: accumulated,
          }));
        };

        if (route === "DAE" || route === "BR") {
          let documentStepNumber = 0;
          const updateDocumentStatus = (status: string) => {
            documentStepNumber += 1;
            const step: ProcessingStep = {
              stage: route === "DAE" ? "market_research" : "business_rules",
              message: status,
              title: status,
              status: "active",
              node: `document-${documentStepNumber}`,
              step: documentStepNumber,
              timestamp: Date.now(),
            };
            updateAssistant(assistantMessageId, (message) => ({
              ...message,
              meta: {
                ...message.meta,
                processingSteps: [
                  ...(message.meta?.processingSteps || []).map((existingStep) => ({
                    ...existingStep,
                    status: existingStep.status === "active" ? "complete" as const : existingStep.status,
                  })),
                  step,
                ],
              },
            }));
          };

          const result = documentThreadIdRef.current
            ? await continueDocumentThread({
                threadId: documentThreadIdRef.current,
                question,
                classification: route,
                signal: controller.signal,
                onToken: appendToken,
                onStatus: updateDocumentStatus,
              })
            : await initiateDocumentThread({
                question,
                diseaseAreaId: bootstrapData.diseaseArea.diseasearea_id,
                datasourceId: bootstrapData.datasource.id,
                classification: route,
                signal: controller.signal,
                onToken: appendToken,
                onStatus: updateDocumentStatus,
              });

          if (!result.ok) {
            failMessage(assistantMessageId, result.error);
            return;
          }

          if (result.metadata?.chat_id) {
            documentThreadIdRef.current = result.metadata.chat_id;
          }

          updateAssistant(assistantMessageId, (message) => ({
            ...message,
            content: result.answer || accumulated,
            status: "complete",
            meta: {
              ...message.meta,
              route,
              processingSteps: message.meta?.processingSteps?.map((step) => ({
                ...step,
                status: "complete",
              })),
              dae: {
                threadId: result.metadata?.chat_id || documentThreadIdRef.current || "",
                qaId: result.metadata?.QA_id,
                diseaseAreaId: bootstrapData.diseaseArea.diseasearea_id,
                chunks: result.metadata?.Chunks || [],
                chunkIdMap: result.metadata?.chnk2id_map || {},
                chunkMapping: result.metadata?.chunk_mapping || {},
              },
            },
          }));
          return;
        }

        if (!compassChatIdRef.current) {
          const created = await createCompassChat(controller.signal);
          compassChatIdRef.current = created.chat_id;
        }

        const result = await streamCompassQuestion({
          chatId: compassChatIdRef.current,
          question,
          signal: controller.signal,
          onToken: appendToken,
          onStep: (step) => {
            updateAssistant(assistantMessageId, (message) => ({
              ...message,
              meta: {
                ...message.meta,
                processingSteps: mergeStep(message.meta?.processingSteps || [], step),
              },
            }));
          },
          onChart: (chart) => {
            updateAssistant(assistantMessageId, (message) => ({
              ...message,
              meta: { ...message.meta, streamingChart: chart || undefined },
            }));
          },
        });

        if (!result.ok) {
          failMessage(assistantMessageId, result.error);
          return;
        }

        updateAssistant(assistantMessageId, (message) => ({
          ...message,
          backendId: result.messageId,
          content: result.answer || accumulated,
          status: "complete",
          meta: {
            ...message.meta,
            route,
            sql: result.sql,
            charts: result.charts,
            chartGroups: result.chartGroups,
            streamingChart: undefined,
            resultTable: result.resultTable,
            processingSteps: result.processingSteps,
            confidenceScore: result.confidenceScore,
            confidenceReason: result.confidenceReason,
            classification: result.classification,
            dataSources: result.dataSources,
            insights: result.insights,
            tableReadingNotes: result.tableReadingNotes,
            clarificationNeeded: result.clarificationNeeded,
            cost: result.cost as RequestCost | undefined,
          },
        }));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          failMessage(assistantMessageId, "The request was cancelled.");
        } else {
          failMessage(
            assistantMessageId,
            error instanceof Error ? error.message : undefined,
          );
        }
      } finally {
        if (requestRef.current === controller) {
          requestRef.current = null;
        }
        sendingRef.current = false;
        setIsSending(false);
      }
    },
    [bootstrapData, bootstrapError, failMessage, inputValue, updateAssistant],
  );

  const startNewConversation = useCallback(() => {
    if (sendingRef.current) {
      return;
    }
    compassChatIdRef.current = null;
    documentThreadIdRef.current = null;
    setActiveRoute(null);
    setInputValue("");
    setMessages([welcomeMessage]);
  }, []);

  return {
    activeRoute,
    bootstrapData,
    bootstrapError,
    bootstrapStatus,
    inputValue,
    isSending,
    messages,
    reloadBootstrap: reload,
    sendMessage,
    setInputValue,
    startNewConversation,
  };
}
