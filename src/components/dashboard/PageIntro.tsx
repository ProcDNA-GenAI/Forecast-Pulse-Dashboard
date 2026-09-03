type PageIntroProps = {
  title: string;
  description: string;
};

export function PageIntro({ title, description }: PageIntroProps) {
  return (
    <div>
      <h1 className="m-0 text-lg font-bold text-content">{title}</h1>
      <p className="mb-1.5 mt-0 text-[13px] text-muted">{description}</p>
      <p className="mb-3 mt-0 text-[11px] italic text-muted">
        All comparisons are vs. {FORECAST_LABEL} unless stated.
      </p>
    </div>
  );
}

export function SectionHeading({ title, question }: { title: string; question: string }) {
  return (
    <div className="mb-2.5 mt-6">
      <h2 className="m-0 text-[15px] font-bold text-content">
        {title} <span className="text-[12.5px] font-normal text-muted">— {question}</span>
      </h2>
    </div>
  );
}
import { FORECAST_LABEL } from "@/utils/dashboard/periods";
