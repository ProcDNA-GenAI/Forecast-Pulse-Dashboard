import { Bot, Sparkles } from "lucide-react";

export function FullPageLoader({ message }: { message: string }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-page px-6" role="status" aria-live="polite">
      <div aria-hidden="true" className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-tertiary/10 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-28 -right-20 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative flex w-full max-w-xl flex-col items-center text-center">
        <div className="relative mb-7 flex h-24 w-24 items-center justify-center rounded-full bg-surface shadow-[0_18px_60px_rgba(8,50,96,0.18)]">
          <span className="absolute inset-0 rounded-full border-4 border-primary/10" />
          <span className="absolute inset-2 animate-spin rounded-full border-4 border-transparent border-r-accent border-t-primary" />
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary-deep to-secondary text-white shadow-inner">
            <Bot className="h-6 w-6" aria-hidden="true" />
            <Sparkles className="absolute -right-0.5 -top-0.5 h-4 w-4 text-accent" fill="currentColor" aria-hidden="true" />
          </span>
        </div>
        <p className="text-xl font-bold text-primary">{message}</p>
        <p className="mt-2 text-sm font-medium text-muted">Preparing Forecast Pulse securely</p>

        <div className="mt-8 w-full max-w-md space-y-3" aria-hidden="true">
          <div className="ml-auto h-11 w-7/12 animate-pulse rounded-2xl rounded-tr-sm bg-primary/10" />
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-primary/15" />
            <div className="flex-1 space-y-2 rounded-2xl rounded-tl-sm border border-primary/10 bg-surface px-4 py-3 shadow-sm">
              <div className="h-2.5 w-11/12 animate-pulse rounded-full bg-primary/15" />
              <div className="h-2.5 w-8/12 animate-pulse rounded-full bg-secondary/15" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
