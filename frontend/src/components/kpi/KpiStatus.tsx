import { cn } from "@/lib/utils";
import type { KpiStatusVariant } from "./types";

interface Props {
  variant: KpiStatusVariant;
  label: string;
  className?: string;
}

const DOT_COLORS: Record<KpiStatusVariant, string> = {
  success: "bg-success-50",
  warning: "bg-warning-50",
  danger: "bg-danger-50",
  neutral: "bg-[#94A3B8]",
};

export function KpiStatus({ variant, label, className }: Props) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-black-45", className)}>
      <span className={cn("h-2 w-2 rounded-full", DOT_COLORS[variant])} aria-hidden="true" />
      {label}
    </span>
  );
}
