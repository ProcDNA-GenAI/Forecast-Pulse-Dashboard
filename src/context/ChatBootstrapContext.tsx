"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDatasources, getDiseaseAreas, getKnowledgeBaseCatalog } from "@/utils/chat/api";
import type { ChatBootstrapData } from "@/utils/chat/types";

type BootstrapStatus = "error" | "idle" | "loading" | "ready";
type ChatBootstrapContextValue = {
  status: BootstrapStatus;
  data: ChatBootstrapData | null;
  error: string | null;
  reload: () => void;
};

const ChatBootstrapContext = createContext<ChatBootstrapContextValue | null>(null);

function findByName<T extends { name: string }>(items: T[], preferredName: string) {
  const target = preferredName.trim().toLowerCase();
  return items.find((item) => item.name.trim().toLowerCase() === target) || items[0];
}

export function ChatBootstrapProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState<BootstrapStatus>("idle");
  const [data, setData] = useState<ChatBootstrapData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((current) => current + 1), []);

  useEffect(() => {
    if (!isAuthenticated) {
      setStatus("idle");
      setData(null);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setStatus("loading");
    setError(null);

    void (async () => {
      try {
        const [diseaseAreas, datasources] = await Promise.all([
          getDiseaseAreas(controller.signal),
          getDatasources(controller.signal),
        ]);
        if (!diseaseAreas.length) throw new Error("No disease area is configured for the Chat Assistant.");
        if (!datasources.length) throw new Error("No datasource is configured for the Chat Assistant.");

        const preferredArea = process.env.NEXT_PUBLIC_CHAT_DISEASE_AREA_NAME || "CVD";
        const selectedArea = findByName(
          diseaseAreas.map((item) => ({ ...item, name: item.diseasearea_name })),
          preferredArea,
        );
        const preferredDatasource = process.env.NEXT_PUBLIC_CHAT_DATASOURCE_NAME || "";
        const datasource = preferredDatasource ? findByName(datasources, preferredDatasource) : datasources[0];
        const catalog = await getKnowledgeBaseCatalog(selectedArea.diseasearea_id, controller.signal);
        const literatureDocumentCount = (catalog.market_knowledge || []).reduce(
          (total, group) => total + (group.documents?.length || 0),
          0,
        );

        setData({
          diseaseArea: {
            diseasearea_id: selectedArea.diseasearea_id,
            diseasearea_name: selectedArea.diseasearea_name,
          },
          datasource,
          catalog,
          studyCount: catalog.study_selection?.length || 0,
          literatureDocumentCount,
        });
        setStatus("ready");
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setData(null);
        setError(requestError instanceof Error ? requestError.message : "The Chat Assistant context could not be loaded.");
        setStatus("error");
      }
    })();

    return () => controller.abort();
  }, [isAuthenticated, reloadKey]);

  const value = useMemo(() => ({ status, data, error, reload }), [data, error, reload, status]);
  return <ChatBootstrapContext.Provider value={value}>{children}</ChatBootstrapContext.Provider>;
}

export function useChatBootstrap() {
  const context = useContext(ChatBootstrapContext);
  if (!context) throw new Error("useChatBootstrap must be used inside ChatBootstrapProvider.");
  return context;
}
