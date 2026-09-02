"use client";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="mx-auto mt-20 max-w-xl rounded-[14px] border border-danger/25 bg-surface p-8 text-center shadow-sm">
      <h1 className="m-0 text-xl font-bold text-content">Dashboard data could not be loaded</h1>
      <p className="mb-5 mt-2 text-sm text-muted">
        Check that the Excel workbook is present and that its sheet headers have not been removed or renamed.
      </p>
      <button
        type="button"
        onClick={reset}
        className="cursor-pointer rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-secondary"
      >
        Try again
      </button>
    </section>
  );
}
