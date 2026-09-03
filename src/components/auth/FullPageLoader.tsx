import { Bot, Sparkles } from "lucide-react";

export function FullPageLoader({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-6" role="status">
      <div className="flex flex-col items-center text-center">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-surface shadow-[0_18px_55px_rgba(8,50,96,0.16)]">
          <span className="absolute inset-2 animate-spin rounded-[1.2rem] border-2 border-primary/10 border-t-secondary" />
          <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white">
            <Bot className="h-5 w-5" aria-hidden="true" />
            <Sparkles className="absolute -right-1 -top-1 h-3.5 w-3.5 text-accent" fill="currentColor" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-5 text-sm font-semibold text-primary">{message}</p>
        <p className="mt-1 text-xs text-muted">Preparing Forecast Pulse securely</p>
      </div>
    </div>
  );
}
