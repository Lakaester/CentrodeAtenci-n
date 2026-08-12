import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function KpiHeader({ title, icon, action, className }: Props) {
  return (
    <div className={cn("flex items-start justify-between", className)}>
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-10 text-primary">
            {icon}
          </div>
        )}
        <p className="truncate text-[11px] font-medium text-black-45">
          {title}
        </p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
