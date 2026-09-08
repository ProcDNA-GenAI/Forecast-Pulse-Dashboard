export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-5" aria-label="Loading dashboard">
      <section className="dashboard-hero rounded-[18px] border border-white/70 px-5 py-5 shadow-[0_5px_20px_rgba(47,84,149,0.05)]">
        <div className="h-6 w-52 rounded bg-white/80" />
        <div className="mt-3 h-3 w-80 max-w-full rounded bg-white/65" />
      </section>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-28 rounded-[16px] border border-border bg-white p-4 shadow-[0_5px_20px_rgba(47,84,149,0.04)]">
            <div className="h-3 w-24 rounded bg-primary/10" />
            <div className="mt-3 h-7 w-20 rounded bg-primary/10" />
            <div className="mt-4 h-3 w-32 rounded bg-success/10" />
          </div>
        ))}
      </div>
      <section className="rounded-[18px] border border-border bg-white p-5 shadow-[0_5px_20px_rgba(47,84,149,0.04)]">
        <div className="h-6 w-56 rounded bg-primary/10" />
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="h-64 rounded-[14px] border border-border bg-page" />
          <div className="h-64 rounded-[14px] border border-border bg-page" />
        </div>
      </section>
    </div>
  );
}
