"use client";

import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ChatAssistant } from "@/components/chat/ChatAssistant";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardProvider } from "@/components/dashboard/DashboardProvider";
import { DashboardSidebar } from "./DashboardSidebar";

export function ApplicationShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  if (pathname === "/login") {
    return children;
  }

  return (
    <DashboardProvider>
      <DashboardSidebar isExpanded={isSidebarExpanded} onToggle={() => setIsSidebarExpanded((current) => !current)} />
      <div className={`min-h-screen transition-[margin-left] duration-300 ease-out ${isSidebarExpanded ? "ml-[72px] sm:ml-[228px]" : "ml-[72px]"}`}>
        <ChatAssistant>
          <DashboardHeader />
          <main className="mx-auto max-w-[1540px] px-4 pb-16 pt-5 sm:px-6 lg:px-7">{children}</main>
        </ChatAssistant>
      </div>
    </DashboardProvider>
  );
}
