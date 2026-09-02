export default function DashboardLoading() {
  return (
    <div className="grid animate-pulse gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Loading dashboard">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="h-24 rounded-[14px] border border-border bg-surface/70" />
      ))}
    </div>
  );
}
