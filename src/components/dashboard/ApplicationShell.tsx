"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ChatAssistant } from "@/components/chat/ChatAssistant";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardProvider } from "@/components/dashboard/DashboardProvider";

export function ApplicationShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return children;
  }

  return (
    <DashboardProvider>
      <ChatAssistant>
        <DashboardHeader />
        <main className="mx-auto max-w-[1340px] px-4 pb-16 pt-5 sm:px-6">{children}</main>
      </ChatAssistant>
    </DashboardProvider>
  );
}
