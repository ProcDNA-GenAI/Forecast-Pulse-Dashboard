import Image from "next/image";

export function FullPageLoader({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-page px-4 py-5 sm:p-6" role="status" aria-live="polite">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-[1440px] overflow-hidden rounded-[28px] border border-border bg-white shadow-[0_18px_55px_rgba(47,84,149,0.1)] sm:min-h-[calc(100vh-3rem)]">
        <aside className="hidden w-[228px] shrink-0 rounded-r-[40px] bg-primary px-5 py-6 text-white sm:flex sm:flex-col">
          <Image src="/NAPlogo.svg" alt="NewAmsterdam Pharma" width={184} height={46} priority className="h-[46px] w-[184px]" />
          <div className="mt-10 space-y-3">
            <div className="h-11 rounded-full bg-white/16" />
            <div className="h-11 rounded-full bg-white/10" />
          </div>
          <div className="mt-auto border-t border-white/35 pt-5">
            <div className="h-10 w-32 rounded-full bg-white/12" />
          </div>
        </aside>
        <main className="flex min-w-0 flex-1 flex-col bg-page p-5 sm:p-7">
          <header className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-7 w-64 max-w-[60vw] rounded bg-primary/10" />
              <div className="h-3 w-40 rounded bg-primary/10" />
            </div>
            <div className="h-10 w-28 rounded-lg border border-border bg-white" />
          </header>
          <section className="dashboard-hero mt-6 rounded-[18px] border border-white/70 px-5 py-5 shadow-[0_5px_20px_rgba(47,84,149,0.05)]">
            <div className="h-6 w-52 rounded bg-white/80" />
            <div className="mt-3 h-3 w-80 max-w-full rounded bg-white/65" />
          </section>
          <section className="mt-5 rounded-[18px] border border-border bg-white p-5 shadow-[0_5px_20px_rgba(47,84,149,0.04)]">
            <div className="flex items-center justify-between gap-4">
              <div className="h-6 w-52 rounded bg-primary/10" />
              <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-primary/15 border-t-primary" aria-hidden="true" />
            </div>
            <p className="mt-5 text-lg font-bold text-content">{message}</p>
            <p className="mt-1.5 text-sm text-muted">Loading your dashboard workspace</p>
            <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-primary/8" aria-hidden="true">
              <span className="block h-full w-2/5 animate-pulse rounded-full bg-gradient-to-r from-primary to-secondary" />
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="h-48 rounded-[14px] border border-border bg-page" />
              <div className="h-48 rounded-[14px] border border-border bg-page" />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
