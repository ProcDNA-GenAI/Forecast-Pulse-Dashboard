import { Bot, Sparkles } from "lucide-react";

export function FullPageLoader({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-5 py-10" role="status" aria-live="polite">
      <section className="w-full max-w-[390px] overflow-hidden rounded-[22px] border border-primary/10 bg-white shadow-[0_24px_70px_rgba(47,84,149,0.16)]">
        <div className="bg-gradient-to-r from-primary via-primary to-success px-7 py-6 text-white">
          <div className="flex items-center gap-3">
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-accent text-primary-deep shadow-sm">
              <Bot className="h-5 w-5" aria-hidden="true" />
              <Sparkles className="absolute -right-1 -top-1 h-3.5 w-3.5 text-white" fill="currentColor" aria-hidden="true" />
            </span>
            <div className="text-left">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/75">NewAmsterdam Pharma</p>
              <h1 className="mt-1 text-lg font-bold">Forecast Pulse</h1>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center px-8 py-9 text-center">
          <div className="relative mb-5 flex h-11 w-11 items-center justify-center">
            <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-primary/12 border-r-success border-t-primary" />
            <span className="h-2 w-2 rounded-full bg-accent" />
          </div>
          <p className="text-lg font-bold text-content">{message}</p>
          <p className="mt-2 text-sm text-muted">Loading Forecast Pulse securely</p>
          <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-primary/8" aria-hidden="true">
            <span className="block h-full w-2/5 animate-pulse rounded-full bg-gradient-to-r from-primary to-success" />
          </div>
        </div>
      </section>
    </div>
  );
}
