import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  id?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function SectionCard({ id, title, subtitle, action, children, className, bodyClassName }: Props) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24 rounded-2xl border border-black-10 bg-white shadow-[0_1px_2px_rgba(76,91,95,0.04)]",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black-5 px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-[13px] font-semibold text-black-85">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[11px] leading-4 text-black-25">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}
