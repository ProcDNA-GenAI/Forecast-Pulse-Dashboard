import Image from "next/image";

export function FullPageLoader({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-5 py-8" role="status" aria-live="polite">
      <section className="w-full max-w-[390px] rounded-[22px] border border-border bg-white px-7 py-8 text-center shadow-[0_16px_42px_rgba(47,84,149,0.1)] sm:px-9">
        <Image
          src="/NAPlogo.svg"
          alt="NewAmsterdam Pharma"
          width={184}
          height={46}
          priority
          className="mx-auto h-[38px] w-auto"
        />
        <div className="mx-auto mt-7 h-9 w-9 animate-spin rounded-full border-[3px] border-primary/15 border-t-primary" aria-hidden="true" />
        <p className="mt-5 text-lg font-bold text-content">{message}</p>
        <p className="mt-1.5 text-sm text-muted">Loading your dashboard workspace</p>
        <div className="mx-auto mt-5 h-1.5 w-full max-w-[250px] overflow-hidden rounded-full bg-primary/8" aria-hidden="true">
          <span className="block h-full w-2/5 animate-pulse rounded-full bg-gradient-to-r from-primary to-secondary" />
        </div>
      </section>
      </div>
  );
}
