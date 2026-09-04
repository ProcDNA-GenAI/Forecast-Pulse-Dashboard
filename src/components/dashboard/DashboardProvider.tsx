"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type TimeBucket = "QTD" | "YTD" | "LTD";

type DashboardContextValue = {
  bucket: TimeBucket;
  setBucket: (bucket: TimeBucket) => void;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [bucket, setBucket] = useState<TimeBucket>("LTD");
  const value = useMemo(() => ({ bucket, setBucket }), [bucket]);

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const context = useContext(DashboardContext);

  if (!context) {
    throw new Error("useDashboard must be used inside DashboardProvider.");
  }

  return context;
}
