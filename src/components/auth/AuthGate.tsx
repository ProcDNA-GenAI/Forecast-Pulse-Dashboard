"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAuth, currentRelativePath } from "@/context/AuthContext";
import { useChatBootstrap } from "@/context/ChatBootstrapContext";
import { FullPageLoader } from "./FullPageLoader";

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { beginLogin, isAuthenticated, isLoading } = useAuth();
  const { status: chatStatus } = useChatBootstrap();
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (!isLoginPage && !isLoading && !isAuthenticated) {
      beginLogin(currentRelativePath());
    }
  }, [beginLogin, isAuthenticated, isLoading, isLoginPage]);

  if (isLoginPage) {
    return children;
  }

  if (isLoading || !isAuthenticated) {
    return <FullPageLoader message="Checking your session…" />;
  }

  if (chatStatus === "idle" || chatStatus === "loading") {
    return <FullPageLoader message="Preparing your intelligence workspace…" />;
  }

  return children;
}
