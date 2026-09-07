import type { ReactNode } from "react";

type DashboardCardProps = {
  children: ReactNode;
  className?: string;
};

export function DashboardCard({ children, className = "" }: DashboardCardProps) {
  return (
    <section className={`min-w-0 max-w-full rounded-[18px] border border-border bg-surface px-5 py-[18px] shadow-[0_4px_16px_rgba(47,84,149,0.035)] ${className}`}>
      {children}
    </section>
  );
}

type CardHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
};

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-2.5">
      <div className="min-w-0">
        <h3 className="m-0 text-[15px] font-bold text-content">{title}</h3>
        {subtitle ? <div className="mt-px text-[11.5px] text-muted">{subtitle}</div> : null}
      </div>
      {action}
    </div>
  );
}
