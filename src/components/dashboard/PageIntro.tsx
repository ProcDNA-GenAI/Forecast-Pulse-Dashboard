import { FORECAST_LABEL } from "@/utils/dashboard/periods";

type PageIntroProps = {
  title: string;
  description: string;
};

export function PageIntro({ title, description }: PageIntroProps) {
  return (
    <section className="dashboard-hero mb-4 rounded-[18px] border border-[#f2e8e1] px-5 py-4 shadow-[0_4px_14px_rgba(47,84,149,0.025)]">
      <h1 className="m-0 text-xl font-bold text-primary">{title}</h1>
      <p className="mb-1 mt-2 text-[13px] text-[#5f626a]">{description}</p>
      <p className="mb-0 mt-1 text-[10.5px] text-muted">
        All comparisons are vs. {FORECAST_LABEL} unless stated.
      </p>
    </section>
  );
}

export function SectionHeading({
  emphasis,
  prefix,
  suffix,
}: {
  emphasis: string;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div className="mb-3 mt-7">
      <h2 className="m-0 text-lg font-bold text-primary">
        {prefix ? <span className="text-[12.5px] font-normal text-muted">{prefix}</span> : null}
        {emphasis}
        {suffix ? <span className="text-[12.5px] font-normal text-muted">{suffix}</span> : null}
      </h2>
    </div>
  );
}
