import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function WidgetHeader({ title, subtitle, action, className }: Props) {
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-black-85 truncate">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-black-45">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
