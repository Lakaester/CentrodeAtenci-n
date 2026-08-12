import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function ChartHeader({ title, subtitle, action, className }: Props) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-black-85 truncate">{title}</h3>
        {subtitle && <p className="text-xs text-black-45">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 ml-3">{action}</div>}
    </div>
  );
}
