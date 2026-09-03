"use client";

import { Bot, LogIn, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { consumeSessionExpiredMessage } from "@/utils/api/client";

const errorMessages: Record<string, string> = {
  role_required: "Your Microsoft account has not been assigned access to this application.",
  identity_conflict: "This Microsoft account could not be linked. Contact an administrator.",
  microsoft_denied: "Microsoft sign-in was cancelled or denied.",
  missing_flow: "The sign-in attempt expired. Please try again.",
  token_exchange_failed: "Microsoft could not complete sign-in. Please try again.",
  invalid_callback: "The sign-in response was invalid or expired. Please try again.",
  callback_failed: "Sign-in could not be completed. Please try again.",
};

function safeNextPath() {
  const nextPath = new URLSearchParams(window.location.search).get("next");
  return nextPath?.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/";
}

export default function LoginPage() {
  const { authMode, beginLogin, isAuthenticated, isLoading } = useAuth();
  const initialized = useRef(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (initialized.current || isLoading || isAuthenticated) {
      return;
    }

    initialized.current = true;
    const params = new URLSearchParams(window.location.search);
    const errorCode = params.get("error");
    const sessionMessage = consumeSessionExpiredMessage();

    if (errorCode) {
      setMessage(errorMessages[errorCode] ?? "Microsoft sign-in failed. Please try again.");
      return;
    }

    if (sessionMessage) {
      setMessage(sessionMessage);
    }

    setIsRedirecting(true);
    beginLogin(safeNextPath());
  }, [authMode, beginLogin, isAuthenticated, isLoading]);

  const signIn = () => {
    setMessage("");
    setIsRedirecting(true);
    beginLogin(safeNextPath());
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-page px-5 py-10">
      <div aria-hidden="true" className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-tertiary/10 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-40 -right-28 h-[28rem] w-[28rem] rounded-full bg-accent/10 blur-3xl" />

      <section className="relative w-full max-w-[460px] overflow-hidden rounded-3xl border border-primary/10 bg-surface shadow-[0_28px_80px_rgba(8,50,96,0.16)]">
        <div className="bg-gradient-to-r from-primary-deep via-primary to-secondary px-8 py-8 text-white">
          <div className="flex items-center gap-3">
            <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary-deep shadow-lg">
              <Bot className="h-6 w-6" aria-hidden="true" />
              <Sparkles className="absolute -right-1 -top-1 h-4 w-4 text-white" fill="currentColor" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-soft">NewAmsterdam Pharma</p>
              <h1 className="mt-1 text-xl font-bold">Forecast Pulse</h1>
            </div>
          </div>
        </div>

        <div className="px-8 py-9 text-center">
          <h2 className="text-xl font-bold text-content">Sign in to continue</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
            {message || "Use your organization Microsoft account to access the dashboard and Chat Assistant."}
          </p>

          {isLoading || isRedirecting ? (
            <div className="mt-7 flex items-center justify-center gap-3 text-sm font-semibold text-primary" role="status">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/15 border-t-secondary" />
              {isRedirecting
                ? authMode === "demo"
                  ? "Opening demo session…"
                  : "Opening Microsoft sign in…"
                : "Checking your session…"}
            </div>
          ) : (
            <button
              type="button"
              onClick={signIn}
              className="mt-7 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(8,50,96,0.2)] transition hover:-translate-y-0.5 hover:bg-secondary"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              {authMode === "demo" ? "Continue as Demo User" : "Sign in with Microsoft"}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
